import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { Response } from '../../interfaces/response.interface';

// Extend Request interface to include requestId
interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  private logger = new Logger('ResponseTransformInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const requestId = request.requestId;

    return next.handle().pipe(
      map((data: Response) => {
        // If the response is already in the expected format with success, statusCode, message, data
        if (data && typeof data === 'object' && 'success' in data) {
          return {
            ...data,
            requestId: requestId || null,
          };
        }

        // If the response is not in the expected format, wrap it
        return {
          success: true,
          statusCode: 200,
          message: 'Request processed successfully',
          data,
          requestId: requestId || null,
        };
      }),
    );
  }
}
