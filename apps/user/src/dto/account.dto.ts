import {
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  IsOptional,
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
    description: 'Reason for deactivation',
    example: 'Taking a break from the platform',
    maxLength: USER_CONSTANTS.ACCOUNT.DEACTIVATION.REASON_MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(USER_CONSTANTS.ACCOUNT.DEACTIVATION.REASON_MAX_LENGTH)
  reason: string;
}

export class ReactivateAccountDto {
  @ApiProperty({
    description: 'User ID to reactivate account for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;
}
