/**
 * Notification Service Request Interfaces
 * These interfaces define the request payloads for notification service endpoints
 */

export interface GetUserNotificationsRequest {
  page?: number;
  limit?: number;
}

export interface MarkAsReadRequest {
  id: string;
}
