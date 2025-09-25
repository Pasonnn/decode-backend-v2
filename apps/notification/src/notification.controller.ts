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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { AuthGuard } from './common/guards/auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Response } from './interfaces/response.interface';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

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
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   * @returns Paginated notifications
   */
  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            notifications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  user_id: { type: 'string' },
                  type: { type: 'string' },
                  title: { type: 'string' },
                  message: { type: 'string' },
                  delivered: { type: 'boolean' },
                  delivered_at: { type: 'string', format: 'date-time' },
                  read: { type: 'boolean' },
                  read_at: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
                totalItems: { type: 'number' },
                itemsPerPage: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  async getUserNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Response> {
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

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Notifications retrieved successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve notifications',
        error: error.message,
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'string' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            delivered: { type: 'boolean' },
            delivered_at: { type: 'string', format: 'date-time' },
            read: { type: 'boolean' },
            read_at: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
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
      if (error.status === HttpStatus.NOT_FOUND) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Notification not found',
          error: error.message,
        };
      }

      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to mark notification as read',
        error: error.message,
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number' },
          },
        },
      },
    },
  })
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
        error: error.message,
      };
    }
  }

  /**
   * Health check endpoint
   * @returns Service health status
   */
  @Get('health')
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
