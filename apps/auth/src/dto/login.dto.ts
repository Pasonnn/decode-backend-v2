import { ObjectId } from "mongoose";
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean, MaxLength } from "class-validator";

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    email_or_username: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsString()
    fingerprint_hashed: string;
}

export class FingerprintEmailVerificationDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(6)
    email_verification_code: string;
}