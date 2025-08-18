import { IsNotEmpty, IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from "class-validator";

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class RegisterInfoDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.VALIDATION.USERNAME.MIN_LENGTH)
    @MaxLength(AUTH_CONSTANTS.VALIDATION.USERNAME.MAX_LENGTH)
    @Matches(AUTH_CONSTANTS.VALIDATION.USERNAME.PATTERN, {
        message: 'Username must contain only letters, numbers, and underscores'
    })
    username: string;

    @IsNotEmpty()
    @IsEmail()
    @MaxLength(AUTH_CONSTANTS.VALIDATION.EMAIL.MAX_LENGTH)
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.PASSWORD.MIN_LENGTH)
    @MaxLength(AUTH_CONSTANTS.PASSWORD.MAX_LENGTH)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    password: string;
}

export class VerifyEmailDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
    @MaxLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
    code: string;
}