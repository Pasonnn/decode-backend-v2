export interface SessionDoc {
  _id: string;
  user_id: string;
  device_fingerprint_id: string;
  session_token: string;
  access_token: string;
  app: string;
  expires_at: Date;
  is_active: boolean;
  last_used_at: Date;
}
