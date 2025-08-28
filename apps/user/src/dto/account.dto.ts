import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../constants/user.constants';

export class DeactivateAccountDto {
  @ApiProperty({
    description: 'User ID to deactivate account for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;

  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPass123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Reason for deactivation',
    example: 'Taking a break from the platform',
    maxLength: USER_CONSTANTS.ACCOUNT.DEACTIVATION.REASON_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(USER_CONSTANTS.ACCOUNT.DEACTIVATION.REASON_MAX_LENGTH)
  reason?: string;
}

export class ReactivateAccountDto {
  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'user@example.com',
    minLength: USER_CONSTANTS.EMAIL.MIN_LENGTH,
    maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
  @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
    message: 'Invalid email format',
  })
  email: string;

  @ApiProperty({
    description: 'Username associated with the account',
    example: 'username',
    minLength: USER_CONSTANTS.USERNAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.USERNAME.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.USERNAME.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.USERNAME.MAX_LENGTH)
  @Matches(USER_CONSTANTS.USERNAME.PATTERN, {
    message: 'Username must contain only letters, numbers, and underscores',
  })
  username: string;
}
