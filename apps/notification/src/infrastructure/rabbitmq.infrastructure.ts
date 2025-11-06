import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationGateway } from '../gateways/notification.gateway';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class RabbitMQInfrastructure {
  private readonly logger = new Logger(RabbitMQInfrastructure.name);
  private client: ClientProxy;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly configService: ConfigService,
    private readonly metricsService?: MetricsService,
  ) {
    this.client = ClientProxyFactory.create({
      options: {
        urls: [this.configService.get('RABBITMQ_URI', 'amqp://localhost:5672')],
        queue: 'notification_queue',
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

  /**
   * Process create notification request from RabbitMQ
   * Creates notification in database and sends via WebSocket
   * @param request - The notification request data
   */
  async processCreateNotificationRequest(
    request: CreateNotificationDto,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `Processing create notification request ${request.type} for user ${request.user_id}`,
    );

    try {
      this.metricsService?.increment('queue.message.consumed', 1, {
        queue_name: 'notification_queue',
        message_type: request.type,
      });

      // Create notification in database
      const notification = await this.notificationService.create(request);

      // Send notification via WebSocket
      const webSocketSent =
        await this.notificationGateway.sendNotificationToUser(
          request.user_id,
          notification,
        );

      const duration = Date.now() - startTime;
      this.metricsService?.timing(
        'queue.message.processing.duration',
        duration,
        {
          queue_name: 'notification_queue',
          message_type: request.type,
        },
      );

      if (webSocketSent) {
        this.logger.log(
          `✅ Create notification processed successfully in ${duration}ms: ${request.type} for user ${request.user_id} (WebSocket delivered)`,
        );
      } else {
        this.logger.warn(
          `⚠️ Create notification processed in ${duration}ms: ${request.type} for user ${request.user_id} (WebSocket not delivered - user offline)`,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing(
        'queue.message.processing.duration',
        duration,
        {
          queue_name: 'notification_queue',
          message_type: request.type,
          error: 'true',
        },
      );
      this.metricsService?.increment('queue.message.failed', 1, {
        queue_name: 'notification_queue',
        message_type: request.type,
        operation: 'consume',
      });
      this.logger.error(
        `Create notification processing failed after ${duration}ms: ${request.type} for user ${request.user_id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
