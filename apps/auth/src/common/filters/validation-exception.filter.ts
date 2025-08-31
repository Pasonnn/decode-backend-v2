import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ValidationErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: {
    type: 'validation';
    details: Array<{
      field: string;
      message: string;
      value?: unknown;
    }>;
  };
  timestamp: string;
  path: string;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();
    let validationDetails: Array<{
      field: string;
      message: string;
      value?: unknown;
    }> = [];

    // Extract validation errors from the exception
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;

      if (Array.isArray(responseObj.message)) {
        // Handle class-validator errors
        validationDetails = (responseObj.message as string[]).map(
          (msg: string) => ({
            field: 'unknown',
            message: msg,
          }),
        );
      } else if (responseObj.message) {
        validationDetails = [
          {
            field: 'request',
            message: responseObj.message as string,
          },
        ];
      }
    }

    // Log validation errors
    this.logger.warn(
      `Validation failed for ${request.method} ${request.url}: ${validationDetails.map((d) => d.message).join(', ')}`,
    );

    // Create consistent validation error response
    const errorResponse: ValidationErrorResponse = {
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      error: {
        type: 'validation',
        details: validationDetails,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Send the response
    response.status(400).json(errorResponse);
  }
}
