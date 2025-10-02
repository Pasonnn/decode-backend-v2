/**
 * @fileoverview Authentication Controller
 *
 * This controller serves as the main HTTP API gateway for the Decode Authentication Service.
 * It handles all authentication-related HTTP requests and routes them to appropriate
 * business logic services.
 *
 * The controller provides comprehensive authentication endpoints including:
 * - User registration with email verification
 * - Secure login with device fingerprinting
 * - Session management (refresh, logout, validation)
 * - Password management (change, reset, forgot password)
 * - User information retrieval
 * - Device fingerprint management
 * - Single Sign-On (SSO) operations
 *
 * Security Features:
 * - JWT-based authentication with access and session tokens
 * - Device fingerprinting for enhanced security
 * - Email verification for account creation and device trust
 * - Role-based access control with guards
 * - Comprehensive input validation using DTOs
 * - Rate limiting and brute force protection
 *
 * API Design Principles:
 * - RESTful endpoint design
 * - Consistent response format
 * - Comprehensive error handling
 * - Input validation and sanitization
 * - Security-first approach
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for HTTP request handling and security
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';

// DTOs Import
import {
  RegisterInfoDto,
  VerifyEmailDto,
  SendEmailVerificationDto,
} from './dto/register.dto';
import {
  LoginDto,
  FingerprintEmailVerificationDto,
  ResendDeviceFingerprintEmailVerificationDto,
} from './dto/login.dto';
import {
  RefreshSessionDto,
  LogoutDto,
  ValidateAccessDto,
  ValidateSsoTokenDto,
  CreateSsoTokenDto,
  RevokeSessionDto,
  CreateWalletSessionDto,
} from './dto/session.dto';
import {
  ChangePasswordDto,
  VerifyEmailChangePasswordDto,
  ChangeForgotPasswordDto,
} from './dto/password.dto';
import {
  InfoByAccessTokenDto,
  InfoByUserIdDto,
  InfoByEmailOrUsernameDto,
  ExistUserByEmailOrUsernameDto,
  InfoByFingerprintHashDto,
} from './dto/info.dto';
import type { RevokeDeviceFingerprintDto } from './interfaces/device-fingerprint.interface';

// Interfaces Import
import { Response } from './interfaces/response.interface';

// Import the Services
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { InfoService } from './services/info.service';
import { DeviceFingerprintService } from './services/device-fingerprint.service';
import { SsoService } from './services/sso.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';

// Guards Import
import { AuthGuard, Public } from './common/guards/auth.guard';
import { WalletServiceGuard } from './common/guards/service.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './common/guards/auth.guard';
import { InitiateForgotPasswordDto } from 'apps/api-gateway/src/modules/auth/dto/password.dto';
import {
  VerifyOtpDto,
  LoginVerifyOtpDto,
  FingerprintTrustVerifyOtpDto,
} from './dto/otp.dto';

/**
 * Authentication Controller
 *
 * This controller handles all HTTP requests related to user authentication and authorization.
 * It serves as the main API gateway for the authentication service, providing endpoints
 * for user registration, login, session management, password operations, and more.
 *
 * The controller follows RESTful design principles and implements comprehensive security
 * measures including JWT authentication, device fingerprinting, and role-based access control.
 *
 * All endpoints return consistent response formats and include proper error handling
 * and validation. Sensitive operations require authentication and appropriate permissions.
 *
 * @Controller('auth') - Base route prefix for all authentication endpoints
 */
@Controller('auth')
export class AuthController {
  /**
   * Constructor for dependency injection of all required services
   *
   * @param registerService - Handles user registration and email verification
   * @param loginService - Manages user authentication and login flow
   * @param sessionService - Handles session management and token operations
   * @param passwordService - Manages password operations and reset functionality
   * @param infoService - Provides user information retrieval services
   * @param deviceFingerprintService - Handles device tracking and verification
   * @param ssoService - Manages Single Sign-On token operations
   */
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly infoService: InfoService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly ssoService: SsoService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) {}

  /**
   * Health check endpoint to verify service availability
   * @returns Service status object
   */
  @Get('healthz')
  @Public()
  checkHealth(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Health check endpoint for Docker health checks
   * @returns Service status object
   */
  @Get('health')
  @Public()
  checkHealthDocker(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Initiates user registration process by sending email verification
   * @param dto - Registration information including username, email, and password
   * @returns Response containing verification status and user details
   */
  @Post('register/email-verification')
  @Public()
  async emailVerificationRegister(
    @Body() dto: RegisterInfoDto,
  ): Promise<Response> {
    const email_verification_register_response =
      await this.registerService.emailVerificationRegister(dto);
    return email_verification_register_response;
  }

  /**
   * Completes user registration by verifying email with provided code
   * @param dto - Email verification code {code: string}
   * @returns Response confirming successful registration
   */
  @Post('register/verify-email')
  @Public()
  async verifyEmailRegister(@Body() dto: VerifyEmailDto): Promise<Response> {
    const verify_email_register_response =
      await this.registerService.verifyEmailRegister(dto.code);
    return verify_email_register_response;
  }

  @Post('register/send-email-verification')
  @Public()
  async sendEmailVerification(
    @Body() dto: SendEmailVerificationDto,
  ): Promise<Response> {
    const send_email_verification_response =
      await this.registerService.sendEmailVerification(dto.email);
    return send_email_verification_response;
  }

  /**
   * Authenticates user with email/username and password
   * @param dto - Login credentials including email/username, password, and device fingerprint {email_or_username: string, password: string, fingerprint_hashed: string}
   * @returns Response containing authentication tokens and user session data
   */
  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto): Promise<Response> {
    const login_response = await this.loginService.login({
      email_or_username: dto.email_or_username,
      password: dto.password,
      fingerprint_hashed: dto.fingerprint_hashed,
      browser: dto.browser,
      device: dto.device,
    });
    return login_response;
  }

  /**
   * Verifies device fingerprint through email verification for enhanced security
   * @param dto - Email verification code for device fingerprint validation {code: string}
   * @returns Response confirming device verification status
   */
  @Post('login/fingerprint/email-verification')
  @Public()
  async fingerprintEmailVerification(
    @Body() dto: FingerprintEmailVerificationDto,
  ): Promise<Response> {
    const verify_device_fingerprint_email_verification_response =
      await this.deviceFingerprintService.verifyDeviceFingerprintEmailVerification(
        {
          email_verification_code: dto.code,
          app: dto.app || 'decode',
        },
      );
    return verify_device_fingerprint_email_verification_response;
  }

  @Post('login/fingerprint/resend-email-verification')
  @Public()
  async resendDeviceFingerprintEmailVerification(
    @Body() dto: ResendDeviceFingerprintEmailVerificationDto,
  ): Promise<Response> {
    const resend_device_fingerprint_email_verification_response =
      await this.deviceFingerprintService.resendDeviceFingerprintEmailVerification(
        {
          email_or_username: dto.email_or_username,
          fingerprint_hashed: dto.fingerprint_hashed,
        },
      );
    return resend_device_fingerprint_email_verification_response;
  }

  @Get('fingerprints')
  @UseGuards(AuthGuard)
  async getDeviceFingerprint(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    const get_device_fingerprint_response =
      await this.deviceFingerprintService.getDeviceFingerprints({
        user_id: user.userId,
      });
    return get_device_fingerprint_response;
  }

  @Post('fingerprints/revoke')
  @UseGuards(AuthGuard)
  async revokeDeviceFingerprint(
    @Body() dto: RevokeDeviceFingerprintDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    const revoke_device_fingerprint_response =
      await this.deviceFingerprintService.revokeDeviceFingerprint({
        device_fingerprint_id: dto.device_fingerprint_id,
        user_id: user.userId,
      });
    return revoke_device_fingerprint_response;
  }

  /**
   * Refreshes user session using existing session token
   * @param dto - Current session token for renewal {session_token: string}
   * @returns Response containing new access token and updated session information
   */
  @Post('session/refresh')
  @Public()
  async refreshSession(@Body() dto: RefreshSessionDto): Promise<Response> {
    const refresh_session_response = await this.sessionService.refreshSession(
      dto.session_token,
    );
    return refresh_session_response;
  }

  /**
   * Retrieves all active sessions for a specific user
   * @param dto - User ID to fetch active sessions for {user_id: string}
   * @returns Response containing list of active user sessions
   */
  @Post('session/active')
  @UseGuards(AuthGuard)
  async getActiveSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    const get_active_sessions_response =
      await this.sessionService.getUserActiveSessions(user.userId);
    return get_active_sessions_response;
  }

  /**
   * Logs out user by invalidating specific session
   * @param dto - Session token to be invalidated {session_token: string}
   * @returns Response confirming successful logout
   */
  @Post('session/logout')
  @Public()
  async logout(@Body() dto: LogoutDto): Promise<Response> {
    const logout_response = await this.sessionService.logout(dto.session_token);
    return logout_response;
  }

  @Post('session/revoke')
  @UseGuards(AuthGuard)
  async revokeSession(@Body() dto: RevokeSessionDto): Promise<Response> {
    const revoke_session_response =
      await this.sessionService.revokeSessionBySessionId(dto.session_id);
    return revoke_session_response;
  }

  /**
   * Validates access token and returns authentication status
   * @param dto - Access token to be validated {access_token: string}
   * @returns Response containing token validity and associated user information
   */
  @Post('session/validate-access')
  @Public()
  async validateAccess(@Body() dto: ValidateAccessDto): Promise<Response> {
    const validate_access_response = await this.sessionService.validateAccess(
      dto.access_token,
    );
    return validate_access_response;
  }

  @Post('services/session/create-wallet-session')
  @UseGuards(WalletServiceGuard)
  async createWalletSession(
    @Body() dto: CreateWalletSessionDto,
  ): Promise<Response> {
    const create_wallet_session_response =
      await this.sessionService.createWalletSession({
        user_id: dto.user_id,
        device_fingerprint_hashed: dto.device_fingerprint_hashed,
        browser: dto.browser,
        device: dto.device,
      });
    return create_wallet_session_response;
  }

  /**
   * Creates Single Sign-On (SSO) token for cross-service authentication
   * @param dto - User ID for SSO token generation {user_id: string}
   * @returns Response containing SSO token for service integration
   */
  @Post('sso/create')
  @UseGuards(AuthGuard)
  async createSsoToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSsoTokenDto,
  ): Promise<Response> {
    const create_sso_token_response = await this.ssoService.createSsoToken({
      user_id: user.userId,
      app: dto.app,
      fingerprint_hashed: dto.fingerprint_hashed,
    });
    return create_sso_token_response;
  }

  /**
   * Validates SSO token for cross-service authentication
   * @param dto - SSO token to be validated {sso_token: string}
   * @returns Response containing SSO token validity and user context
   */
  @Post('sso/validate')
  @Public()
  async validateSsoToken(@Body() dto: ValidateSsoTokenDto): Promise<Response> {
    const validate_sso_token_response = await this.ssoService.validateSsoToken({
      sso_token: dto.sso_token,
    });
    return validate_sso_token_response;
  }

  /**
   * Changes user password with current password verification
   * @param dto - User ID, current password, and new password {user_id: string, old_password: string, new_password: string}
   * @returns Response confirming successful password change
   */
  @Post('password/change')
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<Response> {
    const change_password_response = await this.passwordService.changePassword(
      user.userId,
      dto.old_password,
      dto.new_password,
    );
    return change_password_response;
  }

  /**
   * Initiates forgot password process by sending email verification
   * @param dto - User ID for password reset request {user_id: string}
   * @returns Response confirming email verification sent for password reset
   */
  @Post('password/forgot/email-verification')
  @Public()
  async emailVerificationChangePassword(
    @Body() dto: InitiateForgotPasswordDto,
  ): Promise<Response> {
    const email_verification_change_password_response =
      await this.passwordService.emailVerificationChangePassword(
        dto.email_or_username,
      );
    return email_verification_change_password_response;
  }

  /**
   * Verifies email code for forgot password process
   * @param dto - Email verification code for password reset {code: string}
   * @returns Response confirming email verification for password reset
   */
  @Post('password/forgot/verify-email')
  @Public()
  async verifyEmailChangePassword(
    @Body() dto: VerifyEmailChangePasswordDto,
  ): Promise<Response> {
    const verify_email_change_password_response =
      await this.passwordService.verifyEmailChangePassword(dto.code);
    return verify_email_change_password_response;
  }

  /**
   * Completes forgot password process by setting new password
   * @param dto - Email verification code, and new password {code: string, new_password: string}
   * @returns Response confirming successful password reset
   */
  @Post('password/forgot/change')
  @Public()
  async changeForgotPassword(
    @Body() dto: ChangeForgotPasswordDto,
  ): Promise<Response> {
    const change_forgot_password_response =
      await this.passwordService.changeForgotPassword(
        dto.code,
        dto.new_password,
      );
    return change_forgot_password_response;
  }

  /**
   * Retrieves user information using access token
   * @param dto - Access token for user identification {access_token: string}
   * @returns Response containing user profile information
   */
  @Post('info/by-access-token')
  @Public()
  async infoByAccessToken(
    @Body() dto: InfoByAccessTokenDto,
  ): Promise<Response> {
    const info_by_access_token_response =
      await this.infoService.getUserInfoByAccessToken(dto.access_token);
    return info_by_access_token_response;
  }

  /**
   * Retrieves user information using user ID
   * @param dto - User ID for profile lookup {user_id: string}
   * @returns Response containing user profile information
   */
  @Post('info/by-user-id')
  @UseGuards(AuthGuard)
  async infoByUserId(@Body() dto: InfoByUserIdDto): Promise<Response> {
    const info_by_user_id_response = await this.infoService.getUserInfoByUserId(
      dto.user_id,
    );
    return info_by_user_id_response;
  }

  /**
   * Retrieves user information using email or username
   * @param dto - Email or username for user lookup {email_or_username: string}
   * @returns Response containing user profile information
   */
  @Post('info/by-email-or-username')
  @UseGuards(AuthGuard)
  async infoByEmailOrUsername(
    @Body() dto: InfoByEmailOrUsernameDto,
  ): Promise<Response> {
    const info_by_email_or_username_response =
      await this.infoService.getUserInfoByEmailOrUsername(
        dto.email_or_username,
      );
    return info_by_email_or_username_response;
  }

  @Post('info/by-fingerprint-hashed')
  @Public()
  async infoByFingerprintHashed(
    @Body() dto: InfoByFingerprintHashDto,
  ): Promise<Response> {
    const info_by_fingerprint_hashed_response =
      await this.infoService.getUserInfoByFingerprintHashed(
        dto.fingerprint_hashed,
      );
    return info_by_fingerprint_hashed_response;
  }

  /**
   * Checks if user exists using email or username
   * @param dto - Email or username for user lookup {email_or_username: string}
   * @returns Response containing user existence status
   */
  @Post('info/exist-by-email-or-username')
  @Public()
  async existUserByEmailOrUsername(
    @Body() dto: ExistUserByEmailOrUsernameDto,
  ): Promise<Response> {
    const exist_user_by_email_or_username_response =
      await this.infoService.existUserByEmailOrUsername(dto);
    return exist_user_by_email_or_username_response;
  }

  // ==================== Two-Factor Authentication (2FA) Endpoints ====================

  @Get('2fa/status')
  @UseGuards(AuthGuard)
  async statusOtp(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    const status_otp_response = await this.twoFactorAuthService.statusOtp({
      user_id: user.userId,
    });
    return status_otp_response;
  }

  /**
   * Sets up Two-Factor Authentication (2FA) for a user
   * Generates OTP secret and QR code for authenticator app setup
   * @param dto - User ID for OTP setup {user_id: string}
   * @returns Response containing OTP secret and QR code URL
   */
  @Post('2fa/setup')
  @UseGuards(AuthGuard)
  async setupOtp(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    const setup_otp_response = await this.twoFactorAuthService.setUpOtp({
      user_id: user.userId,
    });
    return setup_otp_response;
  }

  /**
   * Enables Two-Factor Authentication for a user
   * Activates previously setup OTP after successful verification
   * @param dto - User ID for OTP enablement {user_id: string}
   * @returns Response confirming OTP enablement
   */
  @Post('2fa/enable')
  @UseGuards(AuthGuard)
  async enableOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyOtpDto,
  ): Promise<Response> {
    const enable_otp_response = await this.twoFactorAuthService.enableOtp({
      user_id: user.userId,
      otp: dto.otp,
    });
    return enable_otp_response;
  }

  /**
   * Disables Two-Factor Authentication for a user
   * Deactivates OTP for the specified user
   * @param dto - User ID for OTP disablement {user_id: string}
   * @returns Response confirming OTP disablement
   */
  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  async disableOtp(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    const disable_otp_response = await this.twoFactorAuthService.disableOtp({
      user_id: user.userId,
    });
    return disable_otp_response;
  }

  @Post('2fa/login')
  @Public()
  async loginVerifyOtp(@Body() dto: LoginVerifyOtpDto): Promise<Response> {
    const login_verify_otp_response =
      await this.twoFactorAuthService.loginVerifyOtp({
        login_session_token: dto.login_session_token,
        otp: dto.otp,
      });
    return login_verify_otp_response;
  }

  @Post('2fa/fingerprint-trust')
  @Public()
  async fingerprintTrustVerifyOtp(
    @Body() dto: FingerprintTrustVerifyOtpDto,
  ): Promise<Response> {
    const fingerprint_trust_verify_otp_response =
      await this.twoFactorAuthService.fingerprintTrustVerifyOtp({
        verify_device_fingerprint_session_token:
          dto.verify_device_fingerprint_session_token,
        otp: dto.otp,
      });
    return fingerprint_trust_verify_otp_response;
  }
}
