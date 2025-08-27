import { 
    Controller, 
    Post, 
    Body, 
    HttpCode, 
    HttpStatus, 
    UseGuards,
    Get,
    Headers,
    UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
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
    ChangePasswordDto, 
    VerifyEmailChangePasswordDto, 
    ChangeForgotPasswordDto 
} from './dto/password.dto';
import { Response } from '../../interfaces/response.interface';
import { AuthGuard, Public } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/guards/auth.guard';
import { AuthRateLimit, UserRateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * User login endpoint
     * @param loginDto - Login credentials
     * @returns Authentication tokens and user data
     */
    @Post('login')
    @Public()
    @AuthRateLimit.login()
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<Response> {
        return this.authService.login(loginDto);
    }

    /**
     * Verify device fingerprint through email verification
     * @param verificationDto - Email verification code
     * @returns Verification status
     */
    @Post('login/fingerprint/email-verification')
    @Public()
    @HttpCode(HttpStatus.OK)
    async verifyFingerprint(@Body() verificationDto: FingerprintEmailVerificationDto): Promise<Response> {
        return this.authService.verifyFingerprint(verificationDto);
    }

    /**
     * User registration endpoint
     * @param registerDto - Registration information
     * @returns Registration confirmation
     */
    @Post('register')
    @Public()
    @AuthRateLimit.register()
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterInfoDto): Promise<Response> {
        return this.authService.register(registerDto);
    }

    /**
     * Verify email for registration
     * @param verifyEmailDto - Email verification code
     * @returns Email verification status
     */
    @Post('register/verify-email')
    @Public()
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<Response> {
        return this.authService.verifyEmail(verifyEmailDto);
    }

    /**
     * Refresh session token
     * @param refreshTokenDto - Session token for refresh
     * @returns New access token
     */
    @Post('refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<Response> {
        return this.authService.refreshToken(refreshTokenDto);
    }

    /**
     * Logout user
     * @param sessionToken - Session token to invalidate
     * @returns Logout confirmation
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() body: { session_token: string }): Promise<Response> {
        return this.authService.logout(body.session_token);
    }

    /**
     * Get current user information
     * @param user - Current authenticated user (from token)
     * @returns User information
     */
    @Get('me')
    @UseGuards(AuthGuard)
    @UserRateLimit.standard()
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return {
            success: true,
            statusCode: 200,
            message: 'User information retrieved successfully',
            data: user
        };
    }

    /**
     * Validate access token
     * @param authorization - Bearer token from header
     * @returns Token validation status
     */
    @Get('validate')
    @Public()
    @HttpCode(HttpStatus.OK)
    async validateToken(@Headers('authorization') authorization?: string): Promise<Response> {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new UnauthorizedException('Bearer token is required');
        }

        const token = authorization.substring(7); // Remove 'Bearer ' prefix
        return this.authService.validateToken(token);
    }

    // Session Management Endpoints

    /**
     * Get active session for current user
     * @param user - Current authenticated user
     * @returns List of active session
     */
    @Get('session/active')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getActiveSessions(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return this.authService.getActiveSessions(user.userId);
    }

    /**
     * Revoke all session for current user
     * @param user - Current authenticated user
     * @returns Confirmation of session revocation
     */
    @Post('session/revoke-all')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async revokeAllSessions(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return this.authService.revokeAllSessions(user.userId);
    }

    /**
     * Create SSO token for current user
     * @param user - Current authenticated user
     * @returns SSO token
     */
    @Post('session/sso')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async createSsoToken(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return this.authService.createSsoToken(user.userId);
    }

    /**
     * Validate SSO token
     * @param validateSsoTokenDto - SSO token to validate
     * @returns SSO token validation result
     */
    @Post('session/sso/validate')
    @Public()
    @HttpCode(HttpStatus.OK)
    async validateSsoToken(@Body() validateSsoTokenDto: ValidateSsoTokenDto): Promise<Response> {
        return this.authService.validateSsoToken(validateSsoTokenDto.sso_token);
    }

    // Password Management Endpoints

    /**
     * Change user password
     * @param changePasswordDto - Password change data
     * @param user - Current authenticated user
     * @returns Password change confirmation
     */
    @Post('password/change')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Body() changePasswordDto: ChangePasswordDto,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<Response> {
        return this.authService.changePassword(
            user.userId,
            changePasswordDto.old_password,
            changePasswordDto.new_password
        );
    }

    /**
     * Initiate forgot password process
     * @param user - Current authenticated user (from access token)
     * @returns Email verification confirmation
     */
    @Post('password/forgot/initiate')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async initiateForgotPassword(
        @CurrentUser() user: AuthenticatedUser
    ): Promise<Response> {
        return this.authService.initiateForgotPassword(user.userId);
    }

    /**
     * Verify email for forgot password
     * @param verifyEmailDto - Email verification code
     * @returns Email verification status
     */
    @Post('password/forgot/verify-email')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async verifyEmailForgotPassword(@Body() verifyEmailDto: VerifyEmailChangePasswordDto): Promise<Response> {
        return this.authService.verifyEmailForgotPassword(verifyEmailDto.code);
    }

    /**
     * Change password using forgot password flow
     * @param changeForgotPasswordDto - Password change data with verification code
     * @returns Password change confirmation
     */
    @Post('password/forgot/change')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async changeForgotPassword(@Body() changeForgotPasswordDto: ChangeForgotPasswordDto): Promise<Response> {
        return this.authService.changeForgotPassword(changeForgotPasswordDto.code, changeForgotPasswordDto.new_password);
    }
}
