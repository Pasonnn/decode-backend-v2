import { Types } from "mongoose";

export type SessionDoc = {
    _id: string;
    user_id: Types.ObjectId;
    device_fingerprint_id: Types.ObjectId;
    session_token: string;
    access_token: string;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
    revoked_at: Date;
}