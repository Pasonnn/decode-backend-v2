import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { Response } from '../interfaces/response.interface';
import { NotificationService } from './notification.service';
import { NotificationGateway } from '../gateways/notification.gateway';

/**
 * Notification Push Service
 * Handles CRUD operations for notifications with clean architecture
 */
@Injectable()
export class NotificationPushService {
  private readonly logger = new Logger(NotificationPushService.name);

  constructor(
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async pushUndeliveredNotifications(input: {
    user_id: string;
  }): Promise<Response> {
    const { user_id } = input;
    try {
      const undelivered_notifications =
        await this.notificationService.findUndeliveredNotifications({
          user_id: user_id,
        });
      if (undelivered_notifications.length === 0) {
        this.logger.log(
          `No undelivered notifications found for user ${user_id}`,
        );
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: `No undelivered notifications found for user ${user_id}`,
        };
      }
      this.logger.log(
        `Pushed ${undelivered_notifications.length} undelivered notifications for user ${user_id}`,
      );
      for (const notification of undelivered_notifications) {
        const delivered = await this.notificationGateway.sendNotificationToUser(
          user_id,
          notification,
        );
        if (delivered) {
          await this.notificationService.markAsDelivered(
            notification._id as string,
          );
        }
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Undelivered notifications pushed for user ${user_id}`,
        data: {
          notifications: undelivered_notifications,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to push undelivered notifications for user ${user_id}:`,
        error,
      );
      throw error;
    }
  }
}
