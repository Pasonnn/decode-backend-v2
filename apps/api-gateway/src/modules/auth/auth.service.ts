import { Injectable, Logger } from '@nestjs/common';
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
   * Health check endpoint to verify service availability
   */
  async checkHealth(): Promise<Response> {
    try {
      this.logger.log('Checking auth service health');
      const response = await this.authServiceClient.checkHealth();
      this.logger.log('Auth service health check successful');
      return response;
    } catch (error) {
      this.logger.error(
        `Auth service health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Authenticate user with email/username and password
   */
  async login(loginDto: LoginDto): Promise<Response> {
    try {
      this.logger.log(`Login attempt for user: ${loginDto.email_or_username}`);

      const response = await this.authServiceClient.login(loginDto);

      if (response.success) {
        this.logger.log(
          `Login successful for user: ${loginDto.email_or_username}`,
        );
      } else {
        this.logger.error(
          `Login failed for user ${loginDto.email_or_username}: ${response.message}`,
        );
      }
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

      if (response.success) {
        this.logger.log('Device fingerprint verification successful');
      } else {
        this.logger.error(
          `Fingerprint verification failed: ${response.message}`,
        );
      }

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

      if (response.success) {
        this.logger.log(
          'Resend device fingerprint email verification successful',
        );
      } else {
        this.logger.error(
          `Resend device fingerprint email verification failed: ${response.message}`,
        );
      }

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

      if (response.success) {
        this.logger.log(
          `Registration successful for user: ${registerDto.username}`,
        );
      } else {
        this.logger.error(
          `Registration failed for user ${registerDto.username}: ${response.message}`,
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

      if (response.success) {
        this.logger.log('Email verification successful');
      } else {
        this.logger.error(`Email verification failed: ${response.message}`);
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

      if (response.success) {
        this.logger.log('Email verification sent');
      } else {
        this.logger.error(`Email verification failed: ${response.message}`);
      }

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
  async refreshSession(refreshTokenDto: RefreshTokenDto): Promise<Response> {
    try {
      this.logger.log('Token refresh attempt');

      const response =
        await this.authServiceClient.refreshSession(refreshTokenDto);

      if (response.success) {
        this.logger.log('Token refresh successful');
      } else {
        this.logger.error(`Token refresh failed: ${response.message}`);
      }

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
        this.logger.error(`Logout failed: ${response.message}`);
      } else {
        this.logger.log('Logout successful');
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
   * Revoke specific session
   */
  async revokeSession(
    sessionId: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Revoking session: ${sessionId}`);

      const config = {
        headers: {
          Authorization: authorization,
        },
      };
      const response = await this.authServiceClient.post(
        '/auth/session/revoke',
        { session_id: sessionId },
        config,
      );

      if (!response.success) {
        this.logger.error(`Session revocation failed: ${response.message}`);
      } else {
        this.logger.log(`Successfully revoked session: ${sessionId}`);
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to revoke session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
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

  /**
   * Check if user exists using email or username
   */
  async existUserByEmailOrUsername(emailOrUsername: string): Promise<Response> {
    const response = await this.authServiceClient.existUserByEmailOrUsername({
      email_or_username: emailOrUsername,
    });
    return response;
  }

  // Session Management Methods

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(
    userId: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Getting active sessions for user: ${userId}`);

      const response = await this.authServiceClient.getActiveSessions({
        user_id: userId,
        authorization: authorization,
      });

      if (!response.success) {
        this.logger.error(`Failed to get active sessions: ${response.message}`);
      } else {
        this.logger.log('Successfully retrieved active sessions');
      }

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
        this.logger.error(`Failed to revoke all sessions: ${response.message}`);
      } else {
        this.logger.log('Successfully revoked all sessions');
      }

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
        this.logger.error(
          `Failed to validate access token: ${response.message}`,
        );
      } else {
        this.logger.log('Access token validation successful');
      }

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
    app: string,
    fingerprintHashed: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log('Creating SSO token');

      const response = await this.authServiceClient.createSsoToken({
        app,
        fingerprint_hashed: fingerprintHashed,
        authorization,
      });

      if (!response.success) {
        this.logger.error(`Failed to create SSO token: ${response.message}`);
      } else {
        this.logger.log('Successfully created SSO token');
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create SSO token: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Validate SSO token
   */
  async validateSsoToken(ssoToken: string): Promise<Response> {
    try {
      this.logger.log('Validating SSO token');

      const response = await this.authServiceClient.validateSsoToken({
        sso_token: ssoToken,
      });

      if (!response.success) {
        this.logger.error(`Failed to validate SSO token: ${response.message}`);
      } else {
        this.logger.log('SSO token validation successful');
      }

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
        this.logger.error(`Failed to change password: ${response.message}`);
      } else {
        this.logger.log('Successfully changed password');
      }

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
  async initiateForgotPassword(email_or_username: string): Promise<Response> {
    try {
      this.logger.log('Initiating forgot password for current user');

      const response = await this.authServiceClient.post(
        '/auth/password/forgot/email-verification',
        { email_or_username },
      );

      if (!response.success) {
        this.logger.error(
          `Failed to initiate forgot password: ${response.message}`,
        );
      } else {
        this.logger.log('Successfully initiated forgot password');
      }

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
        this.logger.error(
          `Failed to verify email for forgot password: ${response.message}`,
        );
      } else {
        this.logger.log('Successfully verified email for forgot password');
      }

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

  // Device Fingerprint Management Methods

  /**
   * Get device fingerprints for current user
   */
  async getDeviceFingerprints(authorization: string): Promise<Response> {
    try {
      this.logger.log('Getting device fingerprints for current user');

      const response = await this.authServiceClient.getDeviceFingerprint({
        user_id: '', // Will be extracted from token in auth service
        authorization,
      });

      if (!response.success) {
        this.logger.error(
          `Failed to get device fingerprints: ${response.message}`,
        );
      } else {
        this.logger.log('Successfully retrieved device fingerprints');
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get device fingerprints: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Revoke device fingerprint
   */
  async revokeDeviceFingerprint(
    deviceFingerprintId: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Revoking device fingerprint: ${deviceFingerprintId}`);

      const response = await this.authServiceClient.revokeDeviceFingerprint({
        device_fingerprint_id: deviceFingerprintId,
        user_id: '', // Will be extracted from token in auth service
        authorization,
      });

      if (!response.success) {
        this.logger.error(
          `Failed to revoke device fingerprint: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully revoked device fingerprint: ${deviceFingerprintId}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to revoke device fingerprint: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // Additional Info Methods

  /**
   * Get user info by access token
   */
  async getUserInfoByAccessToken(
    accessToken: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log('Getting user info by access token');

      const response = await this.authServiceClient.infoByAccessToken({
        access_token: accessToken,
        authorization,
      });

      if (!response.success) {
        this.logger.error(
          `Failed to get user info by access token: ${response.message}`,
        );
      } else {
        this.logger.log(`Successfully retrieved user info by access token}`);
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get user info by access token: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get user info by user ID
   */
  async getUserInfoByUserId(
    userId: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Getting user info by user ID: ${userId}`);

      const response = await this.authServiceClient.infoByUserId({
        user_id: userId,
        authorization,
      });

      if (!response.success) {
        this.logger.error(
          `Failed to get user info by user ID: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully retrieved user info by user ID: ${userId}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get user info by user ID: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get user info by email or username
   */
  async getUserInfoByEmailOrUsername(
    emailOrUsername: string,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(
        `Getting user info by email or username: ${emailOrUsername}`,
      );

      const response = await this.authServiceClient.infoByEmailOrUsername({
        email_or_username: emailOrUsername,
        authorization,
      });

      if (!response.success) {
        this.logger.error(
          `Failed to get user info by email or username: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully retrieved user info by email or username: ${emailOrUsername}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get user info by email or username: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
