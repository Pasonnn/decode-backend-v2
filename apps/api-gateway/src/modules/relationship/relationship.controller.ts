import {
  Controller,
  Get,
  Post,
  Delete,
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
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';

// Services
import { RelationshipService } from './relationship.service';

// DTOs
import {
  GetUserDto,
  FollowDto,
  UnfollowDto,
  RemoveFollowerDto,
  GetFollowingDto,
  GetFollowingByUserIdDto,
  GetFollowersDto,
  GetFollowersByUserIdDto,
  BlockDto,
  UnblockDto,
  GetBlockedUsersDto,
  MutualDto,
  SearchFollowersDto,
  SearchFollowingDto,
  GetSuggestionsDto,
  GetFollowersSnapshotLastMonthDto,
  CreateUserInterestsDto,
  GetInterestSuggestUserPaginatedDto,
} from './dto';

// Guards and Decorators
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import {
  IPRateLimit,
  UserRateLimit,
} from '../../common/decorators/rate-limit.decorator';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

// Interfaces
import type { Response } from '../../interfaces/response.interface';

@ApiTags('Relationship Management')
@Controller('relationship')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(
  GetUserDto,
  FollowDto,
  UnfollowDto,
  RemoveFollowerDto,
  GetFollowingDto,
  GetFollowingByUserIdDto,
  GetFollowersDto,
  GetFollowersByUserIdDto,
  BlockDto,
  UnblockDto,
  GetBlockedUsersDto,
  MutualDto,
  SearchFollowersDto,
  SearchFollowingDto,
  GetSuggestionsDto,
  GetFollowersSnapshotLastMonthDto,
  CreateUserInterestsDto,
  GetInterestSuggestUserPaginatedDto,
)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  // ==================== HEALTH CHECK ====================

  @ApiOperation({
    summary: 'Health check',
    description: 'Check the health status of the relationship service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Relationship service is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
        },
        requestId: { type: 'string', example: 'req-123' },
      },
    },
  })
  @Get('healthz')
  @HttpCode(HttpStatus.OK)
  async checkHealth(): Promise<Response> {
    return this.relationshipService.checkHealth();
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealthDocker(): Promise<Response> {
    return this.relationshipService.checkHealth();
  }

  // ==================== USER ENDPOINTS ====================

  @ApiOperation({
    summary: 'Get user relationship information',
    description: 'Get relationship information for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User relationship information retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('user/:user_id')
  @IPRateLimit.standard()
  @HttpCode(HttpStatus.OK)
  async getUser(
    @Param() params: GetUserDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getUser(params, authorization);
  }

  // ==================== FOLLOW ENDPOINTS ====================

  @ApiOperation({
    summary: 'Follow a user',
    description: 'Follow another user',
  })
  @ApiBody({
    type: FollowDto,
    description: 'User to follow',
    examples: {
      example1: {
        summary: 'Follow user',
        value: {
          user_id_to: 'user123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User followed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or already following',
  })
  @Post('follow/following')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async follow(
    @Body() followDto: FollowDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.follow(followDto, authorization);
  }

  @ApiOperation({
    summary: 'Unfollow a user',
    description: 'Unfollow a user you are currently following',
  })
  @ApiResponse({
    status: 200,
    description: 'User unfollowed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or not following',
  })
  @Delete('follow/unfollow/:user_id_to')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param() params: UnfollowDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.unfollow(params, authorization);
  }

  @ApiOperation({
    summary: 'Remove a follower',
    description: 'Remove a user from your followers list',
  })
  @ApiResponse({
    status: 200,
    description: 'Follower removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or user is not a follower',
  })
  @Delete('follow/remove-follower/:user_id_to')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async removeFollower(
    @Param() params: RemoveFollowerDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.removeFollower(params, authorization);
  }

  @ApiOperation({
    summary: 'Get following list',
    description: 'Get list of users you are following',
  })
  @ApiResponse({
    status: 200,
    description: 'Following list retrieved successfully',
  })
  @Get('follow/followings/me')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getFollowing(
    @Query() query: GetFollowingDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getFollowing(query, authorization);
  }

  @ApiOperation({
    summary: 'Get following list by user ID',
    description: 'Get list of users a specific user is following',
  })
  @ApiResponse({
    status: 200,
    description: 'Following list retrieved successfully',
  })
  @Get('follow/followings')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getFollowingByUserId(
    @Query() query: GetFollowingByUserIdDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getFollowingByUserId(query, authorization);
  }

  @ApiOperation({
    summary: 'Get followers list',
    description: 'Get list of users following you',
  })
  @ApiResponse({
    status: 200,
    description: 'Followers list retrieved successfully',
  })
  @Get('follow/followers/me')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getFollowers(
    @Query() query: GetFollowersDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getFollowers(query, authorization);
  }

  @ApiOperation({
    summary: 'Get followers list by user ID',
    description: 'Get list of users a specific user is following',
  })
  @ApiResponse({
    status: 200,
    description: 'Followers list retrieved successfully',
  })
  @Get('follow/followers')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getFollowersByUserId(
    @Query() query: GetFollowersByUserIdDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getFollowersByUserId(query, authorization);
  }

  // ==================== BLOCK ENDPOINTS ====================

  @ApiOperation({
    summary: 'Block a user',
    description: 'Block another user',
  })
  @ApiBody({
    type: BlockDto,
    description: 'User to block',
    examples: {
      example1: {
        summary: 'Block user',
        value: {
          user_id_to: 'user123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User blocked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or already blocked',
  })
  @Post('block/blocking')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async block(
    @Body() blockDto: BlockDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.block(blockDto, authorization);
  }

  @ApiOperation({
    summary: 'Unblock a user',
    description: 'Unblock a user you have blocked',
  })
  @ApiResponse({
    status: 200,
    description: 'User unblocked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or user is not blocked',
  })
  @Delete('block/unblocking/:user_id_to')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async unblock(
    @Param() params: UnblockDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.unblock(params, authorization);
  }

  @ApiOperation({
    summary: 'Get blocked users list',
    description: 'Get list of users you have blocked',
  })
  @ApiResponse({
    status: 200,
    description: 'Blocked users list retrieved successfully',
  })
  @Get('block/blocked')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getBlockedUsers(
    @Query() query: GetBlockedUsersDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getBlockedUsers(query, authorization);
  }

  // ==================== MUTUAL ENDPOINTS ====================

  @ApiOperation({
    summary: 'Get mutual followers',
    description: 'Get list of mutual followers with another user',
  })
  @ApiResponse({
    status: 200,
    description: 'Mutual followers retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('mutual/followers/:user_id_to')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getMutualFollowers(
    @Param() params: MutualDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getMutualFollowers(params, authorization);
  }

  // ==================== SEARCH ENDPOINTS ====================

  @ApiOperation({
    summary: 'Search followers',
    description: 'Search through your followers list',
  })
  @ApiResponse({
    status: 200,
    description: 'Followers search results retrieved successfully',
  })
  @Get('search/followers')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async searchFollowers(
    @Query() query: SearchFollowersDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.searchFollowers(query, authorization);
  }

  @ApiOperation({
    summary: 'Search following',
    description: 'Search through your following list',
  })
  @ApiResponse({
    status: 200,
    description: 'Following search results retrieved successfully',
  })
  @Get('search/followings')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async searchFollowing(
    @Query() query: SearchFollowingDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.searchFollowing(query, authorization);
  }

  // ==================== SUGGEST ENDPOINTS ====================

  @ApiOperation({
    summary: 'Get user suggestions',
    description: 'Get suggested users to follow',
  })
  @ApiResponse({
    status: 200,
    description: 'User suggestions retrieved successfully',
  })
  @Get('suggest')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getSuggestions(
    @Query() query: GetSuggestionsDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getSuggestions(query, authorization);
  }

  // ==================== INTEREST ENDPOINTS ====================

  @ApiOperation({
    summary: 'Create user interests',
    description: 'Create or update user interests',
  })
  @ApiBody({
    type: CreateUserInterestsDto,
    description: 'User interests to create',
    examples: {
      example1: {
        summary: 'Create user interests',
        value: {
          interest: ['sport', 'movies', 'travel'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User interests created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or invalid interest values',
  })
  @Post('interest/create')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async createUserInterests(
    @Body() createUserInterestsDto: CreateUserInterestsDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.createUserInterests(
      createUserInterestsDto,
      authorization,
    );
  }

  @ApiOperation({
    summary: 'Get user interests',
    description: 'Get list of user interests',
  })
  @ApiResponse({
    status: 200,
    description: 'User interests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'User interests fetched successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Sport' },
              category: { type: 'string', example: 'lifestyle' },
              key: { type: 'string', example: 'sport' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User interests not found',
  })
  @Get('interest/list')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getUserInterests(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getUserInterests(authorization);
  }

  @ApiOperation({
    summary: 'Get interest-based user suggestions',
    description: 'Get user suggestions based on shared interests',
  })
  @ApiResponse({
    status: 200,
    description: 'Interest-based user suggestions retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid pagination parameters',
  })
  @Get('interest/suggest-user')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  async getInterestSuggestUser(
    @Query() query: GetInterestSuggestUserPaginatedDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getInterestSuggestUser(
      query,
      authorization,
    );
  }

  // ==================== SNAPSHOT ENDPOINTS ====================

  @ApiOperation({
    summary: 'Trigger manual follower snapshot',
    description: 'Manually trigger the follower snapshot process for all users',
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshot triggered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Manual follower snapshot completed successfully',
        },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: 'Manual follower snapshot completed successfully',
            },
          },
        },
        requestId: { type: 'string', example: 'req-123' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to trigger snapshot',
  })
  @Post('snapshot/trigger')
  @UserRateLimit.standard()
  @UseGuards(AuthGuardWithFingerprint)
  @HttpCode(HttpStatus.OK)
  @Roles('admin' as UserRole)
  async triggerSnapshot(
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.triggerSnapshot(authorization);
  }

  @ApiOperation({
    summary: 'Get followers snapshot data for last month',
    description:
      'Get historical followers snapshot data for a specific user from the last month',
  })
  @ApiResponse({
    status: 200,
    description: 'Followers snapshot data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Followers snapshot data last month fetched successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              user_id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              followers: { type: 'array', items: { type: 'string' } },
              followers_number: { type: 'number', example: 150 },
              snapshot_at: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        requestId: { type: 'string', example: 'req-123' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to retrieve snapshot data',
  })
  @Get('snapshot/last-month/:user_id')
  @IPRateLimit.standard()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getFollowersSnapshotLastMonth(
    @Param() params: GetFollowersSnapshotLastMonthDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return this.relationshipService.getFollowersSnapshotLastMonth(
      params,
      authorization,
    );
  }
}
