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
      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.get<Response<T>>(`${this.baseURL}${url}`, config),
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
      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.post<Response<T>>(
          `${this.baseURL}${url}`,
          data,
          config,
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
      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.put<Response<T>>(
          `${this.baseURL}${url}`,
          data,
          config,
        ),
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'PUT', url);
    }
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    try {
      const response: AxiosResponse<Response<T>> = await firstValueFrom(
        this.httpService.delete<Response<T>>(`${this.baseURL}${url}`, config),
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'DELETE', url);
    }
  }

  private handleError(error: any, method: string, url: string): never {
    this.logger.error(
      `HTTP ${method} ${this.baseURL}${url} failed: ${error instanceof Error ? error.message : String(error)}`,
    );

    // Preserve AxiosError to maintain status codes and response data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.response) {
      throw error; // Re-throw the original AxiosError
    }

    throw new Error(
      `Network error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
