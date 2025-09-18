export interface ResponseWithCount<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    users: T[];
    meta: {
      total: number;
    };
  };
  error?: string;
}
