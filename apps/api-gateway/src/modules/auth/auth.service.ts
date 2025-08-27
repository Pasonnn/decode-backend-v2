import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { Response } from '../../interfaces/response.interface';
import { AuthResponse, LoginResponse, RegisterResponse } from './interfaces/auth.interface';
import { LoginDto, FingerprintEmailVerificationDto } from './dto/login.dto';
import { RegisterInfoDto, VerifyEmailDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { 
    RefreshSessionDto, 
    GetActiveSessionsDto, 
    LogoutDto, 
    RevokeAllSessionsDto, 
    ValidateAccessDto, 
    CreateSsoTokenDto, 
    ValidateSsoTokenDto 
} from './dto/session.dto';
import { 
    VerifyEmailChangePasswordDto, 
    ChangeForgotPasswordDto 
} from './dto/password.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly authServiceClient: AuthServiceClient,
    ) {}

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

            this.logger.log(`Login successful for user: ${loginDto.email_or_username}`);
            return response;
        } catch (error) {
            this.logger.error(`Login failed for user ${loginDto.email_or_username}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify device fingerprint through email verification
     */
    async verifyFingerprint(verificationDto: FingerprintEmailVerificationDto): Promise<Response> {
        try {
            this.logger.log('Device fingerprint verification attempt');
            
            const response = await this.authServiceClient.post('/auth/login/fingerprint/email-verification', verificationDto);
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Fingerprint verification failed');
            }

            this.logger.log('Device fingerprint verification successful');
            return response;
        } catch (error) {
            this.logger.error(`Fingerprint verification failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Register new user with email verification
     */
    async register(registerDto: RegisterInfoDto): Promise<Response> {
        try {
            this.logger.log(`Registration attempt for user: ${registerDto.username} (${registerDto.email})`);
            
            const response = await this.authServiceClient.register(registerDto);
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Registration failed');
            }

            this.logger.log(`Registration successful for user: ${registerDto.username}`);
            return response;
        } catch (error) {
            this.logger.error(`Registration failed for user ${registerDto.username}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify email for registration
     */
    async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<Response> {
        try {
            this.logger.log('Email verification attempt');
            
            const response = await this.authServiceClient.post('/auth/register/verify-email', verifyEmailDto);
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Email verification failed');
            }

            this.logger.log('Email verification successful');
            return response;
        } catch (error) {
            this.logger.error(`Email verification failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Refresh session token
     */
    async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<Response> {
        try {
            this.logger.log('Token refresh attempt');
            
            const response = await this.authServiceClient.post('/auth/session/refresh', refreshTokenDto);
            
            if (!response.success) {
                throw new UnauthorizedException(response.message || 'Token refresh failed');
            }

            this.logger.log('Token refresh successful');
            return response;
        } catch (error) {
            this.logger.error(`Token refresh failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Logout user by invalidating session
     */
    async logout(sessionToken: string): Promise<Response> {
        try {
            this.logger.log('Logout attempt');
            
            const response = await this.authServiceClient.post('/auth/session/logout', { session_token: sessionToken });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Logout failed');
            }

            this.logger.log('Logout successful');
            return response;
        } catch (error) {
            this.logger.error(`Logout failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate access token
     */
    async validateToken(accessToken: string): Promise<Response> {
        try {
            const response = await this.authServiceClient.validateToken(accessToken);
            return response;
        } catch (error) {
            this.logger.error(`Token validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get user info by access token
     */
    async getUserInfo(accessToken: string): Promise<Response> {
        try {
            const response = await this.authServiceClient.post('/auth/info/by-access-token', { access_token: accessToken });
            return response;
        } catch (error) {
            this.logger.error(`Get user info failed: ${error.message}`);
            throw error;
        }
    }

    // Session Management Methods

    /**
     * Get active sessions for a user
     */
    async getActiveSessions(userId: string): Promise<Response> {
        try {
            this.logger.log(`Getting active sessions for user: ${userId}`);
            
            const response = await this.authServiceClient.post('/auth/session/active', { user_id: userId });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Failed to get active sessions');
            }

            this.logger.log(`Successfully retrieved active sessions for user: ${userId}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to get active sessions for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Revoke all sessions for a user
     */
    async revokeAllSessions(userId: string): Promise<Response> {
        try {
            this.logger.log(`Revoking all sessions for user: ${userId}`);
            
            const response = await this.authServiceClient.post('/auth/session/revoke-all', { user_id: userId });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Failed to revoke all sessions');
            }

            this.logger.log(`Successfully revoked all sessions for user: ${userId}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to revoke all sessions for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate access token
     */
    async validateAccess(accessToken: string): Promise<Response> {
        try {
            this.logger.log('Validating access token');
            
            const response = await this.authServiceClient.post('/auth/session/validate-access', { access_token: accessToken });
            
            if (!response.success) {
                throw new UnauthorizedException(response.message || 'Access token validation failed');
            }

            this.logger.log('Access token validation successful');
            return response;
        } catch (error) {
            this.logger.error(`Access token validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create SSO token
     */
    async createSsoToken(userId: string): Promise<Response> {
        try {
            this.logger.log(`Creating SSO token for user: ${userId}`);
            
            const response = await this.authServiceClient.post('/auth/session/sso', { user_id: userId });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Failed to create SSO token');
            }

            this.logger.log(`Successfully created SSO token for user: ${userId}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to create SSO token for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate SSO token
     */
    async validateSsoToken(ssoToken: string): Promise<Response> {
        try {
            this.logger.log('Validating SSO token');
            
            const response = await this.authServiceClient.post('/auth/session/sso/validate', { sso_token: ssoToken });
            
            if (!response.success) {
                throw new UnauthorizedException(response.message || 'SSO token validation failed');
            }

            this.logger.log('SSO token validation successful');
            return response;
        } catch (error) {
            this.logger.error(`SSO token validation failed: ${error.message}`);
            throw error;
        }
    }

    // Password Management Methods

    /**
     * Change user password
     */
    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<Response> {
        try {
            this.logger.log(`Changing password for user: ${userId}`);
            
            const response = await this.authServiceClient.post('/auth/password/change', {
                user_id: userId,
                old_password: oldPassword,
                new_password: newPassword
            });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Password change failed');
            }

            this.logger.log(`Successfully changed password for user: ${userId}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to change password for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Initiate forgot password process
     */
    async initiateForgotPassword(userId: string): Promise<Response> {
        try {
            this.logger.log(`Initiating forgot password for user: ${userId}`);
            
            const response = await this.authServiceClient.post('/auth/password/forgot/email-verification', { user_id: userId });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Failed to initiate forgot password');
            }

            this.logger.log(`Successfully initiated forgot password for user: ${userId}`);
            return response;
        } catch (error) {
            this.logger.error(`Failed to initiate forgot password for user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify email for forgot password
     */
    async verifyEmailForgotPassword(code: string): Promise<Response> {
        try {
            this.logger.log('Verifying email for forgot password');
            
            const response = await this.authServiceClient.post('/auth/password/forgot/verify-email', { code });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Email verification failed');
            }

            this.logger.log('Successfully verified email for forgot password');
            return response;
        } catch (error) {
            this.logger.error(`Email verification for forgot password failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Change password using forgot password flow
     */
    async changeForgotPassword(code: string, newPassword: string): Promise<Response> {
        try {
            this.logger.log('Changing password using forgot password flow');
            
            const response = await this.authServiceClient.post('/auth/password/forgot/change', {
                code,
                new_password: newPassword
            });
            
            if (!response.success) {
                throw new BadRequestException(response.message || 'Password change failed');
            }

            this.logger.log('Successfully changed password using forgot password flow');
            return response;
        } catch (error) {
            this.logger.error(`Failed to change password using forgot password flow: ${error.message}`);
            throw error;
        }
    }
}
