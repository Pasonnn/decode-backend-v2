import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';

// Auth Service Interfaces
export interface RegisterInfoRequest {
    username: string;
    email: string;
    password: string;
}

export interface VerifyEmailRequest {
    code: string;
}

export interface LoginRequest {
    email_or_username: string;
    password: string;
    fingerprint_hashed: string;
}

export interface FingerprintEmailVerificationRequest {
    code: string;
}

export interface RefreshSessionRequest {
    session_token: string;
}

export interface GetActiveSessionsRequest {
    user_id: string;
}

export interface LogoutRequest {
    session_token: string;
}

export interface RevokeAllSessionsRequest {
    user_id: string;
}

export interface ValidateAccessRequest {
    access_token: string;
}

export interface CreateSsoTokenRequest {
    user_id: string;
}

export interface ValidateSsoTokenRequest {
    sso_token: string;
}

export interface ChangePasswordRequest {
    user_id: string;
    old_password: string;
    new_password: string;
}

export interface EmailVerificationChangePasswordRequest {
    user_id: string;
}

export interface VerifyEmailChangePasswordRequest {
    code: string;
}

export interface ChangeForgotPasswordRequest {
    code: string;
    new_password: string;
}

export interface InfoByAccessTokenRequest {
    access_token: string;
}

export interface InfoByUserIdRequest {
    user_id: string;
}

export interface InfoByEmailOrUsernameRequest {
    email_or_username: string;
}

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

    // Health Check
    async checkHealth(): Promise<Response<{ status: string }>> {
        return this.get<{ status: string }>('/auth/healthz');
    }

    // Registration Endpoints
    async emailVerificationRegister(data: RegisterInfoRequest): Promise<Response> {
        return this.post('/auth/register/email-verification', data);
    }

    async verifyEmailRegister(data: VerifyEmailRequest): Promise<Response> {
        return this.post('/auth/register/verify-email', data);
    }

    // Login Endpoints
    async login(data: LoginRequest): Promise<Response> {
        return this.post('/auth/login', data);
    }

    async fingerprintEmailVerification(data: FingerprintEmailVerificationRequest): Promise<Response> {
        return this.post('/auth/login/fingerprint/email-verification', data);
    }

    // Session Management Endpoints
    async refreshSession(data: RefreshSessionRequest): Promise<Response> {
        return this.post('/auth/session/refresh', data);
    }

    async getActiveSessions(data: GetActiveSessionsRequest): Promise<Response> {
        return this.post('/auth/session/active', data);
    }

    async logout(data: LogoutRequest): Promise<Response> {
        return this.post('/auth/session/logout', data);
    }

    async revokeAllSessions(data: RevokeAllSessionsRequest): Promise<Response> {
        return this.post('/auth/session/revoke-all', data);
    }

    async validateAccess(data: ValidateAccessRequest): Promise<Response> {
        return this.post('/auth/session/validate-access', data);
    }

    async createSsoToken(data: CreateSsoTokenRequest): Promise<Response> {
        return this.post('/auth/session/sso', data);
    }

    async validateSsoToken(data: ValidateSsoTokenRequest): Promise<Response> {
        return this.post('/auth/session/sso/validate', data);
    }

    // Password Management Endpoints
    async changePassword(data: ChangePasswordRequest): Promise<Response> {
        return this.post('/auth/password/change', data);
    }

    async emailVerificationChangePassword(data: EmailVerificationChangePasswordRequest): Promise<Response> {
        return this.post('/auth/password/forgot/email-verification', data);
    }

    async verifyEmailChangePassword(data: VerifyEmailChangePasswordRequest): Promise<Response> {
        return this.post('/auth/password/forgot/verify-email', data);
    }

    async changeForgotPassword(data: ChangeForgotPasswordRequest): Promise<Response> {
        return this.post('/auth/password/forgot/change', data);
    }

    // User Info Endpoints
    async infoByAccessToken(data: InfoByAccessTokenRequest): Promise<Response> {
        return this.post('/auth/info/by-access-token', data);
    }

    async infoByUserId(data: InfoByUserIdRequest): Promise<Response> {
        return this.post('/auth/info/by-user-id', data);
    }

    async infoByEmailOrUsername(data: InfoByEmailOrUsernameRequest): Promise<Response> {
        return this.post('/auth/info/by-email-or-username', data);
    }

    // Legacy method for backward compatibility
    async validateToken(accessToken: string): Promise<Response> {
        return this.infoByAccessToken({ access_token: accessToken });
    }

    // Generic HTTP methods for flexibility
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