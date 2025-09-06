import { Types } from 'mongoose';

export type WalletDoc = {
  _id: string;
  user_id: Types.ObjectId;
  address: string;
  name_service: string;
  is_primary: boolean;
};
