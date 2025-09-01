import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../constants/user.constants';
export class VerifyUsernameCodeDto {
  @ApiProperty({
    description: '6-digit verification code sent to email',
    example: '123456',
    minLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
    maxLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
  @MaxLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
  code: string;
}

export class ChangeUsernameDto {
  @ApiProperty({
    description: 'New username to change to',
    example: 'new_username',
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
  new_username: string;

  @ApiProperty({
    description: '6-digit verification code sent to email',
    example: '123456',
    minLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
    maxLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
  @MaxLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
  code: string;
}
