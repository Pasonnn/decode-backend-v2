import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, FingerprintEmailVerificationDto } from './dto/login.dto';
import { RegisterInfoDto, VerifyEmailDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  LogoutDto,
  ValidateAccessDto,
  ValidateSsoTokenDto,
} from './dto/session.dto';
import {
  ChangePasswordDto,
  VerifyEmailChangePasswordDto,
} from './dto/password.dto';
import { Response } from '../../interfaces/response.interface';
import { AuthGuard, Public } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/guards/auth.guard';
import { AuthRateLimit } from '../../common/decorators/rate-limit.decorator';
import { AUTH_CONSTANTS } from 'apps/auth/src/constants/auth.constants';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @Post('login')
  @Public()
  @AuthRateLimit.login()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<Response> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration initiated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post('register/email-verification')
  @Public()
  @AuthRateLimit.register()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterInfoDto): Promise<Response> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Verify email registration' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @Post('register/verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<Response> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @ApiOperation({ summary: 'Verify device fingerprint' })
  @ApiResponse({
    status: 200,
    description: 'Device fingerprint verified successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid fingerprint data' })
  @Post('login/fingerprint/email-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyFingerprint(
    @Body() fingerprintDto: FingerprintEmailVerificationDto,
  ): Promise<Response> {
    return this.authService.verifyFingerprint(fingerprintDto);
  }

  @ApiOperation({ summary: 'Refresh session token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid session token' })
  @Post('session/refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<Response> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 400, description: 'Logout failed' })
  @Post('session/logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() logoutDto: LogoutDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.logout(logoutDto.session_token, authorization);
  }
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Get('user/current')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    return Promise.resolve({
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: 'User information retrieved successfully',
      data: user,
    });
  }

  @ApiOperation({ summary: 'Validate access token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or missing token' })
  @Get('validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  async validateToken(
    @Headers('authorization') authorization?: string,
  ): Promise<Response> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const token = authorization.substring(7);
    return this.authService.validateToken(token, authorization);
  }

  @ApiOperation({ summary: 'Get active sessions' })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Get('session/active')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getActiveSessions(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.getActiveSessions(authorization);
  }

  @ApiOperation({ summary: 'Revoke all sessions' })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Post('session/revoke-all')
  @UseGuards(AuthGuard)
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
  @Post('session/sso')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async createSsoToken(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.createSsoToken(user.userId, authorization);
  }

  @ApiOperation({ summary: 'Validate SSO token' })
  @ApiResponse({ status: 200, description: 'SSO token validated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid SSO token' })
  @Post('session/sso/validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  async validateSsoToken(
    @Body() validateSsoTokenDto: ValidateSsoTokenDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.validateSsoToken(
      validateSsoTokenDto.sso_token,
      authorization,
    );
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or incorrect current password',
  })
  @ApiBearerAuth('JWT-auth')
  @Post('password/change')
  @UseGuards(AuthGuard)
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

  @ApiOperation({ summary: 'Initiate forgot password' })
  @ApiResponse({
    status: 200,
    description: 'Forgot password process initiated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Post('password/forgot/initiate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async initiateForgotPassword(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.initiateForgotPassword(authorization);
  }

  @ApiOperation({ summary: 'Verify email for forgot password' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @Post('password/forgot/verify-email')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEmailForgotPassword(
    @Body() verifyEmailDto: VerifyEmailChangePasswordDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.authService.verifyEmailForgotPassword(
      verifyEmailDto.code,
      authorization,
    );
  }
}
