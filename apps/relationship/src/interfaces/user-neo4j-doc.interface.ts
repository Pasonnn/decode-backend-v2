export type UserNeo4jDoc<T = unknown[]> = {
  _id: string;
  user_id: string;
  username: string;
  role: string;
  display_name: string;
  avatar_ipfs_hash: string;
  following_number: number;
  followers_number: number;
  following?: boolean;
  follower?: boolean;
  blocked?: boolean;
  blocked_by?: boolean;
  mutual_followers_number?: number;
  mutual_followers_list?: T;
};
