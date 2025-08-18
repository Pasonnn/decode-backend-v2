import { Types } from "mongoose";

export type DeviceFingerprintDoc = {
    _id: string;
    user_id: Types.ObjectId;
    fingerprint_hashed: string;
    is_trusted: boolean;
}