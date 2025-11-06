import {
  HttpStatus,
  Logger,
  Injectable,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import type { PaginationResponse } from '../interfaces/pagination-response.interface';
import type { Response } from '../interfaces/response.interface';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';

// Service Import
import { BlockService } from './block.service';
import { UserService } from './user.service';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
    private readonly userService: UserService,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationService: ClientProxy,
    private readonly metricsService?: MetricsService,
  ) {
    this.logger = new Logger(FollowService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.blockService = blockService;
    this.userService = userService;
  }

  async followingUser(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if you are following yourself
      if (user_id_from === user_id_to) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `You cannot follow yourself`,
        };
      }
      // Check if user exists
      const user_exists_response = await this.userService.userExists({
        user_id: user_id_to,
      });
      if (!user_exists_response) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: `User not found`,
        };
      }
      // Check if you are already following user to
      const user_following_response = await this.checkIfUserFollowing({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });
      if (user_following_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `You are already following this user`,
        };
      }

      // Check if user blocked
      const user_blocked_response = await this.blockService.checkIfUserBlocked({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });

      if (user_blocked_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `This user is limited to you`,
        };
      }
      // Following payload
      const following_payload = {
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      };
      // Following user
      const following_user_response =
        await this.neo4jInfrastructure.createUserToUserFollowingRelationship(
          following_payload,
        );
      if (!following_user_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to following user`,
        };
      }
      // Create notification for user to
      // Get user from data
      const get_user_from_response = await this.userService.getUser({
        user_id_from: user_id_to,
        user_id_to: user_id_from,
      });
      if (!get_user_from_response.success || !get_user_from_response.data) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get user from to follow`,
        };
      }
      const create_notification_notification_payload = {
        user_id: user_id_to,
        type: 'new_follow',
        title: 'You have a new follower',
        message: `${get_user_from_response.data.username} just followed you`,
      };
      await this.notificationService
        .emit('create_notification', create_notification_notification_payload)
        .toPromise();

      // Record business metric
      this.metricsService?.increment('relationship.follow', 1, {
        operation: 'followingUser',
        status: 'success',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User followed successfully`,
      };
    } catch (error) {
      this.metricsService?.increment('relationship.follow', 1, {
        operation: 'followingUser',
        status: 'failed',
      });
      this.logger.error(
        `Failed to following user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to following user`,
      };
    }
  }

  async unfollowingUser(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if you are unfollowing yourself
      if (user_id_from === user_id_to) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `You cannot unfollow yourself`,
        };
      }
      // Check if you are following user to
      const user_following_response = await this.checkIfUserFollowing({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });
      if (!user_following_response) {
        this.metricsService?.increment('relationship.unfollow', 1, {
          operation: 'unfollowingUser',
          status: 'not_following',
        });
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `You are not following this user`,
        };
      }

      // Check if user blocked
      const user_blocked_response = await this.blockService.checkIfUserBlocked({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });
      if (user_blocked_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `This user is limited to you`,
        };
      }

      // Unfollowing payload
      const unfollowing_payload = {
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      };
      // Unfollowing user
      const unfollowing_user_response =
        await this.neo4jInfrastructure.deleteUserToUserFollowingRelationship(
          unfollowing_payload,
        );
      if (!unfollowing_user_response) {
        this.metricsService?.increment('relationship.unfollow', 1, {
          operation: 'unfollowingUser',
          status: 'failed',
        });
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to unfollowing user`,
        };
      }

      // Record business metric
      this.metricsService?.increment('relationship.unfollow', 1, {
        operation: 'unfollowingUser',
        status: 'success',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User unfollowed successfully`,
      };
    } catch (error) {
      this.metricsService?.increment('relationship.unfollow', 1, {
        operation: 'unfollowingUser',
        status: 'failed',
      });
      this.logger.error(
        `Failed to unfollowing user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to unfollowing user`,
      };
    }
  }

  async removeFollower(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if you are removing yourself
      if (user_id_from === user_id_to) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `You cannot remove yourself`,
        };
      }
      // Check if user blocked
      const user_blocked_response = await this.blockService.checkIfUserBlocked({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });
      if (user_blocked_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `User blocked`,
        };
      }
      // Check if user to is following you
      const user_following_response = await this.checkIfUserFollowing({
        user_id_from: user_id_to,
        user_id_to: user_id_from,
      });
      if (!user_following_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `User is not following you`,
        };
      }
      // Remove follower payload
      const remove_follower_payload = {
        user_id_from: user_id_to,
        user_id_to: user_id_from,
      };
      // Remove follower
      const remove_follower_response =
        await this.neo4jInfrastructure.deleteUserToUserFollowingRelationship(
          remove_follower_payload,
        );
      if (!remove_follower_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to remove follower`,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Follower removed successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to remove follower: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to remove follower`,
      };
    }
  }

  async getFollowing(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, page, limit } = input;
    let is_last_page = false;
    try {
      // Get following users payload
      const following_users_payload = {
        user_id: user_id,
        relationship_type: 'FOLLOWING',
        page: page,
        limit: limit,
      };
      // Get following users
      const following_users_response =
        await this.neo4jInfrastructure.findUserFromRelationshipPaginated(
          following_users_payload,
        );
      if (!following_users_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get following users`,
        };
      } else if (following_users_response.length < limit) {
        is_last_page = true;
      }
      // Full following users response
      const full_following_users = await this.userService.filterUsers({
        users: following_users_response,
        from_user_id: user_id,
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Following users fetched successfully`,
        data: {
          users: full_following_users,
          meta: {
            total: full_following_users.length,
            page: page,
            limit: limit,
            is_last_page,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get following users: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get following users`,
      };
    }
  }

  async getFollowers(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, page, limit } = input;
    let is_last_page = false;
    try {
      // Get followers payload
      const followers_payload = {
        user_id: user_id,
        relationship_type: 'FOLLOWING',
        page: page,
        limit: limit,
      };
      // Get followers
      const followers_response =
        await this.neo4jInfrastructure.findUserToRelationshipPaginated(
          followers_payload,
        );
      if (!followers_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get followers`,
        };
      }
      if (followers_response.length < limit) {
        is_last_page = true;
      }
      // Full followers response
      const full_followers = await this.userService.filterUsers({
        users: followers_response,
        from_user_id: user_id,
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Followers fetched successfully`,
        data: {
          users: full_followers,
          meta: {
            total: full_followers.length,
            page: page,
            limit: limit,
            is_last_page,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get followers: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get followers`,
      };
    }
  }

  async checkIfUserFollowing(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if user following
      const user_following_response =
        await this.neo4jInfrastructure.findUserToUserRelationship({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
          relationship_type: 'FOLLOWING',
        });
      return user_following_response;
    } catch (error) {
      this.logger.error(
        `Failed to check if user following: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
