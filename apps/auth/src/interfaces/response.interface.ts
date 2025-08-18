import { Types } from "mongoose";

export interface Response<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    error?: string | Record<string, unknown>;
}

export interface LoginResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data?: any;
}

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

