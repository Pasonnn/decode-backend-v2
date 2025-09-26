import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';

// Services
import { NotificationService } from './notification.service';

// DTOs
import { GetUserNotificationsDto, MarkAsReadDto } from './dto';

// Guards and Decorators
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import { UserRateLimit } from '../../common/decorators/rate-limit.decorator';

// Interfaces
import type { Response } from '../../interfaces/response.interface';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuardWithFingerprint)
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(GetUserNotificationsDto, MarkAsReadDto)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ==================== HEALTH CHECK ====================

  @ApiOperation({
    summary: 'Health check',
    description: 'Check the health status of the notification service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Notification service is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
        },
        requestId: { type: 'string', example: 'req-123' },
      },
    },
  })
  @Get('healthz')
  @HttpCode(HttpStatus.OK)
  async checkHealth(): Promise<Response> {
    return this.notificationService.checkHealth();
  }

  // ==================== NOTIFICATION ENDPOINTS ====================

  @ApiOperation({
    summary: 'Get paginated notifications for user',
    description:
      'Get paginated notifications for the authenticated user (newest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get()
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getUserNotifications(
    @Query() query: GetUserNotificationsDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.notificationService.getUserNotifications(query, authorization);
  }

  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @Patch(':id/read')
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param() params: MarkAsReadDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.notificationService.markAsRead(params, authorization);
  }

  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications as read for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  @Patch('read-all')
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async markAsReadAll(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.notificationService.markAsReadAll(authorization);
  }

  @ApiOperation({
    summary: 'Get unread notifications count',
    description:
      'Get the count of unread notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
  })
  @Get('unread/count')
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.notificationService.getUnreadCount(authorization);
  }
}
