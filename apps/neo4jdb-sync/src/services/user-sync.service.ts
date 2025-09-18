import { HttpStatus, Injectable, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import type { Response } from '../interfaces/response.interface';
import type { UserDoc } from '../interfaces/user-doc.interface';

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);
  constructor(private readonly neo4jInfrastructure: Neo4jInfrastructure) {
    this.logger = new Logger(UserSyncService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
  }

  async createUser(user: UserDoc): Promise<Response<UserNeo4jDoc>> {
    try {
      // Check if user exists
      console.log('createUser', user);
      const user_exists_response = await this.neo4jInfrastructure.findUserNode(
        user._id,
      );
      if (user_exists_response) {
        return {
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message: `User already exists`,
        };
      }
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
        data: user as UserNeo4jDoc,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to create user`,
      };
    }
  }

  async updateUser(user: UserDoc): Promise<Response<UserNeo4jDoc>> {
    try {
      // Check if user exists, if not create user
      const user_exists_response = await this.neo4jInfrastructure.findUserNode(
        user._id,
      );
      if (!user_exists_response) {
        const create_user_response = await this.createUser(user);
        if (!create_user_response.success) {
          return create_user_response;
        }
        return create_user_response;
      }
      console.log('service', user);
      // Update user
      const update_user_node_response =
        await this.neo4jInfrastructure.updateUserNode(user);
      if (!update_user_node_response) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update user node`,
        };
      }
      console.log('success');
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User node updated successfully`,
        data: user as UserNeo4jDoc,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update user: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to update user`,
      };
    }
  }
}
