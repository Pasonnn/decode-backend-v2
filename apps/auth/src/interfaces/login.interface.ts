import { Types } from "mongoose";

export type UserDoc = {
    _id: string;
    email: string;
    username: string;
    password_hashed: string;
}

export type DeviceFingerprintDoc = {
    _id: string;
    user_id: Types.ObjectId;
    fingerprint_hashed: string;
    is_trusted: boolean;
}

