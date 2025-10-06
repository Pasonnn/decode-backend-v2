import { WalletDoc } from './wallet-doc.interface';

export interface UserDoc {
  _id: string;
  user_id?: string;
  email: string;
  username: string;
  role: string;
  display_name: string;
  bio: string;
  avatar_ipfs_hash: string;
  last_login: Date;
  primary_wallet?: WalletDoc;
  wallets?: WalletDoc[];
  following_number?: number;
  followers_number?: number;
  is_following?: boolean;
  is_follower?: boolean;
  is_blocked?: boolean;
  is_blocked_by?: boolean;
  mutual_followers_number?: number;
  mutual_followers_list?: string[];
}
