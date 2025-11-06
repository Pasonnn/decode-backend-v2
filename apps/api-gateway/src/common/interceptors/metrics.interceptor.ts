/**
 * @fileoverview Metrics Interceptor
 *
 * Automatically collects HTTP request metrics including:
 * - Request duration
 * - Request count by status code
 * - Request/response sizes
 * - Error rates
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../datadog/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract route information
    const method = request.method;
    const route = this.getRoute(request);
    const statusCode = response.statusCode;

    // Extract request size
    const requestSize = this.getRequestSize(request);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const responseSize = this.getResponseSize(data);

        // Record request duration
        this.metricsService.timing('http.request.duration', duration, {
          method,
          route,
          status_code: statusCode.toString(),
        });

        // Record request count
        this.metricsService.increment('http.request.count', 1, {
          method,
          route,
          status_code: statusCode.toString(),
        });

        // Record request size
        if (requestSize > 0) {
          this.metricsService.histogram('http.request.size', requestSize, {
            method,
            route,
          });
        }

        // Record response size
        if (responseSize > 0) {
          this.metricsService.histogram('http.response.size', responseSize, {
            method,
            route,
            status_code: statusCode.toString(),
          });
        }

        // Record error if status code >= 400
        if (statusCode >= 400) {
          this.metricsService.increment('http.request.error', 1, {
            method,
            route,
            status_code: statusCode.toString(),
            error_type: statusCode >= 500 ? 'server_error' : 'client_error',
          });
        }
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;

        const errorStatusCode = (error as { status?: number })?.status || 500;
        const errorType =
          errorStatusCode >= 500 ? 'server_error' : 'client_error';

        // Record error metrics
        this.metricsService.increment('http.request.error', 1, {
          method,
          route,

          status_code: String(errorStatusCode),
          error_type: errorType,
        });

        // Record error duration
        this.metricsService.timing('http.request.duration', duration, {
          method,
          route,

          status_code: String(errorStatusCode),
        });

        // Record error count
        this.metricsService.increment('http.request.count', 1, {
          method,
          route,

          status_code: String(errorStatusCode),
        });

        throw error;
      }),
    );
  }

  /**
   * Get normalized route path
   */
  private getRoute(request: Request): string {
    // Use route path if available, otherwise use URL path

    const route =
      (request.route as { path?: string })?.path || request.path || request.url;
    // Normalize route (remove query params, normalize IDs)

    return this.normalizeRoute(route);
  }

  /**
   * Normalize route path by replacing IDs with placeholders
   */
  private normalizeRoute(path: string): string {
    // Remove query parameters
    const pathWithoutQuery = path.split('?')[0];
    // Replace MongoDB ObjectIds (24 hex chars)
    const normalized = pathWithoutQuery.replace(
      /\/[0-9a-fA-F]{24}\//g,
      '/:id/',
    );
    // Replace UUIDs
    return normalized.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//g,
      '/:id/',
    );
  }

  /**
   * Get request size in bytes
   */
  private getRequestSize(request: Request): number {
    const contentLength = request.get('content-length');
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    // Estimate from body if available
    if (request.body) {
      try {
        return JSON.stringify(request.body).length;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Get response size in bytes
   */
  private getResponseSize(data: any): number {
    if (!data) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
