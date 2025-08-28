import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class SearchUserDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    username_or_email: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    page: number;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    limit: number;
}

export class SearchUsernameDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    username: string;
}

export class SearchEmailDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    email: string;
}