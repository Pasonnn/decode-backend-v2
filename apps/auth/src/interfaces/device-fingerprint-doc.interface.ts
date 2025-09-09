import { Types } from 'mongoose';

export type DeviceFingerprintDoc = {
  _id: string;
  user_id: Types.ObjectId;
  device?: string;
  browser?: string;
  app: string;
  fingerprint_hashed: string;
  is_trusted: boolean;
};
