import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
// Services Import
import { AuthService } from './auth.service';
// DTOs Import
import {
  LoginDto,
  FingerprintEmailVerificationDto,
  ResendDeviceFingerprintEmailVerificationDto,
} from './dto/login.dto';
import {
  RegisterInfoDto,
  VerifyEmailDto,
  SendEmailVerificationDto,
} from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  LogoutDto,
  ValidateAccessDto,
  ValidateSsoTokenDto,
  CreateSsoTokenDto,
  RevokeSessionDto,
} from './dto/session.dto';
import {
  ChangePasswordDto,
  InitiateForgotPasswordDto,
  VerifyEmailForgotPasswordDto,
  ChangeForgotPasswordDto,
} from './dto/password.dto';
import {
  ExistUserByEmailOrUsernameDto,
  InfoByAccessTokenDto,
  InfoByUserIdDto,
  InfoByEmailOrUsernameDto,
} from './dto/info.dto';
import { RevokeDeviceFingerprintDto } from './dto/device-fingerprint.dto';
// Interfaces Import
import { Response } from '../../interfaces/response.interface';

// Guards Import
import { Public } from '../../common/guards/auth.guard';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import type { AuthenticatedUser } from '../../common/guards/auth.guard';

// Decorators Import
import {
  AuthRateLimit,
  UserRateLimit,
} from '../../common/decorators/rate-limit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Constants Import
import { AUTH_CONSTANTS } from 'apps/auth/src/constants/auth.constants';

@ApiTags('Authentication')
@Controller('auth')
@ApiExtraModels(
  LoginDto,
  FingerprintEmailVerificationDto,
  ResendDeviceFingerprintEmailVerificationDto,
  RegisterInfoDto,
  VerifyEmailDto,
  SendEmailVerificationDto,
  RefreshTokenDto,
  LogoutDto,
  ValidateAccessDto,
  ValidateSsoTokenDto,
  CreateSsoTokenDto,
  RevokeSessionDto,
  ChangePasswordDto,
  InitiateForgotPasswordDto,
  VerifyEmailForgotPasswordDto,
  ChangeForgotPasswordDto,
  ExistUserByEmailOrUsernameDto,
  InfoByAccessTokenDto,
  InfoByUserIdDto,
  InfoByEmailOrUsernameDto,
  RevokeDeviceFingerprintDto,
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email/username and password. Returns access token and refresh token upon successful authentication.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      example1: {
        summary: 'Login with email',
        value: {
          email_or_username: 'user@example.com',
          password: 'securePassword123',
          fingerprint_hashed: 'a1b2c3d4e5f6...',
          browser: 'Chrome 120.0.0.0',
          device: 'Windows 10',
        },
      },
      example2: {
        summary: 'Login with username',
        value: {
          email_or_username: 'johndoe',
          password: 'securePassword123',
          fingerprint_hashed: 'a1b2c3d4e5f6...',
          browser: 'Chrome 120.0.0.0',
          device: 'Windows 10',
        },
      },
    },
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
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIs...',
            },
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIs...',
            },
            user: {
              type: 'object',
              properties: {
                user_id: { type: 'string', example: 'user123' },
                email: { type: 'string', example: 'user@example.com' },
                username: { type: 'string', example: 'johndoe' },
                display_name: { type: 'string', example: 'John Doe' },
              },
            },
            session_token: { type: 'string', example: 'session123' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid email/username or password',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example: 'Too many login attempts. Please try again later.',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('login')
  @Public()
  @AuthRateLimit.login()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<Response> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'User registration',
    description:
      'Register a new user account with email verification. An email verification code will be sent to the provided email address.',
  })
  @ApiBody({
    type: RegisterInfoDto,
    description: 'User registration information',
    examples: {
      example1: {
        summary: 'Register new user',
        value: {
          email: 'user@example.com',
          username: 'johndoe',
          password: 'securePassword123',
          display_name: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registration initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        message: {
          type: 'string',
          example:
            'Registration initiated successfully. Please check your email for verification code.',
        },
        data: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: 'user123' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'johndoe' },
            verification_sent: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid registration data provided',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'User with this email or username already exists',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('register/email-verification')
  @Public()
  @AuthRateLimit.register()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterInfoDto): Promise<Response> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Verify email registration',
    description:
      'Verify email address using the verification code sent during registration.',
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Email verification code',
    examples: {
      example1: {
        summary: 'Verify email with code',
        value: {
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Email verified successfully' },
        data: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: 'user123' },
            email_verified: { type: 'boolean', example: true },
            verified_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification code',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid or expired verification code',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('register/verify-email')
  @Public()
  @AuthRateLimit.verifyEmail()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<Response> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @ApiOperation({ summary: 'Send email verification' })
  @ApiResponse({
    status: 200,
    description: 'Email verification sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @Post('register/send-email-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit.sendEmailVerification()
  async sendEmailVerification(
    @Body() sendEmailVerificationDto: SendEmailVerificationDto,
  ): Promise<Response> {
    return this.authService.sendEmailVerification(
      sendEmailVerificationDto.email,
    );
  }

  @ApiOperation({ summary: 'Verify device fingerprint' })
  @ApiResponse({
    status: 200,
    description: 'Device fingerprint verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example:
            'Device fingerprint verified successfully with session data including access token and session token',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid fingerprint data' })
  @Post('login/fingerprint/email-verification')
  @Public()
  @AuthRateLimit.sendEmailVerification()
  @HttpCode(HttpStatus.OK)
  async verifyFingerprint(
    @Body() fingerprintDto: FingerprintEmailVerificationDto,
  ): Promise<Response> {
    return this.authService.verifyFingerprint(fingerprintDto);
  }

  @ApiOperation({ summary: 'Resend device fingerprint email verification' })
  @ApiResponse({
    status: 200,
    description: 'Device fingerprint email verification resent successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @Post('login/fingerprint/resend-email-verification')
  @Public()
  @AuthRateLimit.sendEmailVerification()
  @HttpCode(HttpStatus.OK)
  async resendDeviceFingerprintEmailVerification(
    @Body() dto: ResendDeviceFingerprintEmailVerificationDto,
  ): Promise<Response> {
    return this.authService.resendDeviceFingerprintEmailVerification(dto);
  }

  @ApiOperation({
    summary: 'Refresh session token',
    description:
      'Refresh the access token using a valid refresh token. Returns a new access token and refresh token.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token for generating new access token',
    examples: {
      example1: {
        summary: 'Refresh token',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIs...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Token refreshed successfully' },
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIs...',
            },
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIs...',
            },
            expires_in: { type: 'number', example: 3600 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid session token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('session/refresh')
  @Public()
  @UserRateLimit.burst()
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<Response> {
    return this.authService.refreshSession(refreshTokenDto);
  }

  @ApiOperation({
    summary: 'User logout',
    description:
      'Logout user by invalidating the session token. This endpoint is public and does not require authentication.',
  })
  @ApiBody({
    type: LogoutDto,
    description: 'Session token to logout',
    examples: {
      example1: {
        summary: 'Logout with session token',
        value: {
          session_token: 'session123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Logout successful' },
        data: {
          type: 'object',
          properties: {
            logged_out: { type: 'boolean', example: true },
            session_invalidated: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Logout failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid session token or logout failed',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('session/logout')
  @Public()
  @UserRateLimit.burst()
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() logoutDto: LogoutDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.logout(logoutDto.session_token, authorization);
  }

  @ApiOperation({ summary: 'Revoke specific session' })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid session ID' })
  @ApiBearerAuth('JWT-auth')
  @Post('session/revoke')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Body() dto: RevokeSessionDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.revokeSession(dto.session_id, authorization);
  }
  @ApiOperation({
    summary: 'Get current user info',
    description:
      'Retrieve information about the currently authenticated user from the JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User info retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'User information retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'user123' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'johndoe' },
            displayName: { type: 'string', example: 'John Doe' },
            roles: {
              type: 'array',
              items: { type: 'string' },
              example: ['user'],
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['read', 'write'],
            },
            iat: { type: 'number', example: 1640995200 },
            exp: { type: 'number', example: 1640998800 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized access' },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @Get('user/current')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    return Promise.resolve({
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: 'User information retrieved successfully',
      data: user,
    });
  }

  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Get('session/active')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.getActiveSessions(user.userId, authorization);
  }

  @ApiOperation({ summary: 'Revoke all sessions' })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Post('session/revoke-all')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.burst()
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.revokeAllSessions(authorization);
  }

  @ApiOperation({ summary: 'Validate access token' })
  @ApiResponse({
    status: 200,
    description: 'Access token validated successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid access token' })
  @Post('session/validate-access')
  @Public()
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async validateAccess(
    @Body() validateAccessDto: ValidateAccessDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.validateAccess(
      validateAccessDto.access_token,
      authorization,
    );
  }

  @ApiOperation({ summary: 'Create SSO token' })
  @ApiResponse({ status: 200, description: 'SSO token created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Post('sso/create')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async createSsoToken(
    @Body() dto: CreateSsoTokenDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.createSsoToken(
      dto.app,
      dto.fingerprint_hashed,
      authorization,
    );
  }

  @ApiOperation({ summary: 'Validate SSO token' })
  @ApiResponse({ status: 200, description: 'SSO token validated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid SSO token' })
  @Post('sso/validate')
  @Public()
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async validateSsoToken(
    @Body() validateSsoTokenDto: ValidateSsoTokenDto,
  ): Promise<Response> {
    return this.authService.validateSsoToken(validateSsoTokenDto.sso_token);
  }

  @ApiOperation({
    summary: 'Change password',
    description:
      'Change the password for the authenticated user. Requires the current password for verification.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change information',
    examples: {
      example1: {
        summary: 'Change password',
        value: {
          old_password: 'currentPassword123',
          new_password: 'newSecurePassword456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Password changed successfully' },
        data: {
          type: 'object',
          properties: {
            password_changed: { type: 'boolean', example: true },
            changed_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid password format or requirements not met',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or incorrect current password',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Incorrect current password or unauthorized access',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @Post('password/change')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.changePassword(
      changePasswordDto.old_password,
      changePasswordDto.new_password,
      authorization,
    );
  }

  @ApiOperation({
    summary: 'Initiate forgot password',
    description:
      "Initiate the forgot password process by sending a verification code to the user's email. This endpoint is public and does not require authentication.",
  })
  @ApiBody({
    type: InitiateForgotPasswordDto,
    description: 'Email or username to initiate password reset',
    examples: {
      example1: {
        summary: 'Initiate forgot password with email',
        value: {
          email_or_username: 'user@example.com',
        },
      },
      example2: {
        summary: 'Initiate forgot password with username',
        value: {
          email_or_username: 'johndoe',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Forgot password process initiated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Password reset code sent to your email',
        },
        data: {
          type: 'object',
          properties: {
            reset_initiated: { type: 'boolean', example: true },
            email_sent: { type: 'boolean', example: true },
            expires_in: { type: 'number', example: 900 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'User not found with the provided email or username',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('password/forgot/initiate')
  @Public()
  @AuthRateLimit.forgotPassword()
  @UserRateLimit.strict()
  @HttpCode(HttpStatus.OK)
  async initiateForgotPassword(
    @Body() initiateForgotPasswordDto: InitiateForgotPasswordDto,
  ): Promise<Response> {
    return this.authService.initiateForgotPassword(
      initiateForgotPasswordDto.email_or_username,
    );
  }

  @ApiOperation({ summary: 'Verify email for forgot password' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('password/forgot/verify-email')
  @Public()
  @UserRateLimit.strict()
  @HttpCode(HttpStatus.OK)
  async verifyEmailForgotPassword(
    @Body() verifyEmailDto: VerifyEmailForgotPasswordDto,
  ): Promise<Response> {
    return this.authService.verifyEmailForgotPassword(verifyEmailDto.code);
  }

  @Post('password/forgot/change')
  @Public()
  @UserRateLimit.strict()
  @HttpCode(HttpStatus.OK)
  async changeForgotPassword(
    @Body() changeForgotPasswordDto: ChangeForgotPasswordDto,
  ): Promise<Response> {
    return this.authService.changeForgotPassword(
      changeForgotPasswordDto.code,
      changeForgotPasswordDto.new_password,
    );
  }

  @ApiOperation({ summary: 'Check if user exists' })
  @ApiResponse({ status: 200, description: 'User exists' })
  @ApiResponse({ status: 400, description: 'User does not exist' })
  @Post('info/exist-by-email-or-username')
  @Public()
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async existUserByEmailOrUsername(
    @Body() dto: ExistUserByEmailOrUsernameDto,
  ): Promise<Response> {
    return this.authService.existUserByEmailOrUsername(dto.email_or_username);
  }

  // Device Fingerprint Endpoints

  @ApiOperation({ summary: 'Get device fingerprints' })
  @ApiResponse({
    status: 200,
    description: 'Device fingerprints retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Get('fingerprints')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getDeviceFingerprints(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.getDeviceFingerprints(authorization);
  }

  @ApiOperation({ summary: 'Revoke device fingerprint' })
  @ApiResponse({
    status: 200,
    description: 'Device fingerprint revoked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid device fingerprint ID' })
  @ApiBearerAuth('JWT-auth')
  @Post('fingerprints/revoke')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @HttpCode(HttpStatus.OK)
  async revokeDeviceFingerprint(
    @Body() dto: RevokeDeviceFingerprintDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.revokeDeviceFingerprint(
      dto.device_fingerprint_id,
      authorization,
    );
  }

  // Additional Info Endpoints

  @ApiOperation({ summary: 'Get user info by access token' })
  @ApiResponse({
    status: 200,
    description: 'User info retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid access token' })
  @Post('info/by-access-token')
  @Public()
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getUserInfoByAccessToken(
    @Body() dto: InfoByAccessTokenDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.getUserInfoByAccessToken(
      dto.access_token,
      authorization,
    );
  }

  @ApiOperation({ summary: 'Get user info by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User info retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @Post('info/by-user-id')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getUserInfoByUserId(
    @Body() dto: InfoByUserIdDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.getUserInfoByUserId(dto.user_id, authorization);
  }

  @ApiOperation({ summary: 'Get user info by email or username' })
  @ApiResponse({
    status: 200,
    description: 'User info retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @Post('info/by-email-or-username')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getUserInfoByEmailOrUsername(
    @Body() dto: InfoByEmailOrUsernameDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.getUserInfoByEmailOrUsername(
      dto.email_or_username,
      authorization,
    );
  }

  // Health Check Endpoint

  @ApiOperation({
    summary: 'Health check',
    description:
      'Check the health status of the authentication service. This endpoint is public and does not require authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Authentication service is healthy',
        },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2024-01-01T00:00:00Z' },
            service: { type: 'string', example: 'auth-service' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 503 },
        message: {
          type: 'string',
          example: 'Authentication service is temporarily unavailable',
        },
        data: { type: 'null', example: null },
      },
    },
  })
  @Get('healthz')
  @Public()
  @UserRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async checkHealth(): Promise<Response> {
    return this.authService.checkHealth();
  }
}
