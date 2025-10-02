export type UserNeo4jDoc<T = unknown[]> = {
  _id: string;
  user_id: string;
  username: string;
  role: string;
  display_name: string;
  avatar_ipfs_hash: string;
  following_number: number;
  followers_number: number;
  is_following?: boolean;
  is_follower?: boolean;
  is_blocked?: boolean;
  is_blocked_by?: boolean;
  mutual_followers_number?: number;
  mutual_followers_list?: T;
  shared_interests_count?: number;
  shared_interests?: string[];
};
