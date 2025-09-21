import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, path: url } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = request.requestId;

    response.on('close', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const requestIdLog = requestId ? `[${requestId}] ` : '';

      this.logger.log(
        `${requestIdLog}${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
