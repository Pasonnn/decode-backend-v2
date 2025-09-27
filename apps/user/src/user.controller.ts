import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './services/profile.service';
import { UsernameService } from './services/username.service';
import { SearchService } from './services/search.service';
import { EmailService } from './services/email.service';
import { DeactivateService } from './services/deactivate.service';
// DTOs
import { GetUserProfileDto } from './dto/profile.dto';
import { UpdateUserDisplayNameDto } from './dto/profile.dto';
import { UpdateUserBioDto } from './dto/profile.dto';
import { UpdateUserAvatarDto } from './dto/profile.dto';
import { UpdateUserRoleDto } from './dto/profile.dto';
import { VerifyUsernameCodeDto, ChangeUsernameDto } from './dto/username.dto';
import {
  SearchUserDto,
  SearchUsernameDto,
  SearchEmailDto,
} from './dto/search.dto';
import { VerifyEmailCodeDto, ChangeEmailDto } from './dto/email.dto';
import {
  CheckUserExistsByEmailOrUsernameDto,
  CreateUserDto,
  ChangePasswordDto,
  GetInfoByEmailOrUsernameDto,
  GetInfoByUserIdDto,
  GetInfoWithPasswordByUserEmailOrUsernameDto,
  UpdateUserLastLoginDto,
  GetInfoWithPasswordByUserIdDto,
} from './dto/user-services-response.dto';

// Guards and Decorators
import { AuthGuard } from './common/guards/auth.guard';
import { Roles, UserRole } from './common/decorators/roles.decorator';
import { AuthServiceGuard } from './common/guards/service.guard';

// Interfaces
import { Response } from './interfaces/response.interface';
import { UserDoc } from './interfaces/user-doc.interface';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { USER_CONSTANTS } from './constants/user.constants';
import { ServicesResponseService } from './services/services-response.service';

@ApiTags('User Management')
@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly usernameService: UsernameService,
    private readonly searchService: SearchService,
    private readonly emailService: EmailService,
    private readonly servicesResponseService: ServicesResponseService,
    private readonly deactivateService: DeactivateService,
  ) {}

  // ==================== PROFILE ENDPOINTS ====================
  @Get('profile/me')
  @UseGuards(AuthGuard)
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.getMyProfile({
      user_id: user.userId,
    });
  }

  @Get('profile/:user_id')
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
    });
  }

  @Put('profile/role')
  @Roles(USER_CONSTANTS.ROLES.ADMIN as UserRole)
  async updateRole(
    @Body() body: UpdateUserRoleDto,
  ): Promise<Response<UserDoc>> {
    return await this.profileService.updateUserRole({
      user_id: body.user_id,
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.emailService.changeEmailInitiate({
      user_id: user.userId,
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

  @Post('email/change/new-email-initiate')
  @UseGuards(AuthGuard)
  async newEmailInitiate(
    @Body() body: ChangeEmailDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.emailService.newEmailInitiate({
      user_id: user.userId,
      new_email: body.new_email,
      code: body.code,
    });
  }

  @Post('email/change/new-email-verify')
  @UseGuards(AuthGuard)
  async newEmailVerify(
    @Body() body: VerifyEmailCodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<void>> {
    return await this.emailService.verifyNewEmailCode({
      user_id: user.userId,
      code: body.code,
    });
  }
  // ==================== SEARCH ENDPOINTS ====================

  @Get('search')
  @UseGuards(AuthGuard)
  async search(@Query() query: SearchUserDto): Promise<Response<UserDoc[]>> {
    return await this.searchService.searchUsers({
      email_or_username: query.email_or_username || '',
      page: query.page || USER_CONSTANTS.SEARCH.DEFAULT_PAGE,
      limit: query.limit || USER_CONSTANTS.SEARCH.DEFAULT_LIMIT,
      sortBy: query.sortBy || USER_CONSTANTS.SEARCH.SORT_FIELDS[0],
      sortOrder: query.sortOrder || USER_CONSTANTS.SEARCH.SORT_ORDERS[0],
    });
  }

  @Get('search/existing-username')
  @UseGuards(AuthGuard)
  async searchExistingUsername(
    @Query() query: SearchUsernameDto,
  ): Promise<Response<void>> {
    return await this.searchService.searchExistingUsername({
      username: query.username,
    });
  }

  @Get('search/existing-email')
  @UseGuards(AuthGuard)
  async searchExistingEmail(
    @Query() query: SearchEmailDto,
  ): Promise<Response<void>> {
    return await this.searchService.searchExistingEmail({
      email: query.email,
    });
  }

  // ==================== SERVICES RESPONSE ENDPOINTS ====================
  @UseGuards(AuthServiceGuard)
  @Get('services/user/check-user-exists')
  async checkUserExistsByEmailOrUsername(
    @Query() query: CheckUserExistsByEmailOrUsernameDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.checkUserExistsByEmailOrUsername({
      email_or_username: query.email_or_username,
    });
  }

  @UseGuards(AuthServiceGuard)
  @Post('services/user/create-user')
  async createUser(@Body() body: CreateUserDto): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.createUser({
      email: body.email,
      username: body.username,
      password_hashed: body.password_hashed,
    });
  }

  @UseGuards(AuthServiceGuard)
  @Put('services/user/change-password')
  async changePassword(
    @Body() body: ChangePasswordDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.changePassword({
      user_id: body.user_id,
      password_hashed: body.password_hashed,
    });
  }

  @UseGuards(AuthServiceGuard)
  @Get('services/user/get-info-by-email-or-username')
  async getInfoByEmailOrUsername(
    @Query() query: GetInfoByEmailOrUsernameDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.getInfoByEmailOrUsername({
      email_or_username: query.email_or_username,
    });
  }

  @UseGuards(AuthServiceGuard)
  @Get('services/user/get-info-by-user-id')
  async getInfoByUserId(
    @Query() query: GetInfoByUserIdDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.getInfoByUserId({
      user_id: query.user_id,
    });
  }

  @UseGuards(AuthServiceGuard)
  @Get('services/user/get-info-with-password-by-user-email-or-username')
  async getInfoWithPasswordByUserEmailOrUsername(
    @Query() query: GetInfoWithPasswordByUserEmailOrUsernameDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.getInfoWithPasswordByUserEmailOrUsername(
      {
        email_or_username: query.email_or_username,
      },
    );
  }

  @UseGuards(AuthServiceGuard)
  @Get('services/user/get-info-with-password-by-user-id')
  async getInfoWithPasswordByUserId(
    @Query() query: GetInfoWithPasswordByUserIdDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.getInfoWithPasswordByUserId({
      user_id: query.user_id,
    });
  }

  @UseGuards(AuthServiceGuard)
  @Put('services/user/update-user-last-login')
  async updateUserLastLogin(
    @Body() body: UpdateUserLastLoginDto,
  ): Promise<Response<UserDoc>> {
    return await this.servicesResponseService.updateUserLastLogin({
      user_id: body.user_id,
    });
  }

  // ==================== ACCOUNT MANAGEMENT ENDPOINTS ====================
  @UseGuards(AuthGuard)
  @Patch('account/deactivate')
  async deactivateAccount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.deactivateService.deactivateAccount({
      user_id: user.userId,
    });
  }

  @UseGuards(AuthGuard)
  @Patch('account/reactivate')
  async reactivateAccount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response<UserDoc>> {
    return await this.deactivateService.reactivateAccount({
      user_id: user.userId,
    });
  }

  @Roles(USER_CONSTANTS.ROLES.ADMIN as UserRole)
  @UseGuards(AuthGuard)
  @Delete('account/delete-deactivated-accounts')
  async deleteDeactivatedAccounts(): Promise<Response<void>> {
    return await this.deactivateService.deleteDeactivatedAccounts();
  }
}
