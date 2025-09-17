import { HttpStatus, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import type { Response } from '../interfaces/response.interface';

export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly neo4jInfrastructure: Neo4jInfrastructure) {
    this.logger = new Logger(UserService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
  }
  // Get user
  async getUser(input: { user_id: string }): Promise<Response<UserNeo4jDoc>> {
    const { user_id } = input;
    try {
      // Get user
      const user_response = await this.neo4jInfrastructure.findUserNode({
        user_id: user_id,
      });
      if (!user_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get user`,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User fetched successfully`,
        data: user_response,
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
}
