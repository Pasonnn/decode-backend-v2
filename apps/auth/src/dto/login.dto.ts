import {
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email_or_username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.PASSWORD.MIN_LENGTH)
  @MaxLength(AUTH_CONSTANTS.PASSWORD.MAX_LENGTH)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.VALIDATION.FINGERPRINT_HASH.MIN_LENGTH)
  @MaxLength(AUTH_CONSTANTS.VALIDATION.FINGERPRINT_HASH.MAX_LENGTH)
  fingerprint_hashed: string;

  @IsNotEmpty()
  @IsString()
  browser: string;

  @IsNotEmpty()
  @IsString()
  device: string;
}

export class FingerprintEmailVerificationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
  @MaxLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
  code: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  app?: string;
}

export class ResendDeviceFingerprintEmailVerificationDto {
  @IsNotEmpty()
  @IsString()
  email_or_username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(AUTH_CONSTANTS.VALIDATION.FINGERPRINT_HASH.MIN_LENGTH)
  @MaxLength(AUTH_CONSTANTS.VALIDATION.FINGERPRINT_HASH.MAX_LENGTH)
  fingerprint_hashed: string;
}
