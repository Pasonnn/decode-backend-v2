export type UserDoc = {
  _id: string;
  user_id?: string;
  email: string;
  username: string;
  password_hashed: string;
  role: string;
  display_name: string;
  bio: string;
  avatar_ipfs_hash: string;
  last_login: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
