import { IsNotEmpty, IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterInfoDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username must contain only letters, numbers, and underscores'
    })
    username: string;

    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    password: string;
}

export class VerifyEmailDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;
}
