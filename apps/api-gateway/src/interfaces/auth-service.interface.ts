export interface RegisterInfoRequest {
  username: string;
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface SendEmailVerificationRequest {
  email: string;
}

export interface LoginRequest {
  email_or_username: string;
  password: string;
  fingerprint_hashed: string;
}

export interface FingerprintEmailVerificationRequest {
  code: string;
  app?: string;
}

export interface ResendDeviceFingerprintEmailVerificationRequest {
  email_or_username: string;
  fingerprint_hashed: string;
}

export interface RefreshSessionRequest {
  session_token: string;
}

export interface GetActiveSessionsRequest {
  user_id: string;
  authorization: string;
}

export interface LogoutRequest {
  session_token: string;
  authorization: string;
}

export interface RevokeAllSessionsRequest {
  user_id: string;
  authorization: string;
}

export interface ValidateAccessRequest {
  access_token: string;
  authorization: string;
}

export interface CreateSsoTokenRequest {
  app: string;
  fingerprint_hashed: string;
  authorization: string;
}

export interface ValidateSsoTokenRequest {
  sso_token: string;
}

export interface ChangePasswordRequest {
  user_id: string;
  old_password: string;
  new_password: string;
  authorization: string;
}

export interface EmailVerificationChangePasswordRequest {
  user_id: string;
  authorization: string;
}

export interface VerifyEmailChangePasswordRequest {
  code: string;
  authorization: string;
}

export interface ChangeForgotPasswordRequest {
  code: string;
  new_password: string;
  authorization: string;
}

export interface InfoByAccessTokenRequest {
  access_token: string;
  authorization: string;
}

export interface InfoByUserIdRequest {
  user_id: string;
  authorization: string;
}

export interface InfoByEmailOrUsernameRequest {
  email_or_username: string;
  authorization: string;
}

export interface ExistUserByEmailOrUsernameRequest {
  email_or_username: string;
}

export interface GetDeviceFingerprintRequest {
  user_id: string;
  authorization: string;
}

export interface RevokeDeviceFingerprintRequest {
  device_fingerprint_id: string;
  user_id: string;
  authorization: string;
}

// Two-Factor Authentication (2FA) Interfaces

export interface StatusOtpRequest {
  authorization: string;
}

export interface SetupOtpRequest {
  authorization: string;
}

export interface EnableOtpRequest {
  otp: string;
  authorization: string;
}

export interface DisableOtpRequest {
  authorization: string;
}

export interface LoginVerifyOtpRequest {
  login_session_token: string;
  otp: string;
}

export interface FingerprintTrustVerifyOtpRequest {
  verify_device_fingerprint_session_token: string;
  otp: string;
}
