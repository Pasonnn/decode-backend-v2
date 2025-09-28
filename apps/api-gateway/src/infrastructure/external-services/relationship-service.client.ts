import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { AxiosRequestConfig } from 'axios';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';
import { UserRelationshipDoc } from '../../interfaces/user-relationship-doc.interface';

// Relationship Service Interfaces
import {
  GetUserRequest,
  FollowRequest,
  UnfollowRequest,
  RemoveFollowerRequest,
  GetFollowingRequest,
  GetFollowersRequest,
  BlockRequest,
  UnblockRequest,
  GetBlockedUsersRequest,
  MutualRequest,
  SearchFollowersRequest,
  SearchFollowingRequest,
  GetSuggestionsRequest,
  GetFollowingByUserIdRequest,
  GetFollowersByUserIdRequest,
} from '../../interfaces/relationship-service.interface';

@Injectable()
export class RelationshipServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
  ) {
    super(
      httpService,
      configService.get<string>('services.relationship.url') ||
        'http://localhost:4004',
    );
  }

  // Health Check
  async checkHealth(): Promise<Response<{ status: string }>> {
    return this.get<{ status: string }>('/relationship/healthz');
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Get user relationship information
   */
  async getUser(
    data: GetUserRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(`/relationship/user/${data.user_id}`, config);
  }

  // ==================== FOLLOW ENDPOINTS ====================

  /**
   * Follow a user
   */
  async follow(
    data: FollowRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/relationship/follow/following', data, config);
  }

  /**
   * Unfollow a user
   */
  async unfollow(
    data: UnfollowRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.delete(
      `/relationship/follow/unfollow/${data.user_id_to}`,
      config,
    );
  }

  /**
   * Remove a follower
   */
  async removeFollower(
    data: RemoveFollowerRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.delete(
      `/relationship/follow/remove-follower/${data.user_id_to}`,
      config,
    );
  }

  /**
   * Get following list
   */
  async getFollowing(
    data: GetFollowingRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/relationship/follow/followings/me?${queryString}`
      : '/relationship/follow/followings/me';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  /**
   * Get following list by user ID
   */
  async getFollowingByUserId(
    data: GetFollowingByUserIdRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }
    queryParams.append('user_id', data.user_id);

    const queryString = queryParams.toString();
    const url = `/relationship/follow/followings?${queryString}`;

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  /**
   * Get followers list
   */
  async getFollowers(
    data: GetFollowersRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/relationship/follow/followers/me?${queryString}`
      : '/relationship/follow/followers/me';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  /**
   * Get following list by user ID
   */
  async getFollowersByUserId(
    data: GetFollowersByUserIdRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }
    queryParams.append('user_id', data.user_id);

    const queryString = queryParams.toString();
    const url = `/relationship/follow/followers?${queryString}`;

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  // ==================== BLOCK ENDPOINTS ====================

  /**
   * Block a user
   */
  async block(
    data: BlockRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/relationship/block/blocking', data, config);
  }

  /**
   * Unblock a user
   */
  async unblock(
    data: UnblockRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.delete(
      `/relationship/block/unblocking/${data.user_id_to}`,
      config,
    );
  }

  /**
   * Get blocked users list
   */
  async getBlockedUsers(
    data: GetBlockedUsersRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/relationship/block/blocked?${queryString}`
      : '/relationship/block/blocked';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  // ==================== MUTUAL ENDPOINTS ====================

  /**
   * Get mutual followers
   */
  async getMutualFollowers(
    data: MutualRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(
      `/relationship/mutual/followers/${data.user_id_to}`,
      config,
    );
  }

  // ==================== SEARCH ENDPOINTS ====================

  /**
   * Search followers
   */
  async searchFollowers(
    data: SearchFollowersRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.params) {
      queryParams.append('params', data.params);
    }
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/relationship/search/followers?${queryString}`
      : '/relationship/search/followers';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  /**
   * Search following
   */
  async searchFollowing(
    data: SearchFollowingRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.params) {
      queryParams.append('params', data.params);
    }
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/relationship/search/followings?${queryString}`
      : '/relationship/search/followings';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  // ==================== SUGGEST ENDPOINTS ====================

  /**
   * Get user suggestions
   */
  async getSuggestions(
    data: GetSuggestionsRequest,
    authorization: string,
  ): Promise<Response<UserRelationshipDoc[]>> {
    const queryParams = new URLSearchParams();
    if (data.page !== undefined) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit !== undefined) {
      queryParams.append('limit', data.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `/relationship/suggest?${queryString}`
      : '/relationship/suggest';

    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(url, config);
  }

  // ==================== SNAPSHOT ENDPOINTS ====================

  /**
   * Trigger manual follower snapshot
   */
  async triggerSnapshot(
    authorization: string,
  ): Promise<Response<{ success: boolean; message: string }>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/relationship/snapshot/trigger', {}, config);
  }

  /**
   * Get followers snapshot data for the last month
   */
  async getFollowersSnapshotLastMonth(
    user_id: string,
    authorization: string,
  ): Promise<Response<any[]>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(`/relationship/snapshot/last-month/${user_id}`, config);
  }

  // Generic HTTP methods for flexibility
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.post<T>(url, data, config);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<Response<T>> {
    return super.get<T>(url, config);
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.put<T>(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.delete<T>(url, config);
  }
}
