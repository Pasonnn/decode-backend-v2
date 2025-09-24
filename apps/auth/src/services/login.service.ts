/**
 * @fileoverview User Login Service
 *
 * This service handles user authentication and login operations with comprehensive
 * security features including device fingerprinting, session management, and
 * multi-factor authentication through email verification.
 *
 * Login Flow:
 * 1. User submits credentials (email/username, password, device fingerprint)
 * 2. System validates credentials against stored user data
 * 3. Device fingerprint is checked for trust status
 * 4. If device is not trusted, email verification is required
 * 5. If device is trusted, session is created and tokens are generated
 * 6. User's last login time is updated
 *
 * Security Features:
 * - Bcrypt password verification
 * - Device fingerprinting for enhanced security
 * - Email verification for new devices
 * - Session management with JWT tokens
 * - Comprehensive logging for security monitoring
 *
 * Device Fingerprinting:
 * - Tracks and verifies user devices for security
 * - Requires email verification for new devices
 * - Maintains trust status for known devices
 * - Prevents unauthorized access from unknown devices
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for dependency injection and HTTP status codes
import { Injectable, Logger, HttpStatus } from '@nestjs/common';

// Interfaces Import
import { Response } from '../interfaces/response.interface';

// Infrastructure Import
import { UserServiceClient } from '../infrastructure/external-services/auth-service.client';

// Services Import
import { SessionService } from './session.service';
import { PasswordService } from './password.service';
import { DeviceFingerprintService } from './device-fingerprint.service';

// Constants Import
import { MESSAGES } from '../constants/error-messages.constants';
import { UserDoc } from '../interfaces/user-doc.interface';

/**
 * User Login Service
 *
 * This service manages user authentication with advanced security features including
 * device fingerprinting and multi-factor authentication. It implements a comprehensive
 * login flow that balances security with user experience.
 *
 * The service handles both trusted and untrusted device scenarios:
 * - Trusted devices: Direct login with session creation
 * - Untrusted devices: Email verification required before session creation
 *
 * Key responsibilities:
 * - Validate user credentials (email/username and password)
 * - Check device fingerprint trust status
 * - Create and manage user sessions
 * - Handle device fingerprint verification
 * - Update user login tracking
 *
 * @Injectable - Marks this class as a provider that can be injected into other classes
 */
@Injectable()
export class LoginService {
  private readonly logger: Logger;

  /**
   * Constructor for dependency injection
   *
   * @param sessionService - Session management and token operations
   * @param passwordService - Password validation and verification
   * @param deviceFingerprintService - Device tracking and verification
   */
  constructor(
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly userServiceClient: UserServiceClient,
  ) {
    this.logger = new Logger(LoginService.name);
  }

  // login/
  async login(input: {
    email_or_username: string;
    password: string;
    fingerprint_hashed: string;
    browser: string;
    device: string;
  }): Promise<Response> {
    const { email_or_username, password, fingerprint_hashed, browser, device } =
      input;
    try {
      this.logger.log(`Login request received for ${email_or_username}`);
      const getUserInfoResponse =
        await this.userServiceClient.getInfoWithPasswordByUserEmailOrUsername({
          email_or_username: email_or_username,
        });
      if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
        return getUserInfoResponse;
      }
      const user = getUserInfoResponse.data as UserDoc;
      const checkPasswordResponse = this.passwordService.checkPassword(
        password,
        user.password_hashed || '',
      );
      if (!checkPasswordResponse.success) {
        return checkPasswordResponse;
      }
      const checkDeviceFingerprintResponse =
        await this.deviceFingerprintService.checkDeviceFingerprint({
          user_id: user._id,
          fingerprint_hashed,
        });
      if (
        !checkDeviceFingerprintResponse.success ||
        !checkDeviceFingerprintResponse.data
      ) {
        // Device fingerprint not trusted
        this.logger.log(
          `Device fingerprint not trusted for ${email_or_username}`,
        );
        const createDeviceFingerprintResponse =
          await this.deviceFingerprintService.createDeviceFingerprint({
            user_id: user._id,
            fingerprint_hashed,
            browser,
            device,
          });
        if (!createDeviceFingerprintResponse.success) {
          this.logger.error(
            `Cannot create device fingerprint for ${email_or_username}`,
          );
          return createDeviceFingerprintResponse;
        }
        const sendDeviceFingerprintEmailVerificationResponse =
          await this.deviceFingerprintService.sendDeviceFingerprintEmailVerification(
            {
              user_id: user._id,
              fingerprint_hashed,
            },
          );
        if (!sendDeviceFingerprintEmailVerificationResponse.success) {
          this.logger.error(
            `Cannot send device fingerprint email verification for ${email_or_username}`,
          );
          return sendDeviceFingerprintEmailVerificationResponse;
        }
        this.logger.log(
          `Device fingerprint email verification sent for ${email_or_username}`,
        );
        return {
          success: true,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.AUTH.DEVICE_FINGERPRINT_NOT_TRUSTED,
        };
      } else {
        // Device fingerprint trusted
        this.logger.log(`Device fingerprint trusted for ${email_or_username}`);
        const createSessionResponse = await this.sessionService.createSession({
          user_id: user._id,
          device_fingerprint_id: checkDeviceFingerprintResponse.data._id,
          app: 'decode',
        });
        if (!createSessionResponse.success || !createSessionResponse.data) {
          this.logger.error(`Cannot create session for ${email_or_username}`);
          return createSessionResponse;
        }
        this.logger.log(`Session created for ${email_or_username}`);
        const updateUserLastLoginResponse = await this.updateUserLastLogin({
          user_id: user._id,
        });
        if (!updateUserLastLoginResponse.success) {
          this.logger.error(
            `Cannot update user last login for ${email_or_username}`,
          );
          return updateUserLastLoginResponse;
        }
        this.logger.log(`User last login updated for ${email_or_username}`);
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: MESSAGES.SUCCESS.LOGIN_SUCCESSFUL,
          data: createSessionResponse.data,
        };
      }
    } catch (error) {
      this.logger.error(`Error logging in for ${email_or_username}`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.AUTH.LOGIN_ERROR,
      };
    }
  }

  private async updateUserLastLogin(input: {
    user_id: string;
  }): Promise<Response> {
    const { user_id } = input;
    const user_last_login_response =
      await this.userServiceClient.updateUserLastLogin({
        user_id: user_id,
      });
    if (!user_last_login_response.success) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_UPDATED,
    };
  }
}
