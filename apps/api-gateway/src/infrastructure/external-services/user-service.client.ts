import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { AxiosRequestConfig } from 'axios';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';

// User Service Interfaces
import {
  GetUserProfileRequest,
  UpdateUserDisplayNameRequest,
  UpdateUserBioRequest,
  UpdateUserAvatarRequest,
  UpdateUserRoleRequest,
  VerifyUsernameCodeRequest,
  ChangeUsernameRequest,
  VerifyEmailCodeRequest,
  NewEmailInitiateRequest,
  VerifyNewEmailCodeRequest,
  SearchUsersRequest,
  SearchUsernameRequest,
  SearchEmailRequest,
} from '../../interfaces/user-service.interface';
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
    authorization: string,
  ): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get<UserDoc>(`/users/profile/${data.user_id}`, config);
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
  async changeUsernameInitiate(authorization: string): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/username/change/initiate', {}, config);
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
  async changeEmailInitiate(authorization: string): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post<void>('/users/email/change/initiate', {}, config);
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
  async searchUsers(
    data: SearchUsersRequest,
    authorization: string,
  ): Promise<Response<UserDoc[]>> {
    const queryParams = new URLSearchParams();

    const config = {
      headers: {
        Authorization: authorization,
      },
    };

    if (data.email_or_username) {
      queryParams.append('email_or_username', data.email_or_username);
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

    return this.get<UserDoc[]>(url, config);
  }

  /**
   * Search for existing username
   */
  async searchExistingUsername(
    data: SearchUsernameRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get<void>(
      `/users/search/existing-username?username=${data.username}`,
      config,
    );
  }

  /**
   * Search for existing email
   */
  async searchExistingEmail(
    data: SearchEmailRequest,
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get<void>(
      `/users/search/existing-email?email=${data.email}`,
      config,
    );
  }

  // ==================== ACCOUNT MANAGEMENT ENDPOINTS ====================

  /**
   * Deactivate user account
   */
  async deactivateAccount(authorization: string): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    const data = {};
    return this.patch<UserDoc>('/users/account/deactivate', data, config);
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(authorization: string): Promise<Response<UserDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    const data = {};
    return this.patch<UserDoc>('/users/account/reactivate', data, config);
  }

  /**
   * Delete deactivated accounts (admin only)
   */
  async deleteDeactivatedAccounts(
    authorization: string,
  ): Promise<Response<void>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.delete<void>(
      '/users/account/delete-deactivated-accounts',
      config,
    );
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

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.patch<T>(url, data, config);
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Response<T>> {
    return super.delete<T>(url, config);
  }
}
