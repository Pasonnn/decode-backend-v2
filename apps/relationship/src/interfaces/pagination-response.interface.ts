export interface PaginationResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    users: T;
    meta: {
      total: number;
      page: number;
      limit: number;
      is_last_page: boolean;
    };
  };
  error?: string;
}
