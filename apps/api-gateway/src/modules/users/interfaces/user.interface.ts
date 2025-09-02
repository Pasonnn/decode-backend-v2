export interface User {
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

export interface UserProfile {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_ipfs_hash: string;
  avatar_fallback_url: string;
}

export interface UserSearchResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
