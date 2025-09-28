import { Injectable, Logger } from '@nestjs/common';
import { RelationshipServiceClient } from '../../infrastructure/external-services/relationship-service.client';
import { Response } from '../../interfaces/response.interface';

// DTOs
import {
  GetUserDto,
  FollowDto,
  UnfollowDto,
  RemoveFollowerDto,
  GetFollowingDto,
  GetFollowersDto,
  BlockDto,
  UnblockDto,
  GetBlockedUsersDto,
  MutualDto,
  SearchFollowersDto,
  SearchFollowingDto,
  GetSuggestionsDto,
  GetFollowingByUserIdDto,
  GetFollowersByUserIdDto,
  GetFollowersSnapshotLastMonthDto,
} from './dto';

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  constructor(
    private readonly relationshipServiceClient: RelationshipServiceClient,
  ) {}

  // ==================== HEALTH CHECK ====================

  async checkHealth(): Promise<Response> {
    this.logger.log('Checking relationship service health');
    return this.relationshipServiceClient.checkHealth();
  }

  // ==================== USER ENDPOINTS ====================

  async getUser(data: GetUserDto, authorization: string): Promise<Response> {
    this.logger.log(`Getting user relationship info for user: ${data.user_id}`);
    return this.relationshipServiceClient.getUser(data, authorization);
  }

  // ==================== FOLLOW ENDPOINTS ====================

  async follow(data: FollowDto, authorization: string): Promise<Response> {
    this.logger.log(`Following user: ${data.user_id_to}`);
    return this.relationshipServiceClient.follow(data, authorization);
  }

  async unfollow(data: UnfollowDto, authorization: string): Promise<Response> {
    this.logger.log(`Unfollowing user: ${data.user_id_to}`);
    return this.relationshipServiceClient.unfollow(data, authorization);
  }

  async removeFollower(
    data: RemoveFollowerDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Removing follower: ${data.user_id_to}`);
    return this.relationshipServiceClient.removeFollower(data, authorization);
  }

  async getFollowing(
    data: GetFollowingDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(
      `Getting following list - page: ${data.page}, limit: ${data.limit}`,
    );
    return this.relationshipServiceClient.getFollowing(data, authorization);
  }

  async getFollowingByUserId(
    data: GetFollowingByUserIdDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Getting following list by user ID: ${data.user_id}`);
    return this.relationshipServiceClient.getFollowingByUserId(
      data,
      authorization,
    );
  }

  async getFollowers(
    data: GetFollowersDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(
      `Getting followers list - page: ${data.page}, limit: ${data.limit}`,
    );
    return this.relationshipServiceClient.getFollowers(data, authorization);
  }

  async getFollowersByUserId(
    data: GetFollowersByUserIdDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Getting followers list by user ID: ${data.user_id}`);
    return this.relationshipServiceClient.getFollowersByUserId(
      data,
      authorization,
    );
  }

  // ==================== BLOCK ENDPOINTS ====================

  async block(data: BlockDto, authorization: string): Promise<Response> {
    this.logger.log(`Blocking user: ${data.user_id_to}`);
    return this.relationshipServiceClient.block(data, authorization);
  }

  async unblock(data: UnblockDto, authorization: string): Promise<Response> {
    this.logger.log(`Unblocking user: ${data.user_id_to}`);
    return this.relationshipServiceClient.unblock(data, authorization);
  }

  async getBlockedUsers(
    data: GetBlockedUsersDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(
      `Getting blocked users list - page: ${data.page}, limit: ${data.limit}`,
    );
    return this.relationshipServiceClient.getBlockedUsers(data, authorization);
  }

  // ==================== MUTUAL ENDPOINTS ====================

  async getMutualFollowers(
    data: MutualDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Getting mutual followers with user: ${data.user_id_to}`);
    return this.relationshipServiceClient.getMutualFollowers(
      data,
      authorization,
    );
  }

  // ==================== SEARCH ENDPOINTS ====================

  async searchFollowers(
    data: SearchFollowersDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Searching followers with params: ${data.params}`);
    return this.relationshipServiceClient.searchFollowers(data, authorization);
  }

  async searchFollowing(
    data: SearchFollowingDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(`Searching following with params: ${data.params}`);
    return this.relationshipServiceClient.searchFollowing(data, authorization);
  }

  // ==================== SUGGEST ENDPOINTS ====================

  async getSuggestions(
    data: GetSuggestionsDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(
      `Getting user suggestions - page: ${data.page}, limit: ${data.limit}`,
    );
    return this.relationshipServiceClient.getSuggestions(data, authorization);
  }

  // ==================== SNAPSHOT ENDPOINTS ====================

  async triggerSnapshot(authorization: string): Promise<Response> {
    this.logger.log('Triggering manual follower snapshot');
    return this.relationshipServiceClient.triggerSnapshot(authorization);
  }

  async getFollowersSnapshotLastMonth(
    data: GetFollowersSnapshotLastMonthDto,
    authorization: string,
  ): Promise<Response> {
    this.logger.log(
      `Getting followers snapshot data for last month - user: ${data.user_id}`,
    );
    return this.relationshipServiceClient.getFollowersSnapshotLastMonth(
      data.user_id,
      authorization,
    );
  }
}
