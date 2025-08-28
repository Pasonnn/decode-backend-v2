import { Response } from '../../interfaces/response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
  ): Response<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
    };
  }

  static error(
    message: string,
    statusCode = 500,
    error?: string | Record<string, unknown>,
  ): Response {
    return {
      success: false,
      statusCode,
      message,
      error,
    };
  }
}
