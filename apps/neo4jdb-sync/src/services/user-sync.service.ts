import { HttpStatus, Injectable, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Interface Import
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import type { Response } from '../interfaces/response.interface';
import type { UserDoc } from '../interfaces/user-doc.interface';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly metricsService?: MetricsService,
  ) {
    this.logger = new Logger(UserSyncService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
  }

  async createUser(user: UserDoc): Promise<Response<UserNeo4jDoc>> {
    const startTime = Date.now();
    try {
      // Check if user exists
      const user_exists_response = await this.neo4jInfrastructure.findUserNode(
        user._id,
      );
      if (user_exists_response) {
        this.metricsService?.increment('sync.user.created', 1, {
          operation: 'createUser',
          status: 'already_exists',
        });
        return {
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message: `User already exists`,
        };
      }
      // Create user
      const create_user_node_response =
        await this.neo4jInfrastructure.createUserNode(user);
      const duration = Date.now() - startTime;

      if (!create_user_node_response) {
        this.metricsService?.timing('sync.duration', duration, {
          operation: 'createUser',
          status: 'failed',
        });
        this.metricsService?.increment('sync.user.created', 1, {
          operation: 'createUser',
          status: 'failed',
        });
        this.metricsService?.increment('sync.errors', 1, {
          operation: 'createUser',
        });
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to create user node`,
        };
      }

      // Record business metrics
      this.metricsService?.timing('sync.duration', duration, {
        operation: 'createUser',
        status: 'success',
        sync_type: 'user_creation',
      });
      this.metricsService?.increment('sync.user.created', 1, {
        operation: 'createUser',
        status: 'success',
        sync_type: 'user_creation',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User node created successfully`,
        data: user as UserNeo4jDoc,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('sync.duration', duration, {
        operation: 'createUser',
        status: 'failed',
      });
      this.metricsService?.increment('sync.user.created', 1, {
        operation: 'createUser',
        status: 'failed',
      });
      this.metricsService?.increment('sync.errors', 1, {
        operation: 'createUser',
      });
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
    const startTime = Date.now();
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
      // Update user
      const update_user_node_response =
        await this.neo4jInfrastructure.updateUserNode(user);
      const duration = Date.now() - startTime;

      if (!update_user_node_response) {
        this.metricsService?.timing('sync.duration', duration, {
          operation: 'updateUser',
          status: 'failed',
        });
        this.metricsService?.increment('sync.user.updated', 1, {
          operation: 'updateUser',
          status: 'failed',
        });
        this.metricsService?.increment('sync.errors', 1, {
          operation: 'updateUser',
        });
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update user node`,
        };
      }

      // Record business metrics
      this.metricsService?.timing('sync.duration', duration, {
        operation: 'updateUser',
        status: 'success',
        sync_type: 'user_update',
      });
      this.metricsService?.increment('sync.user.updated', 1, {
        operation: 'updateUser',
        status: 'success',
        sync_type: 'user_update',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `User node updated successfully`,
        data: user as UserNeo4jDoc,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('sync.duration', duration, {
        operation: 'updateUser',
        status: 'failed',
      });
      this.metricsService?.increment('sync.user.updated', 1, {
        operation: 'updateUser',
        status: 'failed',
      });
      this.metricsService?.increment('sync.errors', 1, {
        operation: 'updateUser',
      });
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
