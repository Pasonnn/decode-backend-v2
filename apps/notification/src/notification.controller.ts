import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { AuthGuard, Public } from './common/guards/auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { Response } from './interfaces/response.interface';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { NotificationPaginationResponse } from './interfaces/notification-pagination-response.interface';
import { Notification } from './schema/notification.schema';

/**
 * Notification Controller
 * Handles HTTP endpoints for notification management
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get paginated notifications for the authenticated user (newest first)
   * @param user - The authenticated user
   * @param page - Page number (0-based, default: 0)
   * @param limit - Items per page (default: 10, max: 100)
   * @returns Paginated notifications
   */
  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for user' })
  async getUserNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number = 0,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<NotificationPaginationResponse<Notification>> {
    try {
      // Validate limit
      if (limit > 100) {
        limit = 100;
      }

      const result = await this.notificationService.getUserNotifications(
        user.userId,
        page,
        limit,
      );

      return result;
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve notifications',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Mark a notification as read
   * @param user - The authenticated user
   * @param notificationId - The notification ID
   * @returns Updated notification
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') notificationId: string,
  ): Promise<Response> {
    try {
      const notification = await this.notificationService.markAsRead(
        notificationId,
        user.userId,
      );

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Notification marked as read successfully',
        data: notification,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Notification not found',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Patch('/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAsReadAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    try {
      return this.notificationService.markAsReadAll(user.userId);
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to mark all notifications as read',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get unread notifications count for the authenticated user
   * @param user - The authenticated user
   * @returns Unread count
   */
  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    try {
      const count = await this.notificationService.getUnreadCount(user.userId);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Unread count retrieved successfully',
        data: { count },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get unread count',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Health check endpoint
   * @returns Service health status
   */
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
  })
  getHealth(): Response {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Notification service is healthy',
      data: {
        timestamp: new Date().toISOString(),
        service: 'notification',
        version: '1.0.0',
      },
    };
  }
}
