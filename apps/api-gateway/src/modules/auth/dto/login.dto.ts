import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    email_or_username: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(32)
    @MaxLength(64)
    fingerprint_hashed: string;
}

export class FingerprintEmailVerificationDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;
}
