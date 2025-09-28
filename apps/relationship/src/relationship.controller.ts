import {
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

// Interface Import
import type { Response } from './interfaces/response.interface';
import { UserNeo4jDoc } from './interfaces/user-neo4j-doc.interface';

// DTOs
import {
  FollowDto,
  UnfollowDto,
  RemoveFollowerDto,
  GetFollowingDto,
  GetFollowingByUserIdDto,
  GetFollowersByUserIdDto,
  GetFollowersDto,
} from './dto/follow.dto';
import { GetUserDto } from './dto/user.dto';
import { BlockDto, UnblockDto, GetBlockedUsersDto } from './dto/block.dto';
import { MutualDto } from './dto/mutual.dto';
import { SearchFollowersDto, SearchFollowingDto } from './dto/search.dto';
import { GetSuggestionsPaginatedDto } from './dto/suggest.dto';

// Service Import
import { BlockService } from './services/block.service';
import { FollowService } from './services/follow.service';
import { MutualService } from './services/mutual.service';
import { SearchService } from './services/search.service';
import { SuggestService } from './services/suggest.service';
import { UserService } from './services/user.service';
import { FollowerSnapshotService } from './services/follower-snapshot.service';

// Guards and Decorators
import { CurrentUser } from './common/decorators/current-user.decorator';
import { AuthGuard, Public } from './common/guards/auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@ApiTags('Relationship Management')
@Controller('relationship')
@ApiBearerAuth()
export class RelationshipController {
  constructor(
    private readonly userService: UserService,
    private readonly followService: FollowService,
    private readonly blockService: BlockService,
    private readonly mutualService: MutualService,
    private readonly searchService: SearchService,
    private readonly suggestService: SuggestService,
    private readonly followerSnapshotService: FollowerSnapshotService,
  ) {}

  // ==================== USER ENDPOINTS ====================

  @Get('user/:user_id')
  @Public()
  async getUser(
    @Param() params: GetUserDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Response<UserNeo4jDoc>> {
    return await this.userService.getUser({
      user_id_from: user?.userId ?? '',
      user_id_to: params.user_id,
    });
  }

  // ==================== FOLLOW ENDPOINTS ====================

  @Post('follow/following')
  @UseGuards(AuthGuard)
  async follow(
    @Body() body: FollowDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.followService.followingUser({
      user_id_from: user.userId,
      user_id_to: body.user_id_to,
    });
  }

  @Delete('follow/unfollow/:user_id_to')
  @UseGuards(AuthGuard)
  async unfollow(
    @Param() params: UnfollowDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.followService.unfollowingUser({
      user_id_from: user.userId,
      user_id_to: params.user_id_to,
    });
  }

  @Delete('follow/remove-follower/:user_id_to')
  @UseGuards(AuthGuard)
  async removeFollower(
    @Param() params: RemoveFollowerDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.followService.removeFollower({
      user_id_from: user.userId,
      user_id_to: params.user_id_to,
    });
  }

  @Get('follow/followings/me')
  @UseGuards(AuthGuard)
  async getFollowing(
    @Query() query: GetFollowingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.followService.getFollowing({
      user_id: user.userId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('follow/followings')
  @UseGuards(AuthGuard)
  async getFollowingByUserId(
    @Query() query: GetFollowingByUserIdDto,
  ): Promise<Response> {
    return await this.followService.getFollowing({
      user_id: query.user_id,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('follow/followers/me')
  @UseGuards(AuthGuard)
  async getFollowers(
    @Query() query: GetFollowersDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.followService.getFollowers({
      user_id: user.userId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('follow/followers')
  @UseGuards(AuthGuard)
  async getFollowersByUserId(
    @Query() query: GetFollowersByUserIdDto,
  ): Promise<Response> {
    return await this.followService.getFollowers({
      user_id: query.user_id,
      page: query.page,
      limit: query.limit,
    });
  }

  // Add two more endpoints to view following and followers of other users

  // ==================== BLOCK ENDPOINTS ====================

  @Post('block/blocking')
  @UseGuards(AuthGuard)
  async block(
    @Body() body: BlockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.blockService.blockUser({
      user_id_from: user.userId,
      user_id_to: body.user_id_to,
    });
  }

  @Delete('block/unblocking/:user_id_to')
  @UseGuards(AuthGuard)
  async unblock(
    @Param() params: UnblockDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.blockService.unblockUser({
      user_id_from: user.userId,
      user_id_to: params.user_id_to,
    });
  }

  @Get('block/blocked')
  @UseGuards(AuthGuard)
  async getBlocked(
    @Query() query: GetBlockedUsersDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.blockService.getBlockedUsers({
      user_id: user.userId,
      page: query.page,
      limit: query.limit,
    });
  }

  // ==================== MUTUAL ENDPOINTS ====================

  @Get('mutual/followers/:user_id_to')
  @UseGuards(AuthGuard)
  async mutual(
    @Param() params: MutualDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.mutualService.getMutualFollowers({
      user_id_from: user.userId,
      user_id_to: params.user_id_to,
    });
  }

  // ==================== SEARCH ENDPOINTS ====================

  @Get('search/followers')
  @UseGuards(AuthGuard)
  async searchFollowers(
    @Query() query: SearchFollowersDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.searchService.searchFollowers({
      user_id: user.userId,
      params: query.params,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('search/followings')
  @UseGuards(AuthGuard)
  async searchFollowing(
    @Query() query: SearchFollowingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.searchService.searchFollowing({
      user_id: user.userId,
      params: query.params,
      page: query.page,
      limit: query.limit,
    });
  }

  // ==================== SUGGEST ENDPOINTS ====================

  @Get('suggest')
  @UseGuards(AuthGuard)
  async getSuggestions(
    @Query() query: GetSuggestionsPaginatedDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return await this.suggestService.getSuggestionsPaginated({
      user_id: user.userId,
      page: query.page,
      limit: query.limit,
    });
  }

  // ==================== FOLLOWER SNAPSHOT ENDPOINTS ====================

  @Post('snapshot/trigger')
  @UseGuards(AuthGuard)
  async triggerSnapshot(): Promise<Response> {
    const result = await this.followerSnapshotService.triggerManualSnapshot();
    return {
      success: result.success,
      statusCode: result.success ? 200 : 500,
      message: result.message,
    };
  }

  @Get('snapshot/last-month/:user_id')
  @UseGuards(AuthGuard)
  async getFollowersSnapshotLastMonth(
    @Param('user_id') user_id: string,
  ): Promise<Response> {
    return await this.followerSnapshotService.getFollowersSnapshotDataLastMonth(
      {
        user_id,
      },
    );
  }
}
