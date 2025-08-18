import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator";
// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;

    @IsNotEmpty()
    @IsString()
    old_password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.PASSWORD.MIN_LENGTH)
    @MaxLength(AUTH_CONSTANTS.PASSWORD.MAX_LENGTH)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    new_password: string;
}

export class EmailVerificationChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;
}

export class VerifyEmailChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
    @MaxLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
    code: string;
}

export class ChangeForgotPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
    @MaxLength(AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH)
    code: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(AUTH_CONSTANTS.PASSWORD.MIN_LENGTH)
    @MaxLength(AUTH_CONSTANTS.PASSWORD.MAX_LENGTH)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    new_password: string;
}
