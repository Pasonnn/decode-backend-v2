import { HttpStatus, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import type { Response } from '../interfaces/response.interface';

export class MutualService {
  private readonly logger = new Logger(MutualService.name);
  constructor(private readonly neo4jInfrastructure: Neo4jInfrastructure) {
    this.logger = new Logger(MutualService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
  }

  async getMutualFollowers(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<Response> {
    const { user_id_from, user_id_to } = input;
    try {
      const mutual_followers =
        await this.neo4jInfrastructure.getMutualFollowers({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        });
      if (mutual_followers.length === 0) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `No mutual followers found`,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Mutual followers fetched successfully`,
        data: mutual_followers,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get mutual followers: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get mutual followers`,
      };
    }
  }
}
