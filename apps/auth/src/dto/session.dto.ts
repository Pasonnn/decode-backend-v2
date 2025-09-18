import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshSessionDto {
  @IsNotEmpty()
  @IsString()
  session_token: string;
}

export class GetActiveSessionsDto {
  // user_id will be extracted from the authenticated user's token
}

export class LogoutDto {
  @IsNotEmpty()
  @IsString()
  session_token: string;
}

export class RevokeSessionDto {
  @IsNotEmpty()
  @IsString()
  session_id: string;
}

export class RevokeAllSessionsDto {
  // user_id will be extracted from the authenticated user's token
}

export class CleanupExpiredSessionsDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

export class ValidateAccessDto {
  @IsNotEmpty()
  @IsString()
  access_token: string;
}

export class ValidateWalletPassTokenDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(6)
  @MinLength(6)
  wallet_pass_token: string;
}

export class CreateSsoTokenDto {
  @IsNotEmpty()
  @IsString()
  app: string;

  @IsNotEmpty()
  @IsString()
  fingerprint_hashed: string;
}

export class ValidateSsoTokenDto {
  @IsNotEmpty()
  @IsString()
  sso_token: string;
}
