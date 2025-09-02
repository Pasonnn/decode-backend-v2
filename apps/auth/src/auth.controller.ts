// Import the necessary modules
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
} from './dto/info.dto';

// Interfaces Import
import { Response } from './interfaces/response.interface';

// Import the Services
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { InfoService } from './services/info.service';

// Guards Import
import { AuthGuard, Public } from './common/guards/auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './common/guards/auth.guard';
import { InitiateForgotPasswordDto } from 'apps/api-gateway/src/modules/auth/dto/password.dto';

// Auth Controller Class
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly infoService: InfoService,
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
    const login_response = await this.loginService.login(
      dto.email_or_username,
      dto.password,
      dto.fingerprint_hashed,
    );
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
      await this.loginService.verifyDeviceFingerprintEmailVerification(
        dto.code,
      );
    return verify_device_fingerprint_email_verification_response;
  }

  @Post('login/fingerprint/resend-email-verification')
  @Public()
  async resendDeviceFingerprintEmailVerification(
    @Body() dto: ResendDeviceFingerprintEmailVerificationDto,
  ): Promise<Response> {
    const resend_device_fingerprint_email_verification_response =
      await this.loginService.resendDeviceFingerprintEmailVerification(
        dto.email_or_username,
        dto.fingerprint_hashed,
      );
    return resend_device_fingerprint_email_verification_response;
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

  /**
   * Revokes all active sessions for a user across all devices
   * @param dto - User ID whose sessions should be revoked {user_id: string}
   * @returns Response confirming all sessions have been terminated
   */
  @Post('session/revoke-all')
  @UseGuards(AuthGuard)
  async revokeAllSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    const revoke_all_sessions_response =
      await this.sessionService.revokeAllSessions(user.userId);
    return revoke_all_sessions_response;
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

  /**
   * Creates Single Sign-On (SSO) token for cross-service authentication
   * @param dto - User ID for SSO token generation {user_id: string}
   * @returns Response containing SSO token for service integration
   */
  @Post('session/sso')
  @UseGuards(AuthGuard)
  async createSsoToken(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    const create_sso_token_response = await this.sessionService.createSsoToken(
      user.userId,
    );
    return create_sso_token_response;
  }

  /**
   * Validates SSO token for cross-service authentication
   * @param dto - SSO token to be validated {sso_token: string}
   * @returns Response containing SSO token validity and user context
   */
  @Post('session/sso/validate')
  @Public()
  async validateSsoToken(@Body() dto: ValidateSsoTokenDto): Promise<Response> {
    const validate_sso_token_response =
      await this.sessionService.validateSsoToken(dto.sso_token);
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
      await this.infoService.existUserByEmailOrUsername(dto.email_or_username);
    return exist_user_by_email_or_username_response;
  }
}
