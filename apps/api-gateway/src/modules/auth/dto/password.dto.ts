import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  // user_id will be extracted from the authenticated user's token

  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPass123!',
  })
  @IsNotEmpty()
  @IsString()
  old_password: string;

  @ApiProperty({
    description:
      'New password (8-128 characters, must contain uppercase, lowercase, number, and special character)',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  new_password: string;
}

export class VerifyEmailChangePasswordDto {
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
}

export class ChangeForgotPasswordDto {
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
    description:
      'New password (8-128 characters, must contain uppercase, lowercase, number, and special character)',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  new_password: string;
}

export class InitiateForgotPasswordDto {
  @ApiProperty({
    description: 'Username or email',
    example: 'john_doe',
  })
  @IsNotEmpty()
  @IsString()
  email_or_username: string;
}

export class VerifyEmailForgotPasswordDto {
  @ApiProperty({
    description: '6-digit email verification code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  @IsString()
  code: string;
}
