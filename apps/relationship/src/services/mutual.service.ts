import { HttpStatus, Logger, Injectable } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import type { ResponseWithCount } from '../interfaces/response-with-count.interface';
import type { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';

@Injectable()
export class MutualService {
  private readonly logger = new Logger(MutualService.name);
  constructor(private readonly neo4jInfrastructure: Neo4jInfrastructure) {
    this.logger = new Logger(MutualService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
  }

  async getMutualFollowers(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<ResponseWithCount<UserNeo4jDoc>> {
    const { user_id_from, user_id_to } = input;
    try {
      const mutual_followers =
        await this.neo4jInfrastructure.getMutualFollowers({
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Mutual followers fetched successfully`,
        data: {
          users: mutual_followers,
          meta: {
            total: mutual_followers.length,
          },
        },
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
