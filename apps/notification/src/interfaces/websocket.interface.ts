/**
 * WebSocket interfaces for notification service
 */

export interface WebSocketConnection {
  socketId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface NotificationWebSocketMessage extends WebSocketMessage {
  event: 'notification_received';
  data: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    delivered: boolean;
    delivered_at?: Date;
    read: boolean;
    read_at?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface MarkReadWebSocketMessage extends WebSocketMessage {
  event: 'mark_notification_read';
  data: {
    notificationId: string;
  };
}
