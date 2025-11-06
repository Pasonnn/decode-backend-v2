import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';
import { AxiosRequestConfig } from 'axios';
import { MetricsService } from '../../common/datadog/metrics.service';

// Auth Service Interfaces
import {
  RegisterInfoRequest,
  VerifyEmailRequest,
  SendEmailVerificationRequest,
  LoginRequest,
  FingerprintEmailVerificationRequest,
  ResendDeviceFingerprintEmailVerificationRequest,
  RefreshSessionRequest,
  GetActiveSessionsRequest,
  LogoutRequest,
  RevokeAllSessionsRequest,
  ValidateAccessRequest,
  CreateSsoTokenRequest,
  ValidateSsoTokenRequest,
  ChangePasswordRequest,
  EmailVerificationChangePasswordRequest,
  VerifyEmailChangePasswordRequest,
  ChangeForgotPasswordRequest,
  InfoByAccessTokenRequest,
  InfoByUserIdRequest,
  InfoByEmailOrUsernameRequest,
  ExistUserByEmailOrUsernameRequest,
  GetDeviceFingerprintRequest,
  RevokeDeviceFingerprintRequest,
  SetupOtpRequest,
  EnableOtpRequest,
  DisableOtpRequest,
  LoginVerifyOtpRequest,
  FingerprintTrustVerifyOtpRequest,
  StatusOtpRequest,
} from '../../interfaces/auth-service.interface';

@Injectable()
export class AuthServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
    metricsService: MetricsService,
  ) {
    super(
      httpService,
      configService.get<string>('services.auth.url') || 'http://localhost:4001',
      metricsService,
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
    return this.post(
      '/auth/sso/create',
      {
        app: data.app,
        fingerprint_hashed: data.fingerprint_hashed,
      },
      config,
    );
  }

  async validateSsoToken(data: ValidateSsoTokenRequest): Promise<Response> {
    return this.post('/auth/sso/validate', data);
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

  // Forgot Password Endpoints
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

  // Device Fingerprint Endpoints
  async getDeviceFingerprint(
    data: GetDeviceFingerprintRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.get('/auth/fingerprints', config);
  }

  async revokeDeviceFingerprint(
    data: RevokeDeviceFingerprintRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post(
      '/auth/fingerprints/revoke',
      {
        device_fingerprint_id: data.device_fingerprint_id,
      },
      config,
    );
  }

  // Two-Factor Authentication (2FA) Endpoints

  async statusOtp(data: StatusOtpRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.get('/auth/2fa/status', config);
  }

  async setupOtp(data: SetupOtpRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/2fa/setup', {}, config);
  }

  async enableOtp(data: EnableOtpRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/2fa/enable', { otp: data.otp }, config);
  }

  async disableOtp(data: DisableOtpRequest): Promise<Response> {
    const config = {
      headers: {
        Authorization: data.authorization,
      },
    };
    return this.post('/auth/2fa/disable', {}, config);
  }

  async loginVerifyOtp(data: LoginVerifyOtpRequest): Promise<Response> {
    return this.post('/auth/2fa/login', data);
  }

  async fingerprintTrustVerifyOtp(
    data: FingerprintTrustVerifyOtpRequest,
  ): Promise<Response> {
    return this.post('/auth/2fa/fingerprint-trust', data);
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
