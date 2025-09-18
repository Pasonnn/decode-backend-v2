import { HttpStatus, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import type { PaginationResponse } from '../interfaces/pagination-response.interface';
import type { Response } from '../interfaces/response.interface';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';

// Service Import
import { FollowService } from './follow.service';
import { UserService } from './user.service';

export class BlockService {
  private readonly logger = new Logger(BlockService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly followService: FollowService,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger(BlockService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.followService = followService;
    this.userService = userService;
  }

  async blockUser(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if user blocked
      const user_blocked_response = await this.checkIfUserBlocked({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });
      if (user_blocked_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `User already blocked`,
        };
      }
      // Check if you are following user_to
      const user_following_response =
        await this.followService.checkIfUserFollowing({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        });
      if (user_following_response) {
        await this.followService.unfollowingUser({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        });
      }
      // Check if user_to is following you
      const user_to_following_response =
        await this.followService.checkIfUserFollowing({
          user_id_from: user_id_to,
          user_id_to: user_id_from,
        });
      if (user_to_following_response) {
        await this.followService.removeFollower({
          user_id_from: user_id_to,
          user_id_to: user_id_from,
        });
      }
      // Block user
      const block_user_response =
        await this.neo4jInfrastructure.createUserToUserBlockedRelationship({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        });
      if (!block_user_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to block user`,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User blocked successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to block user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to block user`,
      };
    }
  }

  async getBlockedUsers(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, page, limit } = input;
    let is_last_page = false;
    try {
      // Get blocked users payload
      const blocked_users_payload = {
        user_id: user_id,
        relationship_type: 'BLOCKED',
        page: page,
        limit: limit,
      };
      // Get blocked users
      const blocked_users_response =
        await this.neo4jInfrastructure.findUserFromRelationshipPaginated(
          blocked_users_payload,
        );
      if (!blocked_users_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get blocked users`,
        };
      } else if (blocked_users_response.length < limit) {
        is_last_page = true;
      }
      // Full blocked users response
      const full_blocked_users = await this.userService.filterUsers({
        users: blocked_users_response,
        from_user_id: user_id,
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Blocked users fetched successfully`,
        data: {
          users: full_blocked_users,
          meta: {
            total: full_blocked_users.length,
            page: page,
            limit: limit,
            is_last_page,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get blocked users: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get blocked users`,
      };
    }
  }

  async unblockUser(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if user blocked
      const user_blocked_response = await this.checkIfUserBlocked({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
      });
      if (!user_blocked_response) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: `User not blocked`,
        };
      }
      // Unblock user
      const unblock_user_response =
        await this.neo4jInfrastructure.deleteUserToUserBlockedRelationship({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        });
      if (!unblock_user_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to unblock user`,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User unblocked successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to unblock user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to unblock user`,
      };
    }
  }

  async checkIfUserBlocked(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const { user_id_from, user_id_to } = input;
    try {
      // Check if user blocked
      const user_block_response =
        await this.neo4jInfrastructure.findUserToUserRelationship({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
          relationship_type: 'BLOCKED',
        });
      const user_blocked_response =
        await this.neo4jInfrastructure.findUserToUserRelationship({
          user_id_from: user_id_to,
          user_id_to: user_id_from,
          relationship_type: 'BLOCKED',
        });
      return user_block_response || user_blocked_response;
    } catch (error) {
      this.logger.error(
        `Failed to check if user blocked: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
