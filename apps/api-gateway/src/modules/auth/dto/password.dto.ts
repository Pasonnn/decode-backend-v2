import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    // user_id will be extracted from the authenticated user's token

    @IsNotEmpty()
    @IsString()
    old_password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    new_password: string;
}

export class VerifyEmailChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;
}

export class ChangeForgotPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    new_password: string;
}
