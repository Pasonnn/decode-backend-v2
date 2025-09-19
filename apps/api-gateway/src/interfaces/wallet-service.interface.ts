export interface GenerateLoginChallengeRequest {
  address: string;
}

export interface ValidateLoginChallengeRequest {
  address: string;
  signature: string;
  fingerprint_hashed: string;
  browser: string;
  device: string;
}

export interface GenerateLinkChallengeRequest {
  address: string;
}

export interface ValidateLinkChallengeRequest {
  address: string;
  signature: string;
}

export interface UnlinkWalletRequest {
  address: string;
}

export interface GetWalletsByUserIdRequest {
  user_id: string;
}

export interface GeneratePrimaryWalletChallengeRequest {
  address: string;
}

export interface ValidatePrimaryWalletChallengeRequest {
  address: string;
  signature: string;
}

export interface UnsetPrimaryWalletRequest {
  address: string;
}
