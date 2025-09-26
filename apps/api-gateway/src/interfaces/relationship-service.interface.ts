// Request interfaces for relationship service

export interface GetUserRequest {
  user_id: string;
}

export interface FollowRequest {
  user_id_to: string;
}

export interface UnfollowRequest {
  user_id_to: string;
}

export interface RemoveFollowerRequest {
  user_id_to: string;
}

export interface GetFollowingRequest {
  page?: number;
  limit?: number;
}

export interface GetFollowersRequest {
  page?: number;
  limit?: number;
}

export interface GetFollowingByUserIdRequest {
  user_id: string;
  page?: number;
  limit?: number;
}

export interface GetFollowersByUserIdRequest {
  user_id: string;
  page?: number;
  limit?: number;
}

export interface BlockRequest {
  user_id_to: string;
}

export interface UnblockRequest {
  user_id_to: string;
}

export interface GetBlockedUsersRequest {
  page?: number;
  limit?: number;
}

export interface MutualRequest {
  user_id_to: string;
}

export interface SearchFollowersRequest {
  params?: string;
  page?: number;
  limit?: number;
}

export interface SearchFollowingRequest {
  params?: string;
  page?: number;
  limit?: number;
}

export interface GetSuggestionsRequest {
  page?: number;
  limit?: number;
}
