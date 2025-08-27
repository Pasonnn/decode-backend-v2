import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';

@Injectable()
export class AuthServiceClient extends BaseHttpClient {
    constructor(
        private readonly configService: ConfigService,
        httpService: HttpService,
    ) {
        super(
            httpService,
            configService.get<string>('services.auth.url') || 'http://localhost:4001'
        );
    }

    async validateToken(accessToken: string): Promise<Response> {
        return this.post('/auth/info/by-access-token', { access_token: accessToken });
    }

    async login(credentials: { email_or_username: string; password: string; fingerprint_hashed: string }): Promise<Response> {
        return this.post('/auth/login', credentials);
    }

    async register(userData: { username: string; email: string; password: string }): Promise<Response> {
        return this.post('/auth/register/email-verification', userData);
    }

    async post<T>(url: string, data?: any): Promise<Response<T>> {
        return super.post<T>(url, data);
    }

    async get<T>(url: string): Promise<Response<T>> {
        return super.get<T>(url);
    }

    async put<T>(url: string, data?: any): Promise<Response<T>> {
        return super.put<T>(url, data);
    }

    async delete<T>(url: string): Promise<Response<T>> {
        return super.delete<T>(url);
    }
}