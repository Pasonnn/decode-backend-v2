import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../schema/notification.schema';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationPaginationResponse } from '../interfaces/notification-pagination-response.interface';
import { Response } from '../interfaces/response.interface';

/**
 * Notification Service
 * Handles CRUD operations for notifications with clean architecture
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  /**
   * Create a new notification
   * @param createNotificationDto - The notification data
   * @returns The created notification
   */
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    try {
      const notification = new this.notificationModel({
        ...createNotificationDto,
        user_id: new Types.ObjectId(createNotificationDto.user_id),
      });

      const savedNotification = await notification.save();

      this.logger.log(
        `Created notification: ${savedNotification.title} for user ${createNotificationDto.user_id}`,
      );
      return savedNotification;
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get paginated notifications for a user (newest first)
   * @param userId - The user ID
   * @param page - Page number (0-based, default: 0)
   * @param limit - Items per page (default: 10)
   * @returns Paginated notifications
   */
  async getUserNotifications(
    userId: string,
    page: number = 0,
    limit: number = 10,
  ): Promise<NotificationPaginationResponse<Notification>> {
    try {
      const skip = page * limit;
      const userObjectId = new Types.ObjectId(userId);

      const notifications = await this.notificationModel
        .find({ user_id: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      this.logger.log(
        `Retrieved ${notifications.length} notifications for user ${userId} (page ${page})`,
      );

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Notifications retrieved successfully`,
        data: {
          notifications: notifications as Notification[],
          meta: {
            total: notifications.length,
            page: page,
            limit: limit,
            is_last_page: notifications.length < limit,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notifications for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId - The notification ID
   * @param userId - The user ID (for security)
   * @returns The updated notification
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const notificationObjectId = new Types.ObjectId(notificationId);

      const notification = await this.notificationModel
        .findOneAndUpdate(
          {
            _id: notificationObjectId,
            user_id: userObjectId,
          },
          {
            read: true,
            read_at: new Date(),
          },
          { new: true },
        )
        .exec();

      if (!notification) {
        throw new NotFoundException(
          `Notification ${notificationId} not found for user ${userId}`,
        );
      }

      this.logger.log(
        `Marked notification ${notificationId} as read for user ${userId}`,
      );

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${notificationId} as read:`,
        error,
      );
      throw error;
    }
  }

  async markAsReadAll(userId: string): Promise<Response> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      await this.notificationModel
        .updateMany(
          { user_id: userObjectId },
          { read: true, read_at: new Date() },
        )
        .exec();
      this.logger.log(`Marked all notifications as read for user ${userId}`);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `All notifications marked as read for user ${userId}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Mark a notification as delivered
   * @param notificationId - The notification ID
   * @returns The updated notification
   */
  async markAsDelivered(notificationId: string): Promise<Notification> {
    try {
      const notificationObjectId = new Types.ObjectId(notificationId);

      const notification = await this.notificationModel
        .findByIdAndUpdate(
          notificationObjectId,
          {
            delivered: true,
            delivered_at: new Date(),
          },
          { new: true },
        )
        .exec();

      if (!notification) {
        throw new NotFoundException(`Notification ${notificationId} not found`);
      }

      this.logger.log(`Marked notification ${notificationId} as delivered`);

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to mark notification ${notificationId} as delivered:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get unread notifications count for a user
   * @param userId - The user ID
   * @returns Number of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const userObjectId = new Types.ObjectId(userId);

      const count = await this.notificationModel
        .countDocuments({
          user_id: userObjectId,
          read: false,
        })
        .exec();

      this.logger.log(`User ${userId} has ${count} unread notifications`);

      return count;
    } catch (error) {
      this.logger.error(
        `Failed to get unread count for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find a notification by ID
   * @param notificationId - The notification ID
   * @returns The notification or null
   */
  async findById(notificationId: string): Promise<Notification | null> {
    try {
      const notificationObjectId = new Types.ObjectId(notificationId);

      const notification = await this.notificationModel
        .findById(notificationObjectId)
        .exec();

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to find notification ${notificationId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param notificationId - The notification ID
   * @param userId - The user ID (for security)
   * @returns The deleted notification
   */
  async delete(notificationId: string, userId: string): Promise<Notification> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const notificationObjectId = new Types.ObjectId(notificationId);

      const notification = await this.notificationModel
        .findOneAndDelete({
          _id: notificationObjectId,
          user_id: userObjectId,
        })
        .exec();

      if (!notification) {
        throw new NotFoundException(
          `Notification ${notificationId} not found for user ${userId}`,
        );
      }

      this.logger.log(
        `Deleted notification ${notificationId} for user ${userId}`,
      );

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to delete notification ${notificationId}:`,
        error,
      );
      throw error;
    }
  }
}
