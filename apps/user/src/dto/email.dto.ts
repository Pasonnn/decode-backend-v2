import { IsNotEmpty, IsString, MaxLength, MinLength, Matches, IsEmail } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../constants/user.constants';

export class ChangeEmailInitiateDto {
    @ApiProperty({
        description: 'User ID to initiate email change for',
        example: '507f1f77bcf86cd799439011',
        pattern: '^[0-9a-fA-F]{24}$'
    })
    @IsString()
    @IsNotEmpty()
    @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
        message: 'Invalid user ID format'
    })
    user_id: string;

    @ApiProperty({
        description: 'New email address to change to',
        example: 'newemail@example.com',
        minLength: USER_CONSTANTS.EMAIL.MIN_LENGTH,
        maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
    @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
    @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
        message: 'Invalid email format'
    })
    new_email: string;
}

export class VerifyEmailCodeDto {
    @ApiProperty({
        description: 'User ID to verify email change for',
        example: '507f1f77bcf86cd799439011',
        pattern: '^[0-9a-fA-F]{24}$'
    })
    @IsString()
    @IsNotEmpty()
    @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
        message: 'Invalid user ID format'
    })
    user_id: string;

    @ApiProperty({
        description: '6-digit verification code sent to new email',
        example: '123456',
        minLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
        maxLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH
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
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
    @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
    @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
        message: 'Invalid email format'
    })
    new_email: string;
}

export class ChangeEmailDto {
    @ApiProperty({
        description: 'User ID to change email for',
        example: '507f1f77bcf86cd799439011',
        pattern: '^[0-9a-fA-F]{24}$'
    })
    @IsString()
    @IsNotEmpty()
    @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
        message: 'Invalid user ID format'
    })
    user_id: string;

    @ApiProperty({
        description: 'New email address to change to',
        example: 'newemail@example.com',
        minLength: USER_CONSTANTS.EMAIL.MIN_LENGTH,
        maxLength: USER_CONSTANTS.EMAIL.MAX_LENGTH,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @MinLength(USER_CONSTANTS.EMAIL.MIN_LENGTH)
    @MaxLength(USER_CONSTANTS.EMAIL.MAX_LENGTH)
    @Matches(USER_CONSTANTS.EMAIL.PATTERN, {
        message: 'Invalid email format'
    })
    new_email: string;

    @ApiProperty({
        description: '6-digit verification code sent to new email',
        example: '123456',
        minLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
        maxLength: USER_CONSTANTS.VERIFICATION.CODE_LENGTH
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
    @MaxLength(USER_CONSTANTS.VERIFICATION.CODE_LENGTH)
    code: string;
}