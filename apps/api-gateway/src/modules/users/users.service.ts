import { HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { UserServiceClient } from '../../infrastructure/external-services/user-service.client';
import { WalletServiceClient } from '../../infrastructure/external-services/wallet-service.client';
import { RelationshipServiceClient } from '../../infrastructure/external-services/relationship-service.client';
import { ClientProxy } from '@nestjs/microservices';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { WalletDoc } from '../../interfaces/wallet-doc.interface';
import { UserRelationshipDoc } from '../../interfaces/user-relationship-doc.interface';

// Import the interfaces from the client
import type {
  GetUserProfileRequest,
  UpdateUserDisplayNameRequest,
  UpdateUserBioRequest,
  UpdateUserAvatarRequest,
  UpdateUserRoleRequest,
  VerifyUsernameCodeRequest,
  ChangeUsernameRequest,
  VerifyEmailCodeRequest,
  NewEmailInitiateRequest,
  VerifyNewEmailCodeRequest,
  SearchUsersRequest,
  SearchUsernameRequest,
  SearchEmailRequest,
} from '../../interfaces/user-service.interface';

import { MESSAGES } from 'apps/wallet/src/constants/messages.constants';
import { UserNeo4jDoc } from 'apps/neo4jdb-sync/src/interfaces/user-neo4j-doc.interface';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { OnlineService } from './online.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly walletServiceClient: WalletServiceClient,
    private readonly relationshipServiceClient: RelationshipServiceClient,
    @Inject('NEO4JDB_SYNC_SERVICE')
    private readonly neo4jdbUpdateUserService: ClientProxy,
    private readonly cacheService: CacheService,
    private readonly onlineService: OnlineService,
  ) {}

  // ==================== PROFILE METHODS ====================

  /**
   * Get user profile by user ID
   */
  async getUserProfile(
    data: GetUserProfileRequest,
    authorization: string,
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Getting profile for user: ${data.user_id}`);
      // Try get user data from cache
      let full_user_profile_data: UserDoc | null =
        await this.cacheService.getUserData({
          user_id: data.user_id,
        });
      if (!full_user_profile_data) {
        this.logger.log(
          `User data not found in cache, getting from user service`,
        );
        const full_user_profile_data_response: Response<UserDoc> =
          await this.getUserProfileData(data, authorization);
        if (
          !full_user_profile_data_response.success ||
          !full_user_profile_data_response.data
        ) {
          this.logger.error(
            `Failed to get profile for user: ${data.user_id}: ${full_user_profile_data_response.message}`,
          );
          return full_user_profile_data_response;
        }
        full_user_profile_data = full_user_profile_data_response.data;
        // Cache user data
        await this.cacheService.userData({
          user_id: data.user_id,
          data: full_user_profile_data,
        });
      }
      if (!full_user_profile_data) {
        this.logger.error(`Failed to get profile for user: ${data.user_id}`);
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.ERROR.PROFILE_NOT_FOUND,
        };
      }
      // Get user relationship data with graceful degradation
      let user_relationship_data: UserRelationshipDoc | undefined = undefined;

      try {
        let user_relationship_response: Response<UserRelationshipDoc> =
          await this.relationshipServiceClient.getUser(data, authorization);

        // Compare and sync to Neo4j
        const is_synced = await this.syncNeo4jUser(
          full_user_profile_data,
          user_relationship_response.data as UserNeo4jDoc,
        );

        if (is_synced) {
          user_relationship_response =
            await this.relationshipServiceClient.getUser(data, authorization);
        }

        if (
          user_relationship_response.success &&
          user_relationship_response.data
        ) {
          user_relationship_data = user_relationship_response.data;
          this.logger.log(
            `Successfully got user relationship for user: ${data.user_id}`,
          );

          // Attach user relationship data to user profile
          full_user_profile_data.following_number =
            user_relationship_data.following_number;
          full_user_profile_data.followers_number =
            user_relationship_data.followers_number;
          full_user_profile_data.is_following =
            user_relationship_data.is_following;
          full_user_profile_data.is_follower =
            user_relationship_data.is_follower;
          full_user_profile_data.is_blocked = user_relationship_data.is_blocked;
          full_user_profile_data.is_blocked_by =
            user_relationship_data.is_blocked_by;
          full_user_profile_data.mutual_followers_number =
            user_relationship_data.mutual_followers_number;
          full_user_profile_data.mutual_followers_list =
            user_relationship_data.mutual_followers_list;
        } else {
          this.logger.warn(
            `Relationship data not found for user: ${data.user_id}`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch relationship data for user ${data.user_id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      // Get user online status
      try {
        const isOnline = await this.onlineService.isOnline(data.user_id);
        full_user_profile_data.is_online = isOnline;
        this.logger.log(`User ${data.user_id} online status: ${isOnline}`);
      } catch (error) {
        this.logger.warn(
          `Failed to check online status for user ${data.user_id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        full_user_profile_data.is_online = false; // Default to offline if check fails
      }

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: full_user_profile_data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get profile for user ${data.user_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Get current user profile (requires authorization)
   */
  async getMyProfile(authorization: string): Promise<Response<UserDoc>> {
    try {
      this.logger.log('Getting current user profile');
      const get_my_profile_response: Response<UserDoc> =
        await this.userServiceClient.getMyProfile(authorization);

      if (!get_my_profile_response.success || !get_my_profile_response.data) {
        this.logger.error(
          `Failed to get current user profile: ${get_my_profile_response.message}`,
        );
        return get_my_profile_response;
      }

      // Get user primary wallet with graceful degradation
      let user_primary_wallet_data: WalletDoc | undefined = undefined;
      let user_wallets_data: WalletDoc[] | undefined = undefined;

      try {
        const get_my_primary_wallet_response: Response<WalletDoc> =
          await this.walletServiceClient.getPrimaryWallet(authorization);
        const get_my_wallets_response: Response<WalletDoc[]> =
          await this.walletServiceClient.getWallets(authorization);

        if (
          get_my_primary_wallet_response.success &&
          get_my_primary_wallet_response.data
        ) {
          user_primary_wallet_data = get_my_primary_wallet_response.data;
          this.logger.log(
            'Successfully fetched primary wallet for current user',
          );
          if (get_my_wallets_response.success && get_my_wallets_response.data) {
            user_wallets_data = get_my_wallets_response.data;
          } else {
            this.logger.warn('Wallets not found for current user');
          }
        } else {
          this.logger.warn('Wallets not found for current user');
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch primary wallet for current user: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      const full_user_profile_data: UserDoc = {
        ...get_my_profile_response.data,
        primary_wallet: user_primary_wallet_data,
        wallets: user_wallets_data,
      };

      // Get user relationship data with graceful degradation
      let user_relationship_data: UserRelationshipDoc | undefined = undefined;
      const user_id = get_my_profile_response.data._id;

      try {
        let user_relationship_response: Response<UserRelationshipDoc> =
          await this.relationshipServiceClient.getUser(
            {
              user_id: user_id,
            },
            authorization,
          );

        // Compare and sync to Neo4j
        const is_synced = await this.syncNeo4jUser(
          get_my_profile_response.data,
          user_relationship_response.data as UserNeo4jDoc,
        );

        if (is_synced) {
          user_relationship_response =
            await this.relationshipServiceClient.getUser(
              {
                user_id: user_id,
              },
              authorization,
            );
        }

        if (
          user_relationship_response.success &&
          user_relationship_response.data
        ) {
          user_relationship_data = user_relationship_response.data;
          this.logger.log(
            `Successfully got user relationship for user: ${user_id}`,
          );

          // Attach user relationship data to user profile
          full_user_profile_data.following_number =
            user_relationship_data.following_number;
          full_user_profile_data.followers_number =
            user_relationship_data.followers_number;
        } else {
          this.logger.warn(`Relationship data not found for user: ${user_id}`);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch relationship data for current user: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      // Get current user online status
      try {
        const isOnline = await this.onlineService.isOnline(user_id);
        full_user_profile_data.is_online = isOnline;
        this.logger.log(`Current user ${user_id} online status: ${isOnline}`);
      } catch (error) {
        this.logger.warn(
          `Failed to check online status for current user ${user_id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        full_user_profile_data.is_online = false; // Default to offline if check fails
      }

      const responseMessage = user_primary_wallet_data
        ? MESSAGES.SUCCESS.PROFILE_FETCHED
        : `${MESSAGES.SUCCESS.PROFILE_FETCHED} (Wallet data unavailable)` +
          (user_relationship_data
            ? ''
            : ` (User relationship data unavailable)`);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: responseMessage,
        data: full_user_profile_data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get current user profile: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Update user display name
   */
  async updateUserDisplayName(
    data: UpdateUserDisplayNameRequest,
    authorization: string,
    user_id: string,
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating display name for user`);
      const response: Response<UserDoc> =
        await this.userServiceClient.updateUserDisplayName(data, authorization);

      if (!response.success || !response.data) {
        this.logger.error(
          `Failed to update display name for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully updated display name for user`);
      }

      // Delete user data from cache
      await this.cacheService.userChangedData({
        user_id: user_id,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to update display name for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Update user bio
   */
  async updateUserBio(
    data: UpdateUserBioRequest,
    authorization: string,
    user_id: string,
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating bio for user`);
      const response: Response<UserDoc> =
        await this.userServiceClient.updateUserBio(data, authorization);

      if (!response.success || !response.data) {
        this.logger.error(`Failed to update bio for user: ${response.message}`);
      } else {
        this.logger.log(`Successfully updated bio for user`);
      }

      // Delete user data from cache
      await this.cacheService.userChangedData({
        user_id: user_id,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to update bio for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Update user avatar
   */
  async updateUserAvatar(
    data: UpdateUserAvatarRequest,
    authorization: string,
    user_id: string,
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating avatar for user`);
      const response: Response<UserDoc> =
        await this.userServiceClient.updateUserAvatar(data, authorization);

      if (!response.success || !response.data) {
        this.logger.error(
          `Failed to update avatar for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully updated avatar for user`);
      }

      // Delete user data from cache
      await this.cacheService.userChangedData({
        user_id: user_id,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to update avatar for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    data: UpdateUserRoleRequest,
    authorization: string,
    user_id: string,
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating role for user to ${data.role}`);
      const response: Response<UserDoc> =
        await this.userServiceClient.updateUserRole(data, authorization);

      if (!response.success || !response.data) {
        this.logger.error(`Failed to update user role: ${response.message}`);
      } else {
        this.logger.log(`Successfully updated user role`);
      }

      // Delete user data from cache
      await this.cacheService.userChangedData({
        user_id: user_id,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to update role for user to ${data.role}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // ==================== USERNAME MANAGEMENT METHODS ====================

  /**
   * Initiate username change process
   */
  async changeUsernameInitiate(authorization: string): Promise<Response<void>> {
    try {
      this.logger.log(`Initiating username change for user`);
      const response =
        await this.userServiceClient.changeUsernameInitiate(authorization);

      if (!response.success) {
        this.logger.error(
          `Failed to initiate username change for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully initiated username change for user`);
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to initiate username change for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Verify username change email code
   */
  async changeUsernameVerifyEmail(
    data: VerifyUsernameCodeRequest,
    authorization: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(`Verifying username change code for user`);
      const response = await this.userServiceClient.changeUsernameVerifyEmail(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to verify username change code for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully verified username change code for user`);
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to verify username change code for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Complete username change
   */
  async changeUsername(
    data: ChangeUsernameRequest,
    authorization: string,
    user_id: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(`Changing username for user to ${data.new_username}`);
      const response = await this.userServiceClient.changeUsername(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to change username for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully changed username for user`);
      }

      // Delete user data from cache
      await this.cacheService.userChangedData({
        user_id: user_id,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to change username for user to ${data.new_username}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // ==================== EMAIL MANAGEMENT METHODS ====================

  /**
   * Initiate email change process
   */
  async changeEmailInitiate(authorization: string): Promise<Response<void>> {
    try {
      this.logger.log(`Initiating email change for user`);
      const response =
        await this.userServiceClient.changeEmailInitiate(authorization);

      if (!response.success) {
        this.logger.error(
          `Failed to initiate email change for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully initiated email change for user`);
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to initiate email change for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Verify email change code
   */
  async changeEmailVerifyEmail(
    data: VerifyEmailCodeRequest,
    authorization: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(`Verifying email change code for user`);
      const response = await this.userServiceClient.changeEmailVerifyEmail(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to verify email change code for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully verified email change code for user`);
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to verify email change code for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Initiate new email change
   */
  async newEmailInitiate(
    data: NewEmailInitiateRequest,
    authorization: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(
        `Initiating new email change for user to ${data.new_email}`,
      );
      const response = await this.userServiceClient.newEmailInitiate(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to initiate new email change for user: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully initiated new email change for user to ${data.new_email}`,
        );
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to initiate new email change for user to ${data.new_email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Verify new email code
   */
  async newEmailVerify(
    data: VerifyNewEmailCodeRequest,
    authorization: string,
    user_id: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(`Verifying new email code for user`);
      const response = await this.userServiceClient.newEmailVerify(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to verify new email code for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully verified new email code for user`);
      }

      // Delete user data from cache
      await this.cacheService.userChangedData({
        user_id: user_id,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to verify new email code for user: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // ==================== SEARCH METHODS ====================

  /**
   * Search users by username or email
   */
  async searchUsers(
    data: SearchUsersRequest,
    authorization: string,
  ): Promise<Response<UserDoc[]>> {
    try {
      this.logger.log('Searching users');
      const response = await this.userServiceClient.searchUsers(
        data,
        authorization,
      );

      if (!response.success || !response.data) {
        this.logger.error(`Failed to search users: ${response.message}`);
      } else {
        this.logger.log(
          `Successfully found ${response.data?.length || 0} users`,
        );
      }

      // User Relationship Fetching (Following, Followers Number Only)
      const users_data = response.data;
      if (users_data && users_data.length > 0) {
        // Map through users to fetch wallet and relationship data
        const enriched_users = await Promise.all(
          users_data.map(async (user) => {
            // Get user primary wallet with graceful degradation
            let user_primary_wallet_data: WalletDoc | undefined = undefined;

            try {
              const get_primary_wallet_response: Response<WalletDoc> =
                await this.walletServiceClient.getPrimaryWalletByUserId(
                  { user_id: user._id },
                  authorization,
                );

              if (
                get_primary_wallet_response.success &&
                get_primary_wallet_response.data
              ) {
                user_primary_wallet_data = get_primary_wallet_response.data;
                this.logger.log(
                  `Successfully fetched primary wallet for user: ${user._id}`,
                );
              } else {
                this.logger.warn(
                  `Primary wallet not found for user: ${user._id}`,
                );
              }
            } catch (error) {
              this.logger.warn(
                `Failed to fetch primary wallet for user ${user._id}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }

            // Get user relationship data with graceful degradation
            let user_relationship_data: UserRelationshipDoc | undefined =
              undefined;

            try {
              const user_relationship_response: Response<UserRelationshipDoc> =
                await this.relationshipServiceClient.getUser(
                  { user_id: user._id },
                  authorization,
                );

              if (
                user_relationship_response.success &&
                user_relationship_response.data
              ) {
                user_relationship_data = user_relationship_response.data;
                this.logger.log(
                  `Successfully fetched relationship data for user: ${user._id}`,
                );
              } else {
                this.logger.warn(
                  `Relationship data not found for user: ${user._id}`,
                );
              }
            } catch (error) {
              this.logger.warn(
                `Failed to fetch relationship data for user ${user._id}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }

            // Get user online status
            let isOnline = false;
            try {
              isOnline = await this.onlineService.isOnline(user._id);
              this.logger.log(`User ${user._id} online status: ${isOnline}`);
            } catch (error) {
              this.logger.warn(
                `Failed to check online status for user ${user._id}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
              isOnline = false; // Default to offline if check fails
            }

            // Enrich user data with wallet, relationship, and online status information
            const enriched_user: UserDoc = {
              ...user,
              primary_wallet: user_primary_wallet_data,
              following_number: user_relationship_data?.following_number,
              followers_number: user_relationship_data?.followers_number,
              is_following: user_relationship_data?.is_following,
              is_follower: user_relationship_data?.is_follower,
              is_blocked: user_relationship_data?.is_blocked,
              is_blocked_by: user_relationship_data?.is_blocked_by,
              mutual_followers_number:
                user_relationship_data?.mutual_followers_number,
              mutual_followers_list:
                user_relationship_data?.mutual_followers_list,
              is_online: isOnline,
            };

            return enriched_user;
          }),
        );

        // Update response data with enriched users
        response.data = enriched_users;
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to search users: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  async checkUsernameExists(
    data: SearchUsernameRequest,
    authorization: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(`Checking if username exists: ${data.username}`);
      const response = await this.userServiceClient.searchExistingUsername(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to check username existence: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully checked username existence: ${data.username}`,
        );
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to check username existence for ${data.username}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(
    data: SearchEmailRequest,
    authorization: string,
  ): Promise<Response<void>> {
    try {
      this.logger.log(`Checking if email exists: ${data.email}`);
      const response = await this.userServiceClient.searchExistingEmail(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to check email existence: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully checked email existence: ${data.email}`);
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to check email existence for ${data.email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // ==================== ACCOUNT MANAGEMENT METHODS ====================

  /**
   * Deactivate user account
   */
  async deactivateAccount(authorization: string): Promise<Response<UserDoc>> {
    return await this.userServiceClient.deactivateAccount(authorization);
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(authorization: string): Promise<Response<UserDoc>> {
    return await this.userServiceClient.reactivateAccount(authorization);
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check user service health
   */
  checkHealth(): Response<{ status: string }> {
    this.logger.log('Checking user service health');

    // Simple health check - user service is running if we can reach this point
    // The actual user service doesn't have a health endpoint, so we just return success
    return {
      success: true,
      statusCode: 200,
      message: 'User service is healthy',
      data: { status: 'ok' },
    };
  }

  private async syncNeo4jUser(
    user: UserDoc,
    user_neo4j: UserNeo4jDoc,
  ): Promise<boolean> {
    try {
      if (!user_neo4j) {
        this.logger.log(`User Neo4j not found: ${user._id}`);
        this.logger.log(
          `Attempting to emit create_user_request for user: ${user._id}`,
        );
        await this.neo4jdbUpdateUserService
          .emit('create_user_request', user)
          .toPromise();
        this.logger.log(
          `Successfully emitted create_user_request for user: ${user._id}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      } else if (
        user_neo4j.username !== user.username ||
        user_neo4j.role !== user.role ||
        user_neo4j.display_name !== user.display_name ||
        user_neo4j.avatar_ipfs_hash !== user.avatar_ipfs_hash
      ) {
        this.logger.log(`Find difference, syncing user to Neo4j: ${user._id}`);
        this.logger.log(
          `Attempting to emit update_user_request for user: ${user._id}`,
        );
        await this.neo4jdbUpdateUserService
          .emit('update_user_request', user)
          .toPromise();
        this.logger.log(
          `Successfully emitted update_user_request for user: ${user._id}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      } else {
        this.logger.log(`User Neo4j is up to date: ${user._id}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to sync user to Neo4j: ${error}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      return false;
    }
  }
  private async getUserProfileData(
    data: GetUserProfileRequest,
    authorization: string,
  ): Promise<Response<UserDoc>> {
    try {
      // Get user basic
      const user_profile_response: Response<UserDoc> =
        await this.userServiceClient.getUserProfile(data, authorization);
      if (!user_profile_response.success || !user_profile_response.data) {
        this.logger.error(
          `Failed to get profile for user: ${data.user_id}: ${user_profile_response.message}`,
        );
        return user_profile_response;
      }
      const user_profile_data = user_profile_response.data;

      // Get user primary wallet with graceful degradation
      let user_primary_wallet_data: WalletDoc | undefined = undefined;
      let user_wallets_data: WalletDoc[] | undefined = undefined;

      try {
        const user_primary_wallet_response: Response<WalletDoc> =
          await this.walletServiceClient.getPrimaryWalletByUserId(
            { user_id: data.user_id },
            authorization,
          );

        const user_wallets_response: Response<WalletDoc[]> =
          await this.walletServiceClient.getWalletsByUserId({
            user_id: data.user_id,
          });

        if (
          user_primary_wallet_response.success &&
          user_primary_wallet_response.data
        ) {
          user_primary_wallet_data = user_primary_wallet_response.data;
          this.logger.log(
            `Successfully fetched primary wallet for user: ${data.user_id}`,
          );
        } else {
          this.logger.warn(
            `Primary wallet not found for user: ${data.user_id}`,
          );
        }
        if (user_wallets_response.success && user_wallets_response.data) {
          user_wallets_data = user_wallets_response.data;
        } else {
          this.logger.warn(`Wallets not found for user: ${data.user_id}`);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch primary wallet for user ${data.user_id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      const full_user_profile_data: UserDoc = {
        ...user_profile_data,
        primary_wallet: user_primary_wallet_data,
        wallets: user_wallets_data,
      };
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: full_user_profile_data,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get profile for user ${data.user_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }
}
