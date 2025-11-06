import { Injectable, Logger } from '@nestjs/common';
import { UserSyncService } from '../services/user-sync.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class RabbitMQInfrastructure {
  private readonly logger = new Logger(RabbitMQInfrastructure.name);
  private client: ClientProxy;

  constructor(
    private readonly userSyncService: UserSyncService,
    private readonly configService: ConfigService,
    private readonly metricsService?: MetricsService,
  ) {
    this.client = ClientProxyFactory.create({
      options: {
        urls: [this.configService.get('RABBITMQ_URI', 'amqp://localhost:5672')],
        queue: 'neo4j_sync_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Connected to RabbitMQ successfully');

      // Start consuming messages
      this.startConsuming();
    } catch (error) {
      this.logger.error(
        'Failed to connect to RabbitMQ',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private startConsuming() {
    // For a worker service, we need to use a different approach
    // This will be handled by the controller with @MessagePattern
    this.logger.log('RabbitMQ consumer initialized');
  }

  async processCreateUserRequest(request: CreateUserDto): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing create user request ${request._id}`);
    try {
      this.metricsService?.increment('queue.message.consumed', 1, {
        queue_name: 'neo4j_sync_queue',
        message_type: 'create_user',
      });

      await this.userSyncService.createUser(request);
      const duration = Date.now() - startTime;
      this.metricsService?.timing(
        'queue.message.processing.duration',
        duration,
        {
          queue_name: 'neo4j_sync_queue',
          message_type: 'create_user',
        },
      );
      this.logger.log(
        `Create user processed successfully in ${duration}ms: ${request._id}`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing(
        'queue.message.processing.duration',
        duration,
        {
          queue_name: 'neo4j_sync_queue',
          message_type: 'create_user',
          error: 'true',
        },
      );
      this.metricsService?.increment('queue.message.failed', 1, {
        queue_name: 'neo4j_sync_queue',
        message_type: 'create_user',
        operation: 'consume',
      });
      this.logger.error(
        `Create user processing failed after ${duration}ms: ${request._id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async processUpdateUserRequest(request: UpdateUserDto): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing update user request ${request._id}`);
    try {
      this.metricsService?.increment('queue.message.consumed', 1, {
        queue_name: 'neo4j_sync_queue',
        message_type: 'update_user',
      });

      await this.userSyncService.updateUser(request);
      const duration = Date.now() - startTime;
      this.metricsService?.timing(
        'queue.message.processing.duration',
        duration,
        {
          queue_name: 'neo4j_sync_queue',
          message_type: 'update_user',
        },
      );
      this.logger.log(
        `Update user processed successfully in ${duration}ms: ${request._id}`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing(
        'queue.message.processing.duration',
        duration,
        {
          queue_name: 'neo4j_sync_queue',
          message_type: 'update_user',
          error: 'true',
        },
      );
      this.metricsService?.increment('queue.message.failed', 1, {
        queue_name: 'neo4j_sync_queue',
        message_type: 'update_user',
        operation: 'consume',
      });
      this.logger.error(
        `Update user processing failed after ${duration}ms: ${request._id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
