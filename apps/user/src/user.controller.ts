import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './services/profile.service';
import { UsernameService } from './services/username.service';
import { SearchService } from './services/search.service';
import { EmailService } from './services/email.service';

// DTOs
import { GetUserProfileDto } from './dto/profile.dto';
import { UpdateUserDisplayNameDto } from './dto/profile.dto';
import { UpdateUserBioDto } from './dto/profile.dto';
import { UpdateUserAvatarDto } from './dto/profile.dto';
import { UpdateUserRoleDto } from './dto/profile.dto';
import { VerifyUsernameCodeDto, ChangeUsernameDto } from './dto/username.dto';
import { SearchUserDto, SearchUsernameDto, SearchEmailDto } from './dto/search.dto';
import { VerifyEmailCodeDto, ChangeEmailDto } from './dto/email.dto';

// Guards and Decorators
import { AuthGuard } from './common/guards/auth.guard';
import { Roles, UserRole } from './common/decorators/roles.decorator';
import { Public } from './common/decorators/public.decorator';

// Interfaces
import { Response } from './interfaces/response.interface';
import { UserDoc } from './interfaces/user-doc.interface';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './common/guards/auth.guard';
import { USER_CONSTANTS } from './constants/user.constants';

@ApiTags('User Management')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly usernameService: UsernameService,
    private readonly searchService: SearchService,
    private readonly emailService: EmailService,
  ) {}

  // ==================== PROFILE ENDPOINTS ====================
  @Get('profile/me')
  @UseGuards(AuthGuard)
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.getUserProfile({
      user_id: user.userId,
    });
  }

  @Get('profile/:user_id')
  @UseGuards(AuthGuard)
  async getUserProfile(
    @Param() params: GetUserProfileDto,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.getUserProfile({
      user_id: params.user_id,
    });
  }

  @Put('profile/display-name')
  @UseGuards(AuthGuard)
  async updateDisplayName(
    @Body() body: UpdateUserDisplayNameDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.updateUserDisplayName({
      user_id: user.userId,
      display_name: body.display_name,
    });
  }

  @Put('profile/bio')
  @UseGuards(AuthGuard)
  async updateBio(
    @Body() body: UpdateUserBioDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.updateUserBio({
      user_id: user.userId,
      bio: body.bio,
    });
  }

  @Put('profile/avatar')
  @UseGuards(AuthGuard)
  async updateAvatar(
    @Body() body: UpdateUserAvatarDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.updateUserAvatar({
      user_id: user.userId,
      avatar_ipfs_hash: body.avatar_ipfs_hash,
      avatar_fallback_url: body.avatar_fallback_url,
    });
  }

  @Put('profile/role')
  @Roles(USER_CONSTANTS.ROLES.ADMIN as UserRole)
  async updateRole(
    @Body() body: UpdateUserRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.updateUserRole({
      user_id: user.userId,
      role: body.role,
    });
  }

  // ==================== USERNAME ENDPOINTS ====================

  @Post('username/change/initiate')
  @UseGuards(AuthGuard)
  async changeUsernameInitiate(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.usernameService.changeUsernameInitiate({
      user_id: user.userId,
    });
  }

  @Post('username/change/verify-email')
  @UseGuards(AuthGuard)
  async changeUsernameVerifyEmail(
    @Body() body: VerifyUsernameCodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.usernameService.verifyUsernameCode({
      user_id: user.userId,
      code: body.code,
    });
  }

  @Post('username/change/complete')
  @UseGuards(AuthGuard)
  async changeUsername(
    @Body() body: ChangeUsernameDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.usernameService.changeUsername({
      user_id: user.userId,
      new_username: body.new_username,
      code: body.code,
    });
  }
  // ==================== EMAIL ENDPOINTS ====================

  @Post('email/change/initiate')
  @UseGuards(AuthGuard)
  async changeEmailInitiate(
    @Body() body: ChangeEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.emailService.changeEmailInitiate({
      user_id: user.userId,
      new_email: body.new_email,
    });
  }

  @Post('email/change/verify-email')
  @UseGuards(AuthGuard)
  async changeEmailVerifyEmail(
    @Body() body: VerifyEmailCodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.emailService.verifyEmailCode({
      user_id: user.userId,
      code: body.code,
    });
  }

  @Post('email/change/complete')
  @UseGuards(AuthGuard)
  async changeEmail(
    @Body() body: ChangeEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.emailService.changeEmail({
      user_id: user.userId,
      new_email: body.new_email,
      code: body.code,
    });
  }
  // ==================== SEARCH ENDPOINTS ====================

  @Get('search')
  @UseGuards(AuthGuard)
  async search(@Query() query: SearchUserDto): Promise<Response<UserDoc[]>> {
    return await this.searchService.searchUsers({
      username_or_email: query.username_or_email || '',
      page: query.page || USER_CONSTANTS.SEARCH.DEFAULT_PAGE,
      limit: query.limit || USER_CONSTANTS.SEARCH.DEFAULT_LIMIT,
      sortBy: query.sortBy || USER_CONSTANTS.SEARCH.SORT_FIELDS[0],
      sortOrder: query.sortOrder || USER_CONSTANTS.SEARCH.SORT_ORDERS[0],
    });
  }

}
