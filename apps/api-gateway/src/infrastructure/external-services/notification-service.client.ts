import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { AxiosRequestConfig } from 'axios';
import { MetricsService } from '../../common/datadog/metrics.service';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';

// Notification Service Interfaces
import {
  GetUserNotificationsRequest,
  MarkAsReadRequest,
} from '../../interfaces/notification-service.interface';

@Injectable()
export class NotificationServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
    metricsService: MetricsService,
  ) {
    super(
      httpService,
      configService.get<string>('services.notification.url') ||
        'http://localhost:4006',
      metricsService,
    );
  }

  // Health Check
  async checkHealth(): Promise<Response<{ status: string }>> {
    return this.get<{ status: string }>('/notifications/health');
  }

  // ==================== NOTIFICATION ENDPOINTS ====================

  /**
   * Get paginated notifications for user
   */
  async getUserNotifications(
    data: GetUserNotificationsRequest,
    authorization: string,
  ): Promise<Response<any>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/notifications?${queryString}`
      : '/notifications';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    data: MarkAsReadRequest,
    authorization: string,
  ): Promise<Response<any>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.patch(`/notifications/${data.id}/read`, {}, config);
  }

  /**
   * Mark all notifications as read
   */
  async markAsReadAll(authorization: string): Promise<Response<any>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.patch('/notifications/read-all', {}, config);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(authorization: string): Promise<Response<any>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get('/notifications/unread/count', config);
  }

  // Generic HTTP methods for flexibility
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.post<T>(url, data, config);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<Response<T>> {
    return super.get<T>(url, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.put<T>(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.patch<T>(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.delete<T>(url, config);
  }
}
