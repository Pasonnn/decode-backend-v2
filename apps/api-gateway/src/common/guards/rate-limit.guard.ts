import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';
import { RateLimitService } from '../../infrastructure/cache/rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    try {
      const key = this.generateKey(request, rateLimitOptions);
      const isAllowed = await this.checkRateLimit(
        key,
        rateLimitOptions,
        response,
      );

      if (!isAllowed) {
        const message =
          rateLimitOptions.message ||
          'Too many requests, please try again later.';
        throw new HttpException(
          {
            success: false,
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message,
            error: 'Rate limit exceeded',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Rate limiting error: ${error.message}`);
      // If Redis is down, allow the request (fail open)
      return true;
    }
  }

  private generateKey(request: Request, options: RateLimitOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Default key generation based on IP and user ID
    const ip = this.getClientIP(request);
    const userId = (request as any).user?.userId;

    if (userId) {
      return `rate_limit:user:${userId}`;
    }

    return `rate_limit:ip:${ip}`;
  }

  private async checkRateLimit(
    key: string,
    options: RateLimitOptions,
    response: Response,
  ): Promise<boolean> {
    const { allowed, info } = await this.rateLimitService.isAllowed(
      key,
      options.windowMs,
      options.max,
    );

    // Set rate limit headers
    this.setRateLimitHeaders(
      response,
      info.limit,
      info.remaining,
      options.windowMs,
    );

    return allowed;
  }

  private setRateLimitHeaders(
    response: Response,
    limit: number,
    remaining: number,
    windowMs: number,
  ): void {
    const resetTime = new Date(Date.now() + windowMs).toISOString();

    // Standard headers (RFC 6585)
    response.setHeader('RateLimit-Limit', limit.toString());
    response.setHeader(
      'RateLimit-Remaining',
      Math.max(0, limit - remaining).toString(),
    );
    response.setHeader('RateLimit-Reset', resetTime);

    // Legacy headers (X-RateLimit-*)
    response.setHeader('X-RateLimit-Limit', limit.toString());
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, limit - remaining).toString(),
    );
    response.setHeader(
      'X-RateLimit-Reset',
      Math.floor(Date.now() / 1000 + windowMs / 1000).toString(),
    );
  }

  private getClientIP(request: Request): string {
    // Get the real IP address, considering proxies
    const xForwardedFor = request.headers['x-forwarded-for'] as string;
    const xRealIP = request.headers['x-real-ip'] as string;

    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    if (xRealIP) {
      return xRealIP;
    }

    return request.ip || request.connection.remoteAddress || 'unknown';
  }
}
