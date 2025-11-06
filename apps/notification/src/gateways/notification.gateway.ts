import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, forwardRef, Injectable } from '@nestjs/common';
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { NotificationService } from '../services/notification.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import {
  WebSocketConnection,
  NotificationWebSocketMessage,
  MarkReadWebSocketMessage,
} from '../interfaces/websocket.interface';
import { Notification } from '../schema/notification.schema';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { Response } from '../interfaces/response.interface';
import { NotificationPushService } from '../services/notification-push.service';
import { MetricsService } from '../common/datadog/metrics.service';

/**
 * WebSocket Gateway for real-time notifications
 * Handles client connections, authentication, and message broadcasting
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connections = new Map<string, WebSocketConnection>();

  constructor(
    private readonly jwtStrategy: JwtStrategy,
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => NotificationPushService))
    private readonly notificationPushService: NotificationPushService,
    private readonly metricsService?: MetricsService,
  ) {}

  /**
   * Handle client connection
   * Authenticates user and joins them to their personal room
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);

      // Extract and verify JWT token
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`No token provided for client: ${client.id}`);
        this.sendError(
          client,
          'AUTHENTICATION_REQUIRED',
          'Authentication token is required',
        );
        client.disconnect();
        return;
      }

      const payload_response: Response<JwtPayload> = this.verifyToken(token);
      if (!payload_response.success || !payload_response.data) {
        this.logger.warn(`Invalid token for client: ${client.id}`);
        this.sendError(client, 'INVALID_TOKEN', 'Invalid authentication token');
        client.disconnect();
        return;
      }

      const userId = payload_response.data.user_id;
      if (!userId) {
        this.logger.warn(`No user ID in token for client: ${client.id}`);
        this.sendError(client, 'INVALID_TOKEN', 'No user ID in token');
        client.disconnect();
        return;
      }

      // Store connection info
      const connection: WebSocketConnection = {
        socketId: client.id,
        userId,
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      this.connections.set(client.id, connection);

      // Add socket to Redis for scalability
      await this.redisInfrastructure.addUserSocket(userId, client.id);

      // Join user to their personal room
      const userRoom = `user_${userId}`;
      await client.join(userRoom);

      // Record WebSocket connection metrics
      this.metricsService?.increment('websocket.connection', 1, {
        user_id: userId,
        status: 'success',
      });
      this.metricsService?.gauge(
        'websocket.connections.active',
        this.connections.size,
      );

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Notify user of successful connection
      client.emit('user_connected', {
        event: 'user_connected',
        data: { userId, socketId: client.id },
        timestamp: new Date(),
      });

      // Push undelivered notifications
      await this.notificationPushService.pushUndeliveredNotifications({
        user_id: userId,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      this.sendError(
        client,
        'CONNECTION_ERROR',
        'Failed to establish connection',
      );
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: Socket): Promise<void> {
    const connection = this.connections.get(client.id);
    if (connection) {
      const connectionDuration = Date.now() - connection.connectedAt.getTime();

      this.logger.log(
        `User ${connection.userId} disconnected (socket: ${client.id})`,
      );

      // Remove socket from Redis
      await this.redisInfrastructure.removeUserSocket(
        connection.userId,
        client.id,
      );

      this.connections.delete(client.id);

      // Record WebSocket disconnection metrics
      this.metricsService?.increment('websocket.disconnection', 1, {
        user_id: connection.userId,
      });
      this.metricsService?.gauge(
        'websocket.connections.active',
        this.connections.size,
      );
      this.metricsService?.timing(
        'websocket.connection.duration',
        connectionDuration,
        {
          user_id: connection.userId,
        },
      );
    } else {
      this.logger.log(`Unknown client disconnected: ${client.id}`);
      this.metricsService?.increment('websocket.disconnection', 1, {
        status: 'unknown',
      });
    }
  }

  /**
   * Handle notification read event from client
   */
  @SubscribeMessage('mark_notification_read')
  async handleMarkNotificationRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const connection = this.connections.get(client.id);
      if (!connection) {
        this.sendError(client, 'NOT_AUTHENTICATED', 'User not authenticated');
        return;
      }

      // Update last activity
      connection.lastActivity = new Date();

      const startTime = Date.now();

      // Mark notification as read in database
      const notification = await this.notificationService.markAsRead(
        data.notificationId,
        connection.userId,
      );

      const duration = Date.now() - startTime;
      this.metricsService?.timing('websocket.message.duration', duration, {
        event_type: 'mark_notification_read',
        user_id: connection.userId,
      });
      this.metricsService?.increment('websocket.message.received', 1, {
        event_type: 'mark_notification_read',
        user_id: connection.userId,
      });

      if (!notification) {
        this.sendError(client, 'NOT_FOUND', 'Notification not found');
        return;
      }

      // Emit notification read event
      const message: MarkReadWebSocketMessage = {
        event: 'mark_notification_read',
        data: { notificationId: data.notificationId },
        timestamp: new Date(),
        userId: connection.userId,
      };

      client.emit('notification_read', message);

      this.logger.log(
        `Notification ${data.notificationId} marked as read by user ${connection.userId}`,
      );
    } catch (error) {
      this.logger.error(`Error marking notification as read:`, error);
      this.sendError(
        client,
        'MARK_READ_ERROR',
        'Failed to mark notification as read',
      );
    }
  }

  /**
   * Send notification to specific user via WebSocket
   * @param userId - The user ID
   * @param notification - The notification object
   * @returns Promise<boolean> - Success status (true if user is connected and message sent)
   */
  async sendNotificationToUser(
    userId: string,
    notification: Notification,
  ): Promise<boolean> {
    const startTime = Date.now();
    try {
      // Check if user is connected via WebSocket
      const isUserConnected = await this.isUserConnected(userId);

      if (!isUserConnected) {
        this.logger.log(
          `User ${userId} is not connected via WebSocket. Notification ${notification.title} will not be delivered in real-time.`,
        );
        this.metricsService?.increment('websocket.message.failed', 1, {
          event_type: 'notification_received',
          user_id: userId,
          reason: 'user_not_connected',
        });
        return false;
      }

      const userRoom = `user_${userId}`;

      const message: NotificationWebSocketMessage = {
        event: 'notification_received',
        data: {
          id: (notification._id as string).toString(),
          user_id: notification.user_id.toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          delivered: notification.delivered,
          delivered_at: notification.delivered_at,
          read: notification.read,
          read_at: notification.read_at,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        },
        timestamp: new Date(),
        userId,
      };

      // Send to all sockets in the user's room
      this.server.to(userRoom).emit('notification_received', message);

      const duration = Date.now() - startTime;
      this.metricsService?.timing('websocket.message.duration', duration, {
        event_type: 'notification_received',
        user_id: userId,
        notification_type: notification.type,
      });
      this.metricsService?.increment('websocket.message.sent', 1, {
        event_type: 'notification_received',
        user_id: userId,
        notification_type: notification.type,
      });

      this.logger.log(
        `Notification sent to user ${userId} via WebSocket: ${notification.title}`,
      );

      // Mark as delivered in database
      await this.notificationService.markAsDelivered(
        (notification._id as string).toString(),
      );

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('websocket.message.duration', duration, {
        event_type: 'notification_received',
        user_id: userId,
        error: 'true',
      });
      this.metricsService?.increment('websocket.message.failed', 1, {
        event_type: 'notification_received',
        user_id: userId,
        reason: 'error',
      });
      this.logger.error(`Error sending notification to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast notification to all connected users
   * @param notification - The notification object
   */
  broadcastNotification(notification: Notification): void {
    try {
      const message: NotificationWebSocketMessage = {
        event: 'notification_received',
        data: {
          id: (notification._id as string).toString(),
          user_id: notification.user_id.toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          delivered: notification.delivered,
          delivered_at: notification.delivered_at,
          read: notification.read,
          read_at: notification.read_at,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
        },
        timestamp: new Date(),
      };

      this.server.emit('notification_received', message);
      this.logger.log(`Broadcast notification: ${notification.title}`);
    } catch (error) {
      this.logger.error(`Error broadcasting notification:`, error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connections.size;
  }

  /**
   * Get connected users list
   */
  getConnectedUsers(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Check if user is connected
   */
  async isUserConnected(userId: string): Promise<boolean> {
    return await this.redisInfrastructure.hasUserSockets(userId);
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token as string;
    if (token) {
      return token;
    }

    return null;
  }

  /**
   * Verify JWT token
   */
  private verifyToken(token: string): Response<JwtPayload> {
    try {
      const payload: Response<JwtPayload> =
        this.jwtStrategy.validateAccessToken(token);
      return payload;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid token',
      };
    }
  }

  /**
   * Send error message to client
   */
  private sendError(client: Socket, code: string, message: string): void {
    const errorResponse = {
      event: 'error',
      error: {
        code,
        message,
        timestamp: new Date(),
      },
    };

    client.emit('error', errorResponse);
  }
}
