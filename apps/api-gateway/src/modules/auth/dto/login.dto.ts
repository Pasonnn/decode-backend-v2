import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email or username for authentication',
    example: 'user@example.com',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  email_or_username: string;

  @ApiProperty({
    description: 'User password (must be 8-128 characters)',
    example: 'SecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    description: 'Device fingerprint hash for security verification',
    example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    minLength: 32,
    maxLength: 64,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  @MaxLength(64)
  fingerprint_hashed: string;

  @ApiProperty({
    description: 'Browser for security verification',
    example: 'Chrome',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  browser: string;

  @ApiProperty({
    description: 'Device for security verification',
    example: 'iPhone',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  device: string;
}

export class FingerprintEmailVerificationDto {
  @ApiProperty({
    description: '6-digit email verification code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @ApiProperty({
    description: 'App for security verification',
    example: 'decode',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  app?: string;
}

export class ResendDeviceFingerprintEmailVerificationDto {
  @ApiProperty({
    description: 'User email or username for authentication',
    example: 'user@example.com or exampleusername',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  email_or_username: string;

  @ApiProperty({
    description: 'Device fingerprint hash for security verification',
    example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    minLength: 32,
    maxLength: 64,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  @MaxLength(64)
  fingerprint_hashed: string;
}
