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

// Extend Request interface to include requestId
interface RequestWithId extends Request {
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string | Record<string, unknown>;
  timestamp: string;
  path: string;
  requestId?: string | null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

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

        // Get message and error from response data
        message =
          (responseData?.message as string) ||
          this.getDefaultMessageForStatus(status);
        const errorData = responseData?.error;
        error =
          typeof errorData === 'string' || typeof errorData === 'object'
            ? (errorData as string | Record<string, unknown>)
            : this.getDefaultErrorForStatus(status);
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
      requestId: request.requestId || null,
    };

    // Send the response
    response.status(status).json(errorResponse);
  }

  /**
   * Get default error message for HTTP status codes
   */
  private getDefaultMessageForStatus(status: number): string {
    const statusMessages: Record<number, string> = {
      // 4xx Client Errors
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized access',
      [HttpStatus.PAYMENT_REQUIRED]: 'Payment required',
      [HttpStatus.FORBIDDEN]: 'Access forbidden',
      [HttpStatus.NOT_FOUND]: 'Resource not found',
      [HttpStatus.METHOD_NOT_ALLOWED]: 'Method not allowed',
      [HttpStatus.NOT_ACCEPTABLE]: 'Not acceptable',
      [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]:
        'Proxy authentication required',
      [HttpStatus.REQUEST_TIMEOUT]: 'Request timeout',
      [HttpStatus.CONFLICT]: 'Resource conflict',
      [HttpStatus.GONE]: 'Resource no longer available',
      [HttpStatus.LENGTH_REQUIRED]: 'Content length required',
      [HttpStatus.PRECONDITION_FAILED]: 'Precondition failed',
      [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload too large',
      [HttpStatus.URI_TOO_LONG]: 'URI too long',
      [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported media type',
      [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]:
        'Requested range not satisfiable',
      [HttpStatus.EXPECTATION_FAILED]: 'Expectation failed',
      [HttpStatus.I_AM_A_TEAPOT]: "I'm a teapot",
      [HttpStatus.MISDIRECTED]: 'Misdirected request',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable entity',
      [HttpStatus.FAILED_DEPENDENCY]: 'Failed dependency',
      [HttpStatus.PRECONDITION_REQUIRED]: 'Precondition required',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests',
      [431]: 'Request header fields too large',
      [451]: 'Unavailable for legal reasons',

      // 5xx Server Errors
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
      [HttpStatus.NOT_IMPLEMENTED]: 'Not implemented',
      [HttpStatus.BAD_GATEWAY]: 'Bad gateway',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service unavailable',
      [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway timeout',
      [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP version not supported',
      [506]: 'Variant also negotiates',
      [507]: 'Insufficient storage',
      [508]: 'Loop detected',
      [510]: 'Not extended',
      [511]: 'Network authentication required',
    };

    return statusMessages[status] || 'Request failed';
  }

  /**
   * Get default error details for HTTP status codes
   */
  private getDefaultErrorForStatus(status: number): string {
    const statusErrors: Record<number, string> = {
      // 4xx Client Errors
      [HttpStatus.BAD_REQUEST]: 'The request was invalid or cannot be served',
      [HttpStatus.UNAUTHORIZED]:
        'Authentication failed or credentials are missing',
      [HttpStatus.PAYMENT_REQUIRED]:
        'Payment is required to access this resource',
      [HttpStatus.FORBIDDEN]:
        'You do not have permission to access this resource',
      [HttpStatus.NOT_FOUND]: 'The requested resource was not found',
      [HttpStatus.METHOD_NOT_ALLOWED]:
        'The HTTP method is not allowed for this resource',
      [HttpStatus.NOT_ACCEPTABLE]:
        'The request cannot produce a response matching the accept headers',
      [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]:
        'Proxy authentication is required',
      [HttpStatus.REQUEST_TIMEOUT]: 'The request took too long to process',
      [HttpStatus.CONFLICT]:
        'The request conflicts with the current state of the resource',
      [HttpStatus.GONE]:
        'The resource is no longer available and will not be available again',
      [HttpStatus.LENGTH_REQUIRED]: 'The Content-Length header is required',
      [HttpStatus.PRECONDITION_FAILED]:
        'One or more preconditions in the request header fields evaluated to false',
      [HttpStatus.PAYLOAD_TOO_LARGE]: 'The request payload is too large',
      [HttpStatus.URI_TOO_LONG]:
        'The URI provided was too long for the server to process',
      [HttpStatus.UNSUPPORTED_MEDIA_TYPE]:
        'The media format is not supported by the server',
      [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]:
        'The range specified in the Range header field cannot be fulfilled',
      [HttpStatus.EXPECTATION_FAILED]:
        'The expectation given in the Expect header field could not be met',
      [HttpStatus.I_AM_A_TEAPOT]:
        'The server refuses to brew coffee because it is a teapot',
      [HttpStatus.MISDIRECTED]:
        'The request was directed at a server that is not able to produce a response',
      [HttpStatus.UNPROCESSABLE_ENTITY]:
        'The request was well-formed but contains semantic errors',
      [HttpStatus.FAILED_DEPENDENCY]:
        'The request failed due to failure of a previous request',
      [HttpStatus.PRECONDITION_REQUIRED]:
        'The origin server requires the request to be conditional',
      [HttpStatus.TOO_MANY_REQUESTS]:
        'The user has sent too many requests in a given amount of time',
      [431]:
        'The server is unwilling to process the request due to large header fields',
      [451]: 'The resource is unavailable due to legal reasons',

      // 5xx Server Errors
      [HttpStatus.INTERNAL_SERVER_ERROR]:
        'An unexpected error occurred on the server',
      [HttpStatus.NOT_IMPLEMENTED]:
        'The server does not support the functionality required to fulfill the request',
      [HttpStatus.BAD_GATEWAY]:
        'The server received an invalid response from an upstream server',
      [HttpStatus.SERVICE_UNAVAILABLE]:
        'The server is currently unable to handle the request due to temporary overload or maintenance',
      [HttpStatus.GATEWAY_TIMEOUT]:
        'The server did not receive a timely response from an upstream server',
      [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]:
        'The server does not support the HTTP protocol version used in the request',
      [506]: 'The server has an internal configuration error',
      [507]:
        'The server is unable to store the representation needed to complete the request',
      [508]:
        'The server detected an infinite loop while processing the request',
      [510]:
        'Further extensions to the request are required for the server to fulfill it',
      [511]: 'The client needs to authenticate to gain network access',
    };

    return (
      statusErrors[status] || 'An error occurred while processing the request'
    );
  }
}
