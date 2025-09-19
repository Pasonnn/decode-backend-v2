import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserServiceClient } from '../../infrastructure/external-services/user-service.client';
import { WalletServiceClient } from '../../infrastructure/external-services/wallet-service.client';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { WalletDoc } from '../../interfaces/wallet-doc.interface';

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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly walletServiceClient: WalletServiceClient,
  ) {}

  // ==================== PROFILE METHODS ====================

  /**
   * Get user profile by user ID
   */
  async getUserProfile(
    data: GetUserProfileRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Getting profile for user: ${data.user_id}`);
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
      // Get user primary wallet
      const user_primary_wallet_response: Response<WalletDoc> =
        await this.walletServiceClient.getPrimaryWallet(authorization);

      if (
        !user_primary_wallet_response.success ||
        !user_primary_wallet_response.data
      ) {
        this.logger.error(
          `Failed to get primary wallet for user: ${data.user_id}: ${user_primary_wallet_response.message}`,
        );
        return user_primary_wallet_response;
      }
      const user_primary_wallet_data = user_primary_wallet_response.data;
      const user_profile_data_with_primary_wallet: UserDoc = {
        ...user_profile_data,
        primary_wallet: user_primary_wallet_data,
      };

      // TODO: User Relationship Fetching

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: user_profile_data_with_primary_wallet,
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
  async getMyProfile(authorization: string): Promise<Response> {
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

      const get_my_primary_wallet_response: Response<WalletDoc> =
        await this.walletServiceClient.getPrimaryWallet(authorization);

      if (
        !get_my_primary_wallet_response.success ||
        !get_my_primary_wallet_response.data
      ) {
        this.logger.error(
          `Failed to get current user primary wallet: ${get_my_primary_wallet_response.message}`,
        );
        return get_my_primary_wallet_response;
      }

      const get_my_profile_data_with_primary_wallet: UserDoc = {
        ...get_my_profile_response.data,
        primary_wallet: get_my_primary_wallet_response.data,
      };

      // TODO: User Relationship Fetching (Following, Followers Number Only)

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: get_my_profile_data_with_primary_wallet,
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
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating display name for user`);
      const response = await this.userServiceClient.updateUserDisplayName(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to update display name for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully updated display name for user`);
      }

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
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating bio for user`);
      const response = await this.userServiceClient.updateUserBio(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(`Failed to update bio for user: ${response.message}`);
      } else {
        this.logger.log(`Successfully updated bio for user`);
      }

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
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating avatar for user`);
      const response = await this.userServiceClient.updateUserAvatar(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to update avatar for user: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully updated avatar for user`);
      }

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
  ): Promise<Response<UserDoc>> {
    try {
      this.logger.log(`Updating role for user to ${data.role}`);
      const response = await this.userServiceClient.updateUserRole(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(`Failed to update user role: ${response.message}`);
      } else {
        this.logger.log(`Successfully updated user role`);
      }

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

      if (!response.success) {
        this.logger.error(`Failed to search users: ${response.message}`);
      } else {
        this.logger.log(
          `Successfully found ${response.data?.length || 0} users`,
        );
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
}
