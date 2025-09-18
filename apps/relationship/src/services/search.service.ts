import { HttpStatus, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import type { PaginationResponse } from '../interfaces/pagination-response.interface';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';

// Service Import
import { UserService } from './user.service';
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger(SearchService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.userService = userService;
  }

  async searchFollowers(input: {
    user_id: string;
    params: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, params, page, limit } = input;
    try {
      // Search followers
      const followers = await this.neo4jInfrastructure.searchFollowers({
        user_id: user_id,
        params: params,
        page: page,
        limit: limit,
      });
      if (followers.length === 0) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `No followers found for params: ${params}`,
        };
      }
      // Full followers response
      const full_followers = await this.userService.filterUsers({
        users: followers,
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
            is_last_page: followers.length < limit,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to search followers: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to search followers`,
      };
    }
  }

  async searchFollowing(input: {
    user_id: string;
    params: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, params, page, limit } = input;
    try {
      // Search following
      const following = await this.neo4jInfrastructure.searchFollowing({
        user_id: user_id,
        params: params,
        page: page,
        limit: limit,
      });
      if (following.length === 0) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `No following found for params: ${params}`,
        };
      }
      // Full following response
      const full_following = await this.userService.filterUsers({
        users: following,
        from_user_id: user_id,
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Following fetched successfully`,
        data: {
          users: full_following,
          meta: {
            total: full_following.length,
            page: page,
            limit: limit,
            is_last_page: following.length < limit,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to search following: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to search following`,
      };
    }
  }
}
