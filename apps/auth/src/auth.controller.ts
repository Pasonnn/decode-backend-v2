// Import the necessary modules
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RegisterInfoDto, VerifyEmailDto } from './dto/register.dto';
import { LoginDto, FingerprintEmailVerificationDto } from './dto/login.dto';
import { Response } from './interfaces/response.interface';
import { SessionDoc } from './interfaces/session-doc.interface';

// Import the Services
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { InfoService } from './services/info.service';

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
        const verify_email_register_response = await this.registerService.verifyEmailRegister(dto.code);
        return verify_email_register_response;
    }

    // Login Controller
    @Post('login')
    async login(@Body() dto: LoginDto): Promise<Response> {
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

    // Password Controller
    @Post('password/change')
    async changePassword(@Body() dto: {user_id: string, old_password: string, new_password: string}): Promise<Response> {
        const change_password_response = await this.passwordService.changePassword(dto.user_id, dto.old_password, dto.new_password);
        return change_password_response;
    }

    @Post('password/forgot/email-verification')
    async emailVerificationChangePassword(@Body() dto: {user_id: string}): Promise<Response> {
        const email_verification_change_password_response = await this.passwordService.emailVerificationChangePassword(dto.user_id);
        return email_verification_change_password_response;
    }

    @Post('password/forgot/verify-email')
    async verifyEmailChangePassword(@Body() dto: {email_verification_code: string}): Promise<Response> {
        const verify_email_change_password_response = await this.passwordService.verifyEmailChangePassword(dto.email_verification_code);
        return verify_email_change_password_response;
    }

    @Post('password/forgot/change')
    async changeForgotPassword(@Body() dto: {user_id: string, email_verification_code: string, new_password: string}): Promise<Response> {
        const change_forgot_password_response = await this.passwordService.changeForgotPassword(dto.user_id, dto.email_verification_code, dto.new_password);
        return change_forgot_password_response;
    }

    // Info Controller
    @Get('info/by-access-token')
    async infoByAccessToken(@Query() dto: {access_token: string}): Promise<Response> {
        const info_by_access_token_response = await this.infoService.getUserInfoByAccessToken(dto.access_token);
        return info_by_access_token_response;
    }

    @Get('info/by-user-id')
    async infoByUserId(@Query() dto: {user_id: string}): Promise<Response> {
        const info_by_user_id_response = await this.infoService.getUserInfoByUserId(dto.user_id);
        return info_by_user_id_response;
    }

    @Get('info/by-email-or-username')
    async infoByEmailOrUsername(@Query() dto: {email_or_username: string}): Promise<Response> {
        const info_by_email_or_username_response = await this.infoService.getUserInfoByEmailOrUsername(dto.email_or_username);
        return info_by_email_or_username_response;
    }
}