import { ObjectId } from "mongoose";
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsBoolean } from "class-validator";

export class RegisterInfoDto {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}

export class VerifyEmailDto {
    @IsNotEmpty()
    @IsString()
    code: string;
}