import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RabbitMQInfrastructure } from '../infrastructure/rabbitmq.infrastructure';
import { CreateNotificationDto } from '../dto/create-notification.dto';

/**
 * RabbitMQ Controller
 * Handles incoming messages from RabbitMQ queue
 */
@Controller()
export class RabbitMQController {
  private readonly logger = new Logger(RabbitMQController.name);

  constructor(
    private readonly rabbitMQInfrastructure: RabbitMQInfrastructure,
  ) {}

  /**
   * Handle create notification message from RabbitMQ
   * @param data - The notification data
   */
  @MessagePattern('create_notification')
  async handleCreateNotification(
    @Payload() data: CreateNotificationDto,
  ): Promise<void> {
    try {
      this.logger.log(
        `Received create notification message for user ${data.user_id}`,
      );

      await this.rabbitMQInfrastructure.processCreateNotificationRequest(data);

      this.logger.log(
        `Successfully processed create notification for user ${data.user_id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process create notification for user ${data.user_id}:`,
        error,
      );
      throw error;
    }
  }
}
