/**
 * Authentication Controller
 * 
 * This controller handles all authentication related requests.
 * It receives messages from the API gateway and delegate to the services,
 * 
 * Message Pattern:
 * - auth/healthz: Health check endpoint
 * - auth/register/info: User registration info (username, email, password)
 * - auth/register/send-email-verification: Send email verification code to email
 * - auth/register/verify-email: Verify email by code
 * - auth/register/create-user: Create user in database
 * - auth/login/info: User login info (username_or_email, password)
 * - auth/login/fingerprint-check: Fingerprint check (if not valid, create untrusted fingerprint
 * in Redis with key: `fingerprint:${user_id}:${fingerprint_hashed}`)
 * - auth/login/fingerprint-send-email-verify: Send email verification code to email (email)
 * - auth/login/fingerprint-email-code-verify: Verify email by code (email, code)
 * - auth/login/fingerprint-create: Create trusted fingerprint (user_id, fingerprint_hashed)
 * - auth/session/create: Create session (user_id, fingerprint_id)
 * - auth/session/refresh: Refresh session (session id)
 * - auth/session/by-sso: Get session token by sso code (sso code)
 * - auth/session/logout: Logout session (session id)
 * - auth/password/change/info: Change password info (user_id, old_password, new_password)
 * - auth/password/change/change-password: Change password (user_id, new_password)
 * - auth/password/forgot/info: Forgot password info (username_or_email)
 * - auth/password/forgot/send-email-verify: Send email verification code to email (email)
 * - auth/password/forgot/email-code-verify: Verify email by code (email, code)
 * - auth/password/forgot/change-password: Change password (user_id, new_password)
 * - auth/info/by-access-token: Get user info by access token (access_token)
*/

// Import the necessary modules
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RegisterInfoDto, VerifyEmailDto } from './dto/register.dto';
import { LoginDto, FingerprintEmailVerificationDto } from './dto/login.dto';
import { LoginResponse, Response } from './interfaces/response.interface';

// Import the Services
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
// import { PasswordService } from '../services/password.service';
// import { InfoService } from '../services/info.service';

// Auth Controller Class
@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerService: RegisterService,
        private readonly loginService: LoginService,
        private readonly sessionService: SessionService,
    ) {}

    // Health Check Endpoint
    @Get('healthz')
    checkHealth(): {status: string} {
        return {status: 'ok'};
    }

    // Register Controller
    @Post('register/email-verification')
    async emailVerificationRegister(@Body() dto: RegisterInfoDto): Promise<Response> {
        const email_verification_register_response = await this.registerService.emailVerificationRegister(dto);
        return email_verification_register_response;
    }

    @Post('register/verify-email')
    async verifyEmailRegister(@Body() dto: VerifyEmailDto): Promise<Response> {
        const verify_email_register_response = await this.registerService.verifyEmail(dto.code);
        return verify_email_register_response;
    }

    // Login Controller
    @Post('login')
    async login(@Body() dto: LoginDto): Promise<LoginResponse> {
        const login_response = await this.loginService.login(dto.email_or_username, dto.password, dto.fingerprint_hashed);
        return login_response;
    }

    @Post('login/fingerprint/email-verification')
    async fingerprintEmailVerification(@Body() dto: FingerprintEmailVerificationDto): Promise<Response> {
        const verify_device_fingerprint_email_verification_response = await this.loginService.verifyDeviceFingerprintEmailVerification(dto.email_verification_code);
        return verify_device_fingerprint_email_verification_response;
    }

    // Session Controller
    @Post('session/refresh')
    async refreshSession(@Body() dto: {session_token: string}): Promise<Response> {
        const refresh_session_response = await this.sessionService.refreshSession(dto.session_token);
        return refresh_session_response;
    }

    @Get('session/active')
    async getActiveSessions(@Body() dto: {user_id: string}): Promise<Response> {
        const get_active_sessions_response = await this.sessionService.getUserActiveSessions(dto.user_id);
        return get_active_sessions_response;
    }

    @Post('session/logout')
    async logout(@Body() dto: {session_token: string}): Promise<Response> {
        const logout_response = await this.sessionService.logout(dto.session_token);
        return logout_response;
    }

    @Post('session/revoke-all')
    async revokeAllSessions(@Body() dto: {user_id: string}): Promise<Response> {
        const revoke_all_sessions_response = await this.sessionService.revokeAllSessions(dto.user_id);
        return revoke_all_sessions_response;
    }

    @Post('session/cleanup-expired')
    async cleanupExpiredSessions(@Body() dto: {user_id: string}): Promise<Response> {
        const cleanup_expired_sessions_response = await this.sessionService.cleanupExpiredSessions(dto.user_id);
        return cleanup_expired_sessions_response;
    }

    @Post('session/validate-access')
    async validateAccess(@Body() dto: {access_token: string}): Promise<Response> {
        const validate_access_response = await this.sessionService.validateAccess(dto.access_token);
        return validate_access_response;
    }

    @Post('session/sso')
    async createSsoToken(@Body() dto: {user_id: string}): Promise<Response> {
        const create_sso_token_response = await this.sessionService.createSsoToken(dto.user_id);
        return create_sso_token_response;
    }

    @Post('session/sso/validate')
    async validateSsoToken(@Body() dto: {sso_token: string}): Promise<Response> {
        const validate_sso_token_response = await this.sessionService.validateSsoToken(dto.sso_token);
        return validate_sso_token_response;
    }
}

// export class PasswordController {
//     constructor(private readonly passwordService: PasswordService) {}
//     /*
//     * User Password
//     * A. Password Change
//     * 1. password/change/info:
//     * input: user_id, old_password, new_password
//     * process: check if old password is correct
//     * output: success (return user_data) or error
//     * 2. password/change/change-password:
//     * input: user_id, new_password
//     * process: change password
//     * output: success or error
//     * B. Password Forgot
//     * 1. password/forgot/info:
//     * input: username_or_email
//     * process: check if user exist and password is correct
//     * output: success (return user_data) or error
//     * 2. password/forgot/send-email-verify:
//     * input: email
//     * process: create code and store it to Redis with key: `password-forgot:${code} - value: ${user_id}`
//     * send email verification code to email
//     * output: success or error
//     * 3. password/forgot/email-code-verify:
//     * input: code
//     * process: check if code is valid
//     * if valid take the user_id from redis with key: `password-forgot:${code}`
//     * and create a password key in Redis with key: `password_key:${user_id} - value: ${password_key}`
//     * output: success (return password_key) or error
//     * 4. password/forgot/change-password:
//     * input: password_key, new_password
//     * process: take the user_id from redis with key: `password_key:${password_key}`
//     * and change password in database
//     * output: success or error
//     */
//     // User Password Change Info Endpoint
//     passwordChangeInfo(dto: PasswordChangeInfoDto): Promise<PasswordChangeInfoResponse> {
//         return this.passwordService.passwordChangeInfo(dto);
//     }

//     // User Password Change Change Password Endpoint
//     passwordChangeChangePassword(dto: PasswordChangeChangePasswordDto): Promise<PasswordChangeChangePasswordResponse> {
//         return this.passwordService.passwordChangeChangePassword(dto);
//     }

//     // User Password Forgot Info Endpoint
//     passwordForgotInfo(dto: PasswordForgotInfoDto): Promise<PasswordForgotInfoResponse> {
//         return this.passwordService.passwordForgotInfo(dto);
//     }

//     // User Password Forgot Send Email Verify Endpoint
//     passwordForgotSendEmailVerify(email: string): Promise<PasswordForgotSendEmailVerifyResponse> {
//         return this.passwordService.passwordForgotSendEmailVerify(email);
//     }

//     // User Password Forgot Email Code Verify Endpoint
//     passwordForgotEmailCodeVerify(dto: PasswordForgotEmailCodeVerifyDto): Promise<PasswordForgotEmailCodeVerifyResponse> {
//         return this.passwordService.passwordForgotEmailCodeVerify(dto);
//     }

//     // User Password Forgot Change Password Endpoint
//     passwordForgotChangePassword(dto: PasswordForgotChangePasswordDto): Promise<PasswordForgotChangePasswordResponse> {
//         return this.passwordService.passwordForgotChangePassword(dto);
//     }
// }

// export class InfoController {
//     constructor(private readonly infoService: InfoService) {}

//     /* 
//     * User Info by Access Token
//     * 1. info/by-access-token:
//     * input: access_token
//     * process: get user info by access token
//     * output: success (return user_data) or error
//     */
//     // User Info by Access Token Endpoint
//     infoByAccessToken(access_token: string): Promise<InfoByAccessTokenResponse> {
//         return this.infoService.infoByAccessToken(access_token);
//     }
// }
