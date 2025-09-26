import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Notification } from '../schema/notification.schema';
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
    @InjectModel(Notification.name)
    private readonly notificationGateway: NotificationGateway,
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
          await this.notificationService.markAsDeliveredByNotificationId({
            notification_id: notification._id as string,
          });
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
