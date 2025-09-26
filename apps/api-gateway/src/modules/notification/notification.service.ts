import { Injectable, Logger } from '@nestjs/common';
import { NotificationServiceClient } from '../../infrastructure/external-services/notification-service.client';
import { Response } from '../../interfaces/response.interface';

// DTOs
import { GetUserNotificationsDto, MarkAsReadDto } from './dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationServiceClient: NotificationServiceClient,
  ) {}

  // ==================== HEALTH CHECK ====================

  async checkHealth(): Promise<Response> {
    this.logger.log('Checking notification service health');
    return this.notificationServiceClient.checkHealth();
  }

  // ==================== NOTIFICATION ENDPOINTS ====================

  async getUserNotifications(
    data: GetUserNotificationsDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(
      `Getting notifications - page: ${data.page}, limit: ${data.limit}`,
    );
    return this.notificationServiceClient.getUserNotifications(
      data,
      authorization,
    );
  }

  async markAsRead(
    data: MarkAsReadDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Marking notification as read: ${data.id}`);
    return this.notificationServiceClient.markAsRead(data, authorization);
  }

  async markAsReadAll(authorization: string): Promise<Response> {
    this.logger.log('Marking all notifications as read');
    return this.notificationServiceClient.markAsReadAll(authorization);
  }

  async getUnreadCount(authorization: string): Promise<Response> {
    this.logger.log('Getting unread notifications count');
    return this.notificationServiceClient.getUnreadCount(authorization);
  }
}
