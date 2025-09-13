import { Types } from 'mongoose';

export type DeviceFingerprintDoc<SessionDoc = unknown> = {
  _id: string;
  user_id: Types.ObjectId;
  device?: string;
  browser?: string;
  fingerprint_hashed: string;
  is_trusted: boolean;
  sessions?: SessionDoc[];
};
