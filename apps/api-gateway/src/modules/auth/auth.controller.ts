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
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth, 
    ApiBody,
    ApiHeader,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({
        summary: 'User login',
        description: 'Authenticate user with email/username and password'
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                statusCode: { type: 'number', example: 200 },
                message: { type: 'string', example: 'Login successful' },
                data: {
                    type: 'object',
                    properties: {
                        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        session_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                                username: { type: 'string', example: 'john_doe' },
                                email: { type: 'string', example: 'john.doe@example.com' }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials'
    })
    @ApiResponse({
        status: 429,
        description: 'Too many login attempts'
    })
    @Post('login')
    @Public()
    @AuthRateLimit.login()
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<Response> {
        return this.authService.login(loginDto);
    }

    @ApiOperation({
        summary: 'Verify device fingerprint',
        description: 'Verify device fingerprint through email verification for enhanced security'
    })
    @ApiResponse({
        status: 200,
        description: 'Device fingerprint verified successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid verification code'
    })
    @Post('login/fingerprint/email-verification')
    @Public()
    @HttpCode(HttpStatus.OK)
    async verifyFingerprint(@Body() verificationDto: FingerprintEmailVerificationDto): Promise<Response> {
        return this.authService.verifyFingerprint(verificationDto);
    }

    @ApiOperation({
        summary: 'User registration',
        description: 'Register a new user account'
    })
    @ApiResponse({
        status: 201,
        description: 'Registration initiated successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid registration data'
    })
    @ApiResponse({
        status: 409,
        description: 'User already exists'
    })
    @ApiResponse({
        status: 429,
        description: 'Too many registration attempts'
    })
    @Post('register')
    @Public()
    @AuthRateLimit.register()
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterInfoDto): Promise<Response> {
        return this.authService.register(registerDto);
    }

    @ApiOperation({
        summary: 'Verify email for registration',
        description: 'Complete registration by verifying email with provided code'
    })
    @ApiResponse({
        status: 200,
        description: 'Email verified successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid verification code'
    })
    @Post('register/verify-email')
    @Public()
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<Response> {
        return this.authService.verifyEmail(verifyEmailDto);
    }

    @ApiOperation({
        summary: 'Refresh session token',
        description: 'Refresh access token using session token'
    })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid session token'
    })
    @Post('refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<Response> {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @ApiOperation({
        summary: 'User logout',
        description: 'Logout user by invalidating session token'
    })
    @ApiResponse({
        status: 200,
        description: 'Logout successful'
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid session token'
    })
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() body: { session_token: string }): Promise<Response> {
        return this.authService.logout(body.session_token);
    }

    @ApiOperation({
        summary: 'Get current user information',
        description: 'Retrieve information about the currently authenticated user'
    })
    @ApiResponse({
        status: 200,
        description: 'User information retrieved successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
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

    @ApiOperation({
        summary: 'Validate access token',
        description: 'Validate JWT access token from Authorization header'
    })
    @ApiResponse({
        status: 200,
        description: 'Token is valid'
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or missing token'
    })
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer token',
        required: true,
        example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
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

    @ApiOperation({
        summary: 'Get active sessions',
        description: 'Retrieve all active sessions for the current user'
    })
    @ApiResponse({
        status: 200,
        description: 'Active sessions retrieved successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
    @Get('session/active')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getActiveSessions(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return this.authService.getActiveSessions(user.userId);
    }

    @ApiOperation({
        summary: 'Revoke all sessions',
        description: 'Revoke all active sessions for the current user across all devices'
    })
    @ApiResponse({
        status: 200,
        description: 'All sessions revoked successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
    @Post('session/revoke-all')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async revokeAllSessions(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return this.authService.revokeAllSessions(user.userId);
    }

    @ApiOperation({
        summary: 'Create SSO token',
        description: 'Create Single Sign-On token for cross-service authentication'
    })
    @ApiResponse({
        status: 200,
        description: 'SSO token created successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
    @Post('session/sso')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async createSsoToken(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
        return this.authService.createSsoToken(user.userId);
    }

    @ApiOperation({
        summary: 'Validate SSO token',
        description: 'Validate Single Sign-On token for cross-service authentication'
    })
    @ApiResponse({
        status: 200,
        description: 'SSO token is valid'
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid SSO token'
    })
    @Post('session/sso/validate')
    @Public()
    @HttpCode(HttpStatus.OK)
    async validateSsoToken(@Body() validateSsoTokenDto: ValidateSsoTokenDto): Promise<Response> {
        return this.authService.validateSsoToken(validateSsoTokenDto.sso_token);
    }

    // Password Management Endpoints

    @ApiOperation({
        summary: 'Change password',
        description: 'Change user password with current password verification'
    })
    @ApiResponse({
        status: 200,
        description: 'Password changed successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid password data'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized or incorrect current password'
    })
    @ApiBearerAuth('JWT-auth')
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

    @ApiOperation({
        summary: 'Initiate forgot password',
        description: 'Start the forgot password process by sending email verification'
    })
    @ApiResponse({
        status: 200,
        description: 'Forgot password process initiated successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
    @Post('password/forgot/initiate')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async initiateForgotPassword(
        @CurrentUser() user: AuthenticatedUser
    ): Promise<Response> {
        return this.authService.initiateForgotPassword(user.userId);
    }

    @ApiOperation({
        summary: 'Verify email for forgot password',
        description: 'Verify email code for forgot password process'
    })
    @ApiResponse({
        status: 200,
        description: 'Email verified successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid verification code'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
    @Post('password/forgot/verify-email')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async verifyEmailForgotPassword(@Body() verifyEmailDto: VerifyEmailChangePasswordDto): Promise<Response> {
        return this.authService.verifyEmailForgotPassword(verifyEmailDto.code);
    }

    @ApiOperation({
        summary: 'Change forgot password',
        description: 'Complete forgot password process by setting new password'
    })
    @ApiResponse({
        status: 200,
        description: 'Password changed successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid password data or verification code'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized'
    })
    @ApiBearerAuth('JWT-auth')
    @Post('password/forgot/change')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async changeForgotPassword(@Body() changeForgotPasswordDto: ChangeForgotPasswordDto): Promise<Response> {
        return this.authService.changeForgotPassword(changeForgotPasswordDto.code, changeForgotPasswordDto.new_password);
    }
}
