import { IsNotEmpty, IsString } from 'class-validator';

export class InfoByAccessTokenDto {
  @IsNotEmpty()
  @IsString()
  access_token: string;
}

export class InfoByUserIdDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

export class InfoByEmailOrUsernameDto {
  @IsNotEmpty()
  @IsString()
  email_or_username: string;
}

export class InfoByFingerprintHashDto {
  @IsNotEmpty()
  @IsString()
  fingerprint_hashed: string;
}

export class ExistUserByEmailOrUsernameDto {
  @IsNotEmpty()
  @IsString()
  email_or_username: string;
}
