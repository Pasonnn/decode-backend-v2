import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { Response } from '../../interfaces/response.interface';
import {
  LoginDto,
  FingerprintEmailVerificationDto,
  ResendDeviceFingerprintEmailVerificationDto,
} from './dto/login.dto';
import { RegisterInfoDto, VerifyEmailDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly authServiceClient: AuthServiceClient) {}

  /**
   * Authenticate user with email/username and password
   */
  async login(loginDto: LoginDto): Promise<Response> {
    try {
      this.logger.log(`Login attempt for user: ${loginDto.email_or_username}`);

      const response = await this.authServiceClient.login(loginDto);

      if (!response.success) {
        throw new UnauthorizedException(response.message || 'Login failed');
      }

      this.logger.log(
        `Login successful for user: ${loginDto.email_or_username}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Login failed for user ${loginDto.email_or_username}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Verify device fingerprint through email verification
   */
  async verifyFingerprint(
    verificationDto: FingerprintEmailVerificationDto,
  ): Promise<Response> {
    try {
      this.logger.log('Device fingerprint verification attempt');

      const response =
        await this.authServiceClient.fingerprintEmailVerification(
          verificationDto,
        );

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Fingerprint verification failed',
        );
      }

      this.logger.log('Device fingerprint verification successful');
      return response;
    } catch (error) {
      this.logger.error(
        `Fingerprint verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Resend device fingerprint email verification
   */
  async resendDeviceFingerprintEmailVerification(
    dto: ResendDeviceFingerprintEmailVerificationDto,
  ): Promise<Response> {
    try {
      this.logger.log('Resend device fingerprint email verification attempt');

      const response =
        await this.authServiceClient.resendDeviceFingerprintEmailVerification(
          dto,
        );

      if (!response.success) {
        throw new BadRequestException(
          response.message ||
            'Resend device fingerprint email verification failed',
        );
      }

      this.logger.log(
        'Resend device fingerprint email verification successful',
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Resend device fingerprint email verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Register new user with email verification
   */
  async register(registerDto: RegisterInfoDto): Promise<Response> {
    try {
      this.logger.log(
        `Registration attempt for user: ${registerDto.username} (${registerDto.email})`,
      );

      const response =
        await this.authServiceClient.emailVerificationRegister(registerDto);

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Registration failed',
        );
      }

      this.logger.log(
        `Registration successful for user: ${registerDto.username}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Registration failed for user ${registerDto.username}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Verify email for registration
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<Response> {
    try {
      this.logger.log('Email verification attempt');
      const response =
        await this.authServiceClient.verifyEmailRegister(verifyEmailDto);

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Email verification failed',
        );
      }

      this.logger.log('Email verification successful');
      return response;
    } catch (error) {
      this.logger.error(
        `Email verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string): Promise<Response> {
    try {
      this.logger.log('Sending email verification');
      const response = await this.authServiceClient.sendEmailVerification({
        email,
      });
      return response;
    } catch (error) {
      this.logger.error(
        `Sending email verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Refresh session token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<Response> {
    try {
      this.logger.log('Token refresh attempt');

      const response =
        await this.authServiceClient.refreshSession(refreshTokenDto);

      if (!response.success) {
        throw new UnauthorizedException(
          response.message || 'Token refresh failed',
        );
      }

      this.logger.log('Token refresh successful');
      return response;
    } catch (error) {
      this.logger.error(
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Logout user by invalidating session
   */
  async logout(sessionToken: string, authorization: string): Promise<Response> {
    try {
      this.logger.log('Logout attempt');

      const config = {
        headers: {
          Authorization: authorization,
        },
      };
      const response = await this.authServiceClient.post(
        '/auth/session/logout',
        { session_token: sessionToken },
        config,
      );

      if (!response.success) {
        throw new BadRequestException(response.message || 'Logout failed');
      }

      this.logger.log('Logout successful');
      return response;
    } catch (error) {
      this.logger.error(
        `Logout failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(
    accessToken: string,
    authorization: string,
  ): Promise<Response> {
    try {
      const response = await this.authServiceClient.validateToken(
        accessToken,
        authorization,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Token validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get user info by access token
   */
  async getUserInfo(
    accessToken: string,
    authorization: string,
  ): Promise<Response> {
    try {
      const response = await this.authServiceClient.infoByAccessToken({
        access_token: accessToken,
        authorization,
      });
      return response;
    } catch (error) {
      this.logger.error(
        `Get user info failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // Session Management Methods

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(authorization: string): Promise<Response> {
    try {
      this.logger.log('Getting active sessions for current user');

      const config = {
        headers: {
          Authorization: authorization,
        },
      };
      const response = await this.authServiceClient.post(
        '/auth/session/active',
        {},
        config,
      );

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Failed to get active sessions',
        );
      }

      this.logger.log('Successfully retrieved active sessions');
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get active sessions: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(authorization: string): Promise<Response> {
    try {
      this.logger.log('Revoking all sessions for current user');

      const config = {
        headers: {
          Authorization: authorization,
        },
      };
      const response = await this.authServiceClient.post(
        '/auth/session/revoke-all',
        {},
        config,
      );

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Failed to revoke all sessions',
        );
      }

      this.logger.log('Successfully revoked all sessions');
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to revoke all sessions: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateAccess(
    accessToken: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log('Validating access token');

      const response = await this.authServiceClient.validateAccess({
        access_token: accessToken,
        authorization,
      });

      if (!response.success) {
        throw new UnauthorizedException(
          response.message || 'Access token validation failed',
        );
      }

      this.logger.log('Access token validation successful');
      return response;
    } catch (error) {
      this.logger.error(
        `Access token validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Create SSO token
   */
  async createSsoToken(
    userId: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Creating SSO token for user: ${userId}`);

      const response = await this.authServiceClient.createSsoToken({
        user_id: userId,
        authorization,
      });

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Failed to create SSO token',
        );
      }

      this.logger.log(`Successfully created SSO token for user: ${userId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create SSO token for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Validate SSO token
   */
  async validateSsoToken(
    ssoToken: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log('Validating SSO token');

      const response = await this.authServiceClient.validateSsoToken({
        sso_token: ssoToken,
        authorization,
      });

      if (!response.success) {
        throw new UnauthorizedException(
          response.message || 'SSO token validation failed',
        );
      }

      this.logger.log('SSO token validation successful');
      return response;
    } catch (error) {
      this.logger.error(
        `SSO token validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // Password Management Methods

  /**
   * Change user password
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log('Changing password for current user');

      const config = {
        headers: {
          Authorization: authorization,
        },
      };
      const response = await this.authServiceClient.post(
        '/auth/password/change',
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
        config,
      );

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Password change failed',
        );
      }

      this.logger.log('Successfully changed password');
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Initiate forgot password process
   */
  async initiateForgotPassword(username_or_email: string): Promise<Response> {
    try {
      this.logger.log('Initiating forgot password for current user');

      const response = await this.authServiceClient.post(
        '/auth/password/forgot/email-verification',
        { username_or_email },
      );

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Failed to initiate forgot password',
        );
      }

      this.logger.log('Successfully initiated forgot password');
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to initiate forgot password: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Verify email for forgot password
   */
  async verifyEmailForgotPassword(code: string): Promise<Response> {
    try {
      this.logger.log('Verifying email for forgot password');

      const response = await this.authServiceClient.post(
        '/auth/password/forgot/verify-email',
        { code },
        {},
      );

      if (!response.success) {
        throw new BadRequestException(
          response.message || 'Email verification failed',
        );
      }

      this.logger.log('Successfully verified email for forgot password');
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to verify email for forgot password: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Change password for forgot password
   */
  async changeForgotPassword(
    code: string,
    new_password: string,
  ): Promise<Response> {
    try {
      this.logger.log('Changing password for forgot password');

      const response = await this.authServiceClient.post(
        '/auth/password/forgot/change',
        { code, new_password },
      );
      this.logger.log('Successfully changed password for forgot password');
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to change password for forgot password: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
