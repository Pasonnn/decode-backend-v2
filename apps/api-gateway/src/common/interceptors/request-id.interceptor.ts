import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  private logger = new Logger('RequestIdInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = request.requestId;

    if (requestId) {
      // Ensure request ID is in response headers
      response.setHeader('X-Request-ID', requestId);
    }

    return next.handle().pipe(
      tap(() => {
        // Log completion with request ID
        if (requestId) {
          this.logger.log(
            `Request ID ${requestId} completed for ${request.method} ${request.path}`,
          );
        }
      }),
    );
  }
}
