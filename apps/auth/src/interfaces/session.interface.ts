import { Types } from "mongoose";

export type SessionDoc = {
    _id: string;
    user_id: Types.ObjectId;
    device_fingerprint_id: Types.ObjectId;
    token: string;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}