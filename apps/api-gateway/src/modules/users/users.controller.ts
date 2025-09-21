import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

// Services
import { UsersService } from './users.service';

// DTOs
import { UpdateUserDisplayNameDto } from './dto/update-user.dto';
import { UpdateUserBioDto } from './dto/update-user.dto';
import { UpdateUserAvatarDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user.dto';
import { VerifyUsernameCodeDto, ChangeUsernameDto } from './dto/username.dto';
import { VerifyEmailCodeDto, ChangeEmailDto } from './dto/email.dto';
import {
  SearchUserDto,
  SearchUsernameDto,
  SearchEmailDto,
} from './dto/search.dto';

// Guards and Decorators
import { Public } from '../../common/guards/auth.guard';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import {
  UserRateLimit,
  AdminRateLimit,
} from '../../common/decorators/rate-limit.decorator';

// Interfaces
import type { Response } from '../../interfaces/response.interface';
import {
  UserResponseDto,
  UserResponseWithoutEmailDto,
} from './dto/user-response.dto';
import type { UserDoc } from '../../interfaces/user-doc.interface';

@ApiTags('User Management')
@Controller('users')
@UseGuards(AuthGuardWithFingerprint)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==================== HEALTH CHECK ====================

  @Get('healthz')
  @Public()
  @ApiOperation({ summary: 'Check user service health' })
  @ApiResponse({
    status: 200,
    description: 'User service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'User service is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
        },
      },
    },
  })
  checkHealth(): Response<{ status: string }> {
    return this.usersService.checkHealth();
  }

  // ==================== PROFILE ENDPOINTS ====================

  @Get('profile/me')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getMyProfile(
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc>> {
    return await this.usersService.getMyProfile(authorization);
  }

  @Get('profile/:user_id')
  @ApiOperation({ summary: 'Get user profile by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseWithoutEmailDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getUserProfile(
    @Param('user_id') userId: string,
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc>> {
    return await this.usersService.getUserProfile(
      { user_id: userId },
      authorization,
    );
  }

  @Put('profile/display-name')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Update user display name' })
  @ApiResponse({
    status: 200,
    description: 'Display name updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid display name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateDisplayName(
    @Body() body: UpdateUserDisplayNameDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc>> {
    return await this.usersService.updateUserDisplayName(
      { display_name: body.display_name },
      authorization,
    );
  }

  @Put('profile/bio')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Update user bio' })
  @ApiResponse({
    status: 200,
    description: 'Bio updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid bio' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateBio(
    @Body() body: UpdateUserBioDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc>> {
    return await this.usersService.updateUserBio(
      { bio: body.bio },
      authorization,
    );
  }

  @Put('profile/avatar')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid avatar data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateAvatar(
    @Body() body: UpdateUserAvatarDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc>> {
    return await this.usersService.updateUserAvatar(
      {
        avatar_ipfs_hash: body.avatar_ipfs_hash,
      },
      authorization,
    );
  }

  @Put('profile/role')
  @Roles('admin' as UserRole)
  @AdminRateLimit.standard()
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid role data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Body() body: UpdateUserRoleDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc>> {
    return await this.usersService.updateUserRole(body, authorization);
  }

  // ==================== USERNAME ENDPOINTS ====================

  @Post('username/change/initiate')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Initiate username change process' })
  @ApiResponse({
    status: 200,
    description: 'Username change initiated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async changeUsernameInitiate(
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.changeUsernameInitiate(authorization);
  }

  @Post('username/change/verify-email')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Verify username change email code' })
  @ApiResponse({
    status: 200,
    description: 'Username change email code verified successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async changeUsernameVerifyEmail(
    @Body() body: VerifyUsernameCodeDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.changeUsernameVerifyEmail(
      { code: body.code },
      authorization,
    );
  }

  @Post('username/change/complete')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Complete username change' })
  @ApiResponse({
    status: 200,
    description: 'Username changed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid username data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async changeUsername(
    @Body() body: ChangeUsernameDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.changeUsername(
      {
        new_username: body.new_username,
        code: body.code,
      },
      authorization,
    );
  }

  // ==================== EMAIL ENDPOINTS ====================

  @Post('email/change/initiate')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Initiate email change process' })
  @ApiResponse({
    status: 200,
    description: 'Email change initiated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async changeEmailInitiate(
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.changeEmailInitiate(authorization);
  }

  @Post('email/change/verify-email')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Verify email change code' })
  @ApiResponse({
    status: 200,
    description: 'Email change code verified successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async changeEmailVerifyEmail(
    @Body() body: VerifyEmailCodeDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.changeEmailVerifyEmail(
      { code: body.code },
      authorization,
    );
  }

  @Post('email/change/new-email-initiate')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Initiate new email change' })
  @ApiResponse({
    status: 200,
    description: 'New email change initiated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid email data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async newEmailInitiate(
    @Body() body: ChangeEmailDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.newEmailInitiate(
      {
        new_email: body.new_email,
        code: body.code,
      },
      authorization,
    );
  }

  @Post('email/change/new-email-verify')
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Verify new email code' })
  @ApiResponse({
    status: 200,
    description: 'New email code verified successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async newEmailVerify(
    @Body() body: VerifyEmailCodeDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.newEmailVerify(
      { code: body.code },
      authorization,
    );
  }

  // ==================== SEARCH ENDPOINTS ====================

  @Get('search')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Search users by username or email' })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() query: SearchUserDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<UserDoc[]>> {
    return await this.usersService.searchUsers(query, authorization);
  }

  @Get('search/existing-username')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Check if username exists' })
  @ApiResponse({
    status: 200,
    description: 'Username existence checked successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid username' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async searchExistingUsername(
    @Query() query: SearchUsernameDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.checkUsernameExists(query, authorization);
  }

  @Get('search/existing-email')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Check if email exists' })
  @ApiResponse({
    status: 200,
    description: 'Email existence checked successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async searchExistingEmail(
    @Query() query: SearchEmailDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response<void>> {
    return await this.usersService.checkEmailExists(query, authorization);
  }
}
