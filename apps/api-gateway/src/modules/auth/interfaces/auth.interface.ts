export interface AuthResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data?: any;
    error?: string;
}

export interface LoginResponse {
    access_token: string;
    session_token: string;
    user: {
        _id: string;
        username: string;
        email: string;
        role: string;
    };
}

export interface RegisterResponse {
    user_id: string;
    email: string;
    username: string;
    verification_sent: boolean;
}

export interface TokenValidationResponse {
    _id: string;
    email: string;
    username: string;
    role: string;
}
