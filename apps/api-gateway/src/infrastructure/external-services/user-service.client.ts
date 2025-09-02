import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';
import { AxiosRequestConfig } from 'axios';

// User Service Interfaces
export interface GetUserProfileRequest {
  user_id: string;
}

export interface UpdateUserDisplayNameRequest {
  user_id: string;
  display_name: string;
}

export interface UpdateUserBioRequest {
  user_id: string;
  bio: string;
}

export interface UpdateUserAvatarRequest {
  user_id: string;
  avatar_ipfs_hash: string;
  avatar_fallback_url: string;
}

export interface UpdateUserRoleRequest {
  user_id: string;
  role: string;
}

export interface ChangeUsernameInitiateRequest {
  user_id: string;
}

export interface VerifyUsernameCodeRequest {
  user_id: string;
  code: string;
}

export interface ChangeUsernameRequest {
  user_id: string;
  new_username: string;
  code: string;
}

export interface ChangeEmailInitiateRequest {
  user_id: string;
}

export interface VerifyEmailCodeRequest {
  user_id: string;
  code: string;
}

export interface NewEmailInitiateRequest {
  user_id: string;
  new_email: string;
  code: string;
}

export interface VerifyNewEmailCodeRequest {
  user_id: string;
  code: string;
}

export interface SearchUsersRequest {
  username_or_email?: string;
  page?: number;
  limit?: number;
  fields?: string[];
  sortBy?: string;
  sortOrder?: string;
}

export interface SearchUsernameRequest {
  username: string;
}

export interface SearchEmailRequest {
  email: string;
}

export interface UserDoc {
  _id: string;
  user_id?: string;
  email: string;
  username: string;
  role: string;
  display_name: string;
  bio: string;
  avatar_ipfs_hash: string;
  avatar_fallback_url: string;
  last_login: Date;
}

@Injectable()
export class UserServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
  ) {
    super(
      httpService,
      configService.get<string>('services.user.url') || 'http://localhost:4002',
    );
  }

  // Health Check
  async checkHealth(): Promise<Response<{ status: string }>> {
    return this.get<{ status: string }>('/users/healthz');
  }

  // ==================== PROFILE ENDPOINTS ====================

  /**
   * Get user profile by user ID
   */
  async getUserProfile(
    data: GetUserProfileRequest,
  ): Promise<Response<UserDoc>> {
    return this.get<UserDoc>(`/users/profile/${data.user_id}`);
  }

  /**
   * Get current user profile (requires authorization)
   */
  async getMyProfile(authorization: string): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get<UserDoc>('/users/profile/me', config);
  }

  /**
   * Update user display name
   */
  async updateUserDisplayName(
    data: UpdateUserDisplayNameRequest,
    authorization: string,
  ): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.put<UserDoc>('/users/profile/display-name', data, config);
  }

  /**
   * Update user bio
   */
  async updateUserBio(
    data: UpdateUserBioRequest,
    authorization: string,
  ): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.put<UserDoc>('/users/profile/bio', data, config);
  }

  /**
   * Update user avatar
   */
  async updateUserAvatar(
    data: UpdateUserAvatarRequest,
    authorization: string,
  ): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.put<UserDoc>('/users/profile/avatar', data, config);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    data: UpdateUserRoleRequest,
    authorization: string,
  ): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.put<UserDoc>('/users/profile/role', data, config);
  }

  // ==================== USERNAME ENDPOINTS ====================

  /**
   * Initiate username change process
   */
  async changeUsernameInitiate(
    data: ChangeUsernameInitiateRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/username/change/initiate', data, config);
  }

  /**
   * Verify username change email code
   */
  async changeUsernameVerifyEmail(
    data: VerifyUsernameCodeRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/username/change/verify-email', data, config);
  }

  /**
   * Complete username change
   */
  async changeUsername(
    data: ChangeUsernameRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/username/change/complete', data, config);
  }

  // ==================== EMAIL ENDPOINTS ====================

  /**
   * Initiate email change process
   */
  async changeEmailInitiate(
    data: ChangeEmailInitiateRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/email/change/initiate', data, config);
  }

  /**
   * Verify email change code
   */
  async changeEmailVerifyEmail(
    data: VerifyEmailCodeRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/email/change/verify-email', data, config);
  }

  /**
   * Initiate new email change
   */
  async newEmailInitiate(
    data: NewEmailInitiateRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>(
      '/users/email/change/new-email-initiate',
      data,
      config,
    );
  }

  /**
   * Verify new email code
   */
  async newEmailVerify(
    data: VerifyNewEmailCodeRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>(
      '/users/email/change/new-email-verify',
      data,
      config,
    );
  }

  // ==================== SEARCH ENDPOINTS ====================

  /**
   * Search users by username or email
   */
  async searchUsers(data: SearchUsersRequest): Promise<Response<UserDoc[]>> {
    const queryParams = new URLSearchParams();

    if (data.username_or_email) {
      queryParams.append('username_or_email', data.username_or_email);
    }
    if (data.page) {
      queryParams.append('page', data.page.toString());
    }
    if (data.limit) {
      queryParams.append('limit', data.limit.toString());
    }
    if (data.fields && data.fields.length > 0) {
      data.fields.forEach((field) => queryParams.append('fields', field));
    }
    if (data.sortBy) {
      queryParams.append('sortBy', data.sortBy);
    }
    if (data.sortOrder) {
      queryParams.append('sortOrder', data.sortOrder);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/users/search?${queryString}` : '/users/search';

    return this.get<UserDoc[]>(url);
  }

  /**
   * Search for existing username
   */
  async searchExistingUsername(
    data: SearchUsernameRequest,
  ): Promise<Response<void>> {
    return this.get<void>(
      `/users/search/existing-username?username=${data.username}`,
    );
  }

  /**
   * Search for existing email
   */
  async searchExistingEmail(data: SearchEmailRequest): Promise<Response<void>> {
    return this.get<void>(`/users/search/existing-email?email=${data.email}`);
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
