export interface Response<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}
