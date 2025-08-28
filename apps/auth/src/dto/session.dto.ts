import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

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

export class CreateSsoTokenDto {
  // user_id will be extracted from the authenticated user's token
}

export class ValidateSsoTokenDto {
  @IsNotEmpty()
  @IsString()
  sso_token: string;
}
