import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';
import { AxiosRequestConfig } from 'axios';

// Auth Service Interfaces
export interface RegisterInfoRequest {
  username: string;
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface SendEmailVerificationRequest {
  email: string;
}

export interface LoginRequest {
  email_or_username: string;
  password: string;
  fingerprint_hashed: string;
}

export interface FingerprintEmailVerificationRequest {
  code: string;
}

export interface ResendDeviceFingerprintEmailVerificationRequest {
  email_or_username: string;
  fingerprint_hashed: string;
}

export interface RefreshSessionRequest {
  session_token: string;
}

export interface GetActiveSessionsRequest {
  user_id: string;
  authorization: string;
}

export interface LogoutRequest {
  session_token: string;
  authorization: string;
}

export interface RevokeAllSessionsRequest {
  user_id: string;
  authorization: string;
}

export interface ValidateAccessRequest {
  access_token: string;
  authorization: string;
}

export interface CreateSsoTokenRequest {
  user_id: string;
  authorization: string;
}

export interface ValidateSsoTokenRequest {
  sso_token: string;
  authorization: string;
}

export interface ChangePasswordRequest {
  user_id: string;
  old_password: string;
  new_password: string;
  authorization: string;
}

export interface EmailVerificationChangePasswordRequest {
  user_id: string;
  authorization: string;
}

export interface VerifyEmailChangePasswordRequest {
  code: string;
  authorization: string;
}

export interface ChangeForgotPasswordRequest {
  code: string;
  new_password: string;
  authorization: string;
}

export interface InfoByAccessTokenRequest {
  access_token: string;
  authorization: string;
}

export interface InfoByUserIdRequest {
  user_id: string;
  authorization: string;
}

export interface InfoByEmailOrUsernameRequest {
  email_or_username: string;
  authorization: string;
}

export interface ExistUserByEmailOrUsernameRequest {
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
      configService.get<string>('services.auth.url') || 'http://localhost:4001',
    );
  }

  // Health Check
  async checkHealth(): Promise<Response<{ status: string }>> {
    return this.get<{ status: string }>('/auth/healthz');
  }

  // Registration Endpoints
  async emailVerificationRegister(
    data: RegisterInfoRequest,
  ): Promise<Response> {
    return this.post('/auth/register/email-verification', data);
  }

  async verifyEmailRegister(data: VerifyEmailRequest): Promise<Response> {
    return this.post('/auth/register/verify-email', data);
  }

  async sendEmailVerification(
    data: SendEmailVerificationRequest,
  ): Promise<Response> {
    return this.post('/auth/register/send-email-verification', data);
  }

  // Login Endpoints
  async login(data: LoginRequest): Promise<Response> {
    return this.post('/auth/login', data);
  }

  async fingerprintEmailVerification(
    data: FingerprintEmailVerificationRequest,
  ): Promise<Response> {
    return this.post('/auth/login/fingerprint/email-verification', data);
  }

  async resendDeviceFingerprintEmailVerification(
    data: ResendDeviceFingerprintEmailVerificationRequest,
  ): Promise<Response> {
    return this.post('/auth/login/fingerprint/resend-email-verification', data);
  }

  // Session Management Endpoints
  async refreshSession(data: RefreshSessionRequest): Promise<Response> {
    return this.post('/auth/session/refresh', data);
  }

  async getActiveSessions(data: GetActiveSessionsRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/session/active', data, config);
  }

  async logout(data: LogoutRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/session/logout', data, config);
  }

  async revokeAllSessions(data: RevokeAllSessionsRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/session/revoke-all', data, config);
  }

  async validateAccess(data: ValidateAccessRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/session/validate-access', data, config);
  }

  async createSsoToken(data: CreateSsoTokenRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/session/sso', data, config);
  }

  async validateSsoToken(data: ValidateSsoTokenRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/session/sso/validate', data, config);
  }

  // Password Management Endpoints
  async changePassword(data: ChangePasswordRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/password/change', data, config);
  }

  async emailVerificationChangePassword(
    data: EmailVerificationChangePasswordRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/password/forgot/email-verification', data, config);
  }

  async verifyEmailChangePassword(
    data: VerifyEmailChangePasswordRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/password/forgot/verify-email', data, config);
  }

  async changeForgotPassword(
    data: ChangeForgotPasswordRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/password/forgot/change', data, config);
  }

  // User Info Endpoints
  async infoByAccessToken(data: InfoByAccessTokenRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/info/by-access-token', data, config);
  }

  async infoByUserId(data: InfoByUserIdRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/info/by-user-id', data, config);
  }

  async infoByEmailOrUsername(
    data: InfoByEmailOrUsernameRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/info/by-email-or-username', data, config);
  }

  async existUserByEmailOrUsername(
    data: ExistUserByEmailOrUsernameRequest,
  ): Promise<Response> {
    return this.post('/auth/info/exist-by-email-or-username', data);
  }

  // Legacy method for backward compatibility
  async validateToken(
    accessToken: string,
    authorization: string,
  ): Promise<Response> {
    return this.infoByAccessToken({
      access_token: accessToken,
      authorization: authorization,
    });
  }

  // Generic HTTP methods for flexibility
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.post<T>(url, data, config);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<Response<T>> {
    return super.get<T>(url, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.put<T>(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.delete<T>(url, config);
  }
}
