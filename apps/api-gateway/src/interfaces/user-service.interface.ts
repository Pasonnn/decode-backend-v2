export interface GetUserProfileRequest {
  user_id: string;
}

export interface UpdateUserDisplayNameRequest {
  display_name: string;
}

export interface UpdateUserBioRequest {
  bio: string;
}

export interface UpdateUserAvatarRequest {
  avatar_ipfs_hash: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}
export interface VerifyUsernameCodeRequest {
  code: string;
}

export interface ChangeUsernameRequest {
  new_username: string;
  code: string;
}

export interface VerifyEmailCodeRequest {
  code: string;
}

export interface NewEmailInitiateRequest {
  new_email: string;
  code: string;
}

export interface VerifyNewEmailCodeRequest {
  code: string;
}

export interface SearchUsersRequest {
  email_or_username?: string;
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
