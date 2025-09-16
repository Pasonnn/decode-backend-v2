import { HttpStatus, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import { Response } from '../interfaces/response.interface';

export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly neo4jInfrastructure: Neo4jInfrastructure) {
    this.logger = new Logger(UserService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
  }

  async createUser(user: UserNeo4jDoc): Promise<Response<UserNeo4jDoc>> {
    // Create user
    const create_user_node_response =
      await this.neo4jInfrastructure.createUserNode(user);
    if (!create_user_node_response) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to create user node`,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: `User node created successfully`,
      data: user,
    };
  }
}
