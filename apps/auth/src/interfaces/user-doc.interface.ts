import { Types } from 'mongoose';

export type UserDoc = {
  _id: string;
  user_id?: string;
  email: string;
  username: string;
  password_hashed: string;
  role: string;
};
