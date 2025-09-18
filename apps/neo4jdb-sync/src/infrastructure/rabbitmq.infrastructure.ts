import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { UserSyncService } from '../services/user-sync.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class RabbitMQInfrastructure implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQInfrastructure.name);
  private syncClient: ClientProxy;

  constructor(
    private readonly configService: ConfigService,
    private readonly userSyncService: UserSyncService,
  ) {
    this.syncClient = ClientProxyFactory.create({
      options: {
        urls: [this.configService.get('RABBITMQ_URL', 'amqp://localhost:5672')],
        queue: 'neo4j_sync_queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
        prefetchCount: 1,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.syncClient.connect();
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

  async sendCreateUserRequest(request: CreateUserDto): Promise<void> {
    try {
      await this.syncClient.emit('create_user_request', request).toPromise();
      this.logger.log(`Create user request queued: ${request._id}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue create user request: ${request._id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendUpdateUserRequest(request: UpdateUserDto): Promise<void> {
    try {
      await this.syncClient.emit('update_user_request', request).toPromise();
      this.logger.log(`Update user request queued: ${request._id}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue update user request: ${request._id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async processCreateUserRequest(request: CreateUserDto): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing create user request ${request._id}`);
    try {
      await this.userSyncService.createUser(request);
      const duration = Date.now() - startTime;
      this.logger.log(
        `Create user processed successfully in ${duration}ms: ${request._id}`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
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
      await this.userSyncService.updateUser(request);
      const duration = Date.now() - startTime;
      this.logger.log(
        `Update user processed successfully in ${duration}ms: ${request._id}`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Update user processing failed after ${duration}ms: ${request._id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
