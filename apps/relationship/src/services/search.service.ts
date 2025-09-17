import { HttpStatus, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import type { PaginationResponse } from '../interfaces/pagination-response.interface';

// Service Import
import { FollowService } from './follow.service';

export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly followService: FollowService,
  ) {
    this.logger = new Logger(SearchService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.followService = followService;
  }

  async searchFollowers(input: {
    params: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { params, page, limit } = input;
    try {
      // Search followers
      const followers = await this.neo4jInfrastructure.searchFollowers({
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
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Followers fetched successfully`,
        data: {
          users: followers,
          meta: {
            total: followers.length,
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
}
