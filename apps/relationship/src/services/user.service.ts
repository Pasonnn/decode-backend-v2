import { HttpStatus, Logger, Injectable } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import { ResponseWithCount } from '../interfaces/response-with-count.interface';
import type { Response } from '../interfaces/response.interface';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import { NodeResponse } from '../interfaces/node-response.interface';

// Service Import
import { MutualService } from './mutual.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly mutualService: MutualService,
  ) {
    this.logger = new Logger(UserService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.mutualService = mutualService;
  }
  // Get user
  async getUser(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response<UserNeo4jDoc>> {
    const { user_id_from, user_id_to } = input;
    try {
      // Get user
      const user = (await this.neo4jInfrastructure.findUserNode({
        user_id: user_id_to,
      })) as NodeResponse<UserNeo4jDoc>;
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get user`,
        };
      }
      // Filter user
      const filtered_user = await this.filterUser({
        user: user,
        user_id_from: user_id_from,
      });
      if (!filtered_user) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to filter user`,
        };
      }
      // Return response
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User fetched successfully`,
        data: filtered_user,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get user`,
      };
    }
  }

  async userExists(input: { user_id: string }): Promise<boolean> {
    const { user_id } = input;
    try {
      const user = await this.neo4jInfrastructure.findUserNode({
        user_id: user_id,
      });
      if (!user) {
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to check if user exists: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async filterUsers(input: {
    users: NodeResponse<UserNeo4jDoc>[];
    from_user_id: string;
  }): Promise<UserNeo4jDoc[]> {
    const { users, from_user_id } = input;
    try {
      // Full followers response
      const full_users_response = await Promise.all(
        users.map(async (user) => {
          const filtered_user = await this.filterUser({
            user: user,
            user_id_from: from_user_id,
          });
          if (!filtered_user) {
            return null;
          }
          const filtered_following_user = await this.filterFollowingUser({
            user: user,
            user_id_from: from_user_id,
          });
          if (!filtered_following_user) {
            return null;
          }
          return filtered_user;
        }),
      );
      const full_users_response_filtered = full_users_response.filter(
        (user) => user !== null,
      );
      return full_users_response_filtered;
    } catch (error) {
      this.logger.error(
        `Failed to filter users: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async filterUser(input: {
    user: NodeResponse<UserNeo4jDoc>;
    user_id_from: string;
  }): Promise<UserNeo4jDoc | null> {
    const { user, user_id_from } = input;
    const user_neo4j: UserNeo4jDoc = user.properties;
    try {
      // Check follow status, block status, and mutual followers
      const is_following = await this.isFollowing({
        user_id_from: user_id_from,
        user_id_to: user_neo4j.user_id,
      });
      const is_follower = await this.isFollower({
        user_id_from: user_id_from,
        user_id_to: user_neo4j.user_id,
      });
      const is_blocked = await this.isBlocked({
        user_id_from: user_id_from,
        user_id_to: user_neo4j.user_id,
      });
      const is_blocked_by = await this.isBlockedBy({
        user_id_from: user_id_from,
        user_id_to: user_neo4j.user_id,
      });
      const mutual_followers_response: ResponseWithCount<UserNeo4jDoc> =
        await this.mutualService.getMutualFollowers({
          user_id_from: user_id_from,
          user_id_to: user_neo4j.user_id,
        });
      if (
        !mutual_followers_response.success ||
        !mutual_followers_response.data
      ) {
        return null;
      }
      const mutual_followers_list = mutual_followers_response.data.users;
      const mutual_followers_number = mutual_followers_response.data.meta.total;
      // Update user response
      user_neo4j.is_following = is_following;
      user_neo4j.is_follower = is_follower;
      user_neo4j.is_blocked = is_blocked;
      user_neo4j.is_blocked_by = is_blocked_by;
      user_neo4j.mutual_followers_list = mutual_followers_list;
      user_neo4j.mutual_followers_number = mutual_followers_number;
      return user_neo4j;
    } catch (error) {
      this.logger.error(
        `Failed to filter user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async filterFollowingUser(input: {
    user: NodeResponse<UserNeo4jDoc>;
    user_id_from: string;
  }): Promise<UserNeo4jDoc | null> {
    const { user, user_id_from } = input;
    const user_neo4j: UserNeo4jDoc = user.properties;
    try {
      const is_following = await this.isFollowing({
        user_id_from: user_id_from,
        user_id_to: user_neo4j.user_id,
      });
      if (is_following) {
        return null;
      }
      return user_neo4j;
    } catch (error) {
      this.logger.error(
        `Failed to filter following user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async isFollowing(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const { user_id_from, user_id_to } = input;
    try {
      return await this.neo4jInfrastructure.findUserToUserRelationship({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
        relationship_type: 'FOLLOWING',
      });
    } catch (error) {
      this.logger.error(
        `Failed to check if user is following: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async isFollower(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const { user_id_from, user_id_to } = input;
    try {
      return await this.neo4jInfrastructure.findUserToUserRelationship({
        user_id_from: user_id_to,
        user_id_to: user_id_from,
        relationship_type: 'FOLLOWING',
      });
    } catch (error) {
      this.logger.error(
        `Failed to check if user is follower: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async isBlocked(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const { user_id_from, user_id_to } = input;
    try {
      return await this.neo4jInfrastructure.findUserToUserRelationship({
        user_id_from: user_id_from,
        user_id_to: user_id_to,
        relationship_type: 'BLOCKED',
      });
    } catch (error) {
      this.logger.error(
        `Failed to check if user is blocked: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async isBlockedBy(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const { user_id_from, user_id_to } = input;
    try {
      return await this.neo4jInfrastructure.findUserToUserRelationship({
        user_id_from: user_id_to,
        user_id_to: user_id_from,
        relationship_type: 'BLOCKED',
      });
    } catch (error) {
      this.logger.error(
        `Failed to check if user is blocked by: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
