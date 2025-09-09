import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AxiosError } from 'axios';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string | Record<string, unknown>;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string | Record<string, unknown> | undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        error =
          typeof responseObj.error === 'string' ||
          typeof responseObj.error === 'object'
            ? (responseObj.error as string | Record<string, unknown>)
            : 'Service communication failed';
      } else {
        message = exception.message;
      }
    } else if (exception instanceof AxiosError) {
      // Handle Axios errors (HTTP client errors)
      if (exception.response) {
        status = exception.response.status;
        const responseData = exception.response.data as Record<string, unknown>;
        message = (responseData?.message as string) || 'External service error';
        const errorData = responseData?.error;
        error =
          typeof errorData === 'string' || typeof errorData === 'object'
            ? (errorData as string | Record<string, unknown>)
            : 'Service communication failed';
      } else if (exception.request) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Service temporarily unavailable';
        error = 'External service is not responding';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
        error = 'Network configuration error';
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Unknown error occurred';
    }

    // Log the error (concise)
    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${message}`,
    );

    // Create consistent error response
    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Send the response
    response.status(status).json(errorResponse);
  }
}
