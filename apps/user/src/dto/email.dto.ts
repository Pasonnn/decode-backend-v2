import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../constants/user.constants';

export class VerifyEmailCodeDto {
  @ApiProperty({
    description: '6-digit verification code sent to new email',
    example: '123456',
    minLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
    maxLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
  @MaxLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
  code: string;

  @ApiProperty({
    description: 'New email address to change to',
    example: 'newemail@example.com',
    minLength: USER_CONSTANTS.EMAIL.MIN_LENGTH,
    maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
  @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
    message: 'Invalid email format',
  })
  new_email: string;
}

export class ChangeEmailDto {
  @ApiProperty({
    description: 'New email address to change to',
    example: 'newemail@example.com',
    minLength: USER_CONSTANTS.EMAIL.MIN_LENGTH,
    maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
  @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
    message: 'Invalid email format',
  })
  new_email: string;

  @ApiProperty({
    description: '6-digit verification code sent to new email',
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
