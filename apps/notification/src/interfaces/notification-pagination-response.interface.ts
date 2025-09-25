import { Response } from './response.interface';

export interface NotificationPaginationResponse<T = unknown> extends Response {
  data?: {
    notifications: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      is_last_page: boolean;
    };
  };
}
