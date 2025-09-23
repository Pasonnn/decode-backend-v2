import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Response } from '../../interfaces/response.interface';

@Injectable()
export abstract class BaseHttpClient {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly httpService: HttpService,
    protected baseURL: string,
  ) {}

  protected async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
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
      return response.data;
    } catch (error) {
      this.handleError(error, 'GET', url);
    }
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
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
      return response.data;
    } catch (error) {
      this.handleError(error, 'POST', url);
    }
  }

  protected async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
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
      return response.data;
    } catch (error) {
      this.handleError(error, 'PUT', url);
    }
  }

  protected async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
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
      return response.data;
    } catch (error) {
      this.handleError(error, 'PATCH', url);
    }
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
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
      return response.data;
    } catch (error) {
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
}
