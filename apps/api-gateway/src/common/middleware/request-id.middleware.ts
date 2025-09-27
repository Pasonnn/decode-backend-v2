import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private logger = new Logger('RequestIdMiddleware');

  use(request: Request, response: Response, next: NextFunction): void {
    // Extract request ID from headers (common header names)
    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-trace-id'] as string) ||
      (request.headers['request-id'] as string) ||
      (request.headers['correlation-id'] as string) ||
      (request.headers['trace-id'] as string);

    // If no request ID provided, generate one
    const finalRequestId = requestId || uuidv4();

    // Store request ID in request object for use in controllers/interceptors
    request.requestId = finalRequestId;

    // Add request ID to response headers
    response.setHeader('X-Request-ID', finalRequestId);

    next();
  }
}
