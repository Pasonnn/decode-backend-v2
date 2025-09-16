export type UserDoc = {
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
};
