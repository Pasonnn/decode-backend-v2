export interface JwtPayload {
  user_id: string;
  session_token?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}
