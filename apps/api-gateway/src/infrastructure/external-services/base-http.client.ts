import {
  Injectable,
  Logger,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Response } from '../../interfaces/response.interface';
import { MetricsService } from '../../common/datadog/metrics.service';

@Injectable()
export abstract class BaseHttpClient {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly httpService: HttpService,
    protected baseURL: string,
    protected readonly metricsService?: MetricsService,
  ) {}

  protected async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    const serviceName = this.extractServiceName();
    const startTime = Date.now();

    try {
      const requestConfig: AxiosRequestConfig = {
        timeout: 10000, // 10 second timeout
        ...config,
      };

      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.get<Response<T>>(
          `${this.baseURL}${url}`,
          requestConfig,
        ),
      );

      const duration = Date.now() - startTime;
      this.recordMetrics('GET', url, serviceName, response.status, duration);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      const statusCode = (error as AxiosError)?.response?.status || 500;

      this.recordMetrics('GET', url, serviceName, statusCode, duration, true);
      this.handleError(error, 'GET', url);
    }
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    const serviceName = this.extractServiceName();
    const startTime = Date.now();

    try {
      const requestConfig: AxiosRequestConfig = {
        timeout: 10000, // 10 second timeout
        ...config,
      };

      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.post<Response<T>>(
          `${this.baseURL}${url}`,
          data,
          requestConfig,
        ),
      );

      const duration = Date.now() - startTime;
      this.recordMetrics('POST', url, serviceName, response.status, duration);

      return this.handleUnsuccessfulResponse(response);
    } catch (error) {
      const duration = Date.now() - startTime;

      const statusCode = (error as AxiosError)?.response?.status || 500;

      this.recordMetrics('POST', url, serviceName, statusCode, duration, true);
      this.handleError(error, 'POST', url);
    }
  }

  protected async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    const serviceName = this.extractServiceName();
    const startTime = Date.now();

    try {
      const requestConfig: AxiosRequestConfig = {
        timeout: 10000, // 10 second timeout
        ...config,
      };

      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.put<Response<T>>(
          `${this.baseURL}${url}`,
          data,
          requestConfig,
        ),
      );

      const duration = Date.now() - startTime;
      this.recordMetrics('PUT', url, serviceName, response.status, duration);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      const statusCode = (error as AxiosError)?.response?.status || 500;

      this.recordMetrics('PUT', url, serviceName, statusCode, duration, true);
      this.handleError(error, 'PUT', url);
    }
  }

  protected async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    const serviceName = this.extractServiceName();
    const startTime = Date.now();

    try {
      const requestConfig: AxiosRequestConfig = {
        timeout: 10000, // 10 second timeout
        ...config,
      };

      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.patch<Response<T>>(
          `${this.baseURL}${url}`,
          data,
          requestConfig,
        ),
      );

      const duration = Date.now() - startTime;
      this.recordMetrics('PATCH', url, serviceName, response.status, duration);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      const statusCode = (error as AxiosError)?.response?.status || 500;

      this.recordMetrics('PATCH', url, serviceName, statusCode, duration, true);
      this.handleError(error, 'PATCH', url);
    }
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    const serviceName = this.extractServiceName();
    const startTime = Date.now();

    try {
      const requestConfig: AxiosRequestConfig = {
        timeout: 10000, // 10 second timeout
        ...config,
      };

      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.delete<Response<T>>(
          `${this.baseURL}${url}`,
          requestConfig,
        ),
      );

      const duration = Date.now() - startTime;
      this.recordMetrics('DELETE', url, serviceName, response.status, duration);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      const statusCode = (error as AxiosError)?.response?.status || 500;

      this.recordMetrics(
        'DELETE',
        url,
        serviceName,
        statusCode,
        duration,
        true,
      );
      this.handleError(error, 'DELETE', url);
    }
  }

  private handleError(error: any, method: string, url: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullUrl = `${this.baseURL}${url}`;

    this.logger.error(`HTTP ${method} ${fullUrl} failed: ${errorMessage}`);

    // Preserve AxiosError to maintain status codes and response data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.response) {
      // Log additional details for debugging

      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Response status: ${error.response.status}, Response data: ${JSON.stringify(error.response.data)}`,
      );
      throw error; // Re-throw the original AxiosError
    }

    // Handle timeout errors specifically
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.code === 'ECONNABORTED') {
      throw new Error(
        `Request timeout: ${method} ${fullUrl} exceeded 10 seconds`,
      );
    }

    // Handle network errors
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      throw new Error(
        `Service unavailable: ${method} ${fullUrl} - service may be down`,
      );
    }

    throw new Error(`Network error: ${errorMessage}`);
  }

  /**
   * Extract service name from baseURL
   */
  private extractServiceName(): string {
    try {
      const url = new URL(this.baseURL);
      const hostname = url.hostname;
      // Extract service name from hostname (e.g., auth:4001 -> auth)
      if (hostname.includes('auth')) return 'auth';
      if (hostname.includes('user')) return 'user';
      if (hostname.includes('wallet')) return 'wallet';
      if (hostname.includes('relationship')) return 'relationship';
      if (hostname.includes('notification')) return 'notification';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Record metrics for service calls
   */
  private recordMetrics(
    method: string,
    url: string,
    serviceName: string,
    statusCode: number,
    duration: number,
    isError: boolean = false,
  ): void {
    if (!this.metricsService) return;

    const endpoint = this.normalizeEndpoint(url);

    // Record service call duration
    this.metricsService.timing('gateway.service.call.duration', duration, {
      service_name: serviceName,
      endpoint,
      status_code: statusCode.toString(),
    });

    // Record service call count
    this.metricsService.increment('gateway.service.call.count', 1, {
      service_name: serviceName,
      endpoint,
      status_code: statusCode.toString(),
    });

    // Record errors
    if (isError || statusCode >= 400) {
      this.metricsService.increment('gateway.service.call.failed', 1, {
        service_name: serviceName,
        endpoint,
        status_code: statusCode.toString(),
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
      });
    }

    // Record timeouts (if applicable)
    if (duration >= 10000) {
      this.metricsService.increment('gateway.service.call.timeout', 1, {
        service_name: serviceName,
      });
    }
  }

  /**
   * Normalize endpoint URL by replacing IDs with placeholders
   */
  private normalizeEndpoint(url: string): string {
    // Remove query parameters
    const pathWithoutQuery = url.split('?')[0];
    // Replace MongoDB ObjectIds
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

  private handleUnsuccessfulResponse(
    response: AxiosResponse<Response<any>>,
  ): Response<any> {
    if (response.data.success) {
      return response.data;
    }
    // Create a mapping of status codes to exception constructors
    const statusToExceptionMap = new Map([
      [HttpStatus.BAD_REQUEST, BadRequestException],
      [HttpStatus.NOT_FOUND, NotFoundException],
      [HttpStatus.FORBIDDEN, ForbiddenException],
      [HttpStatus.UNAUTHORIZED, UnauthorizedException],
    ]);

    const ExceptionClass =
      statusToExceptionMap.get(response.data.statusCode) ||
      InternalServerErrorException;
    throw new ExceptionClass(response.data.message, response.data.error);
  }
}
