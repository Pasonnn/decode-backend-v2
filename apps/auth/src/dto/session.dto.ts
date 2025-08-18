import { IsNotEmpty, IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class RefreshSessionDto {
    @IsNotEmpty()
    @IsString()
    session_token: string;
}

export class GetActiveSessionsDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;
}

export class LogoutDto {
    @IsNotEmpty()
    @IsString()
    session_token: string;
}

export class RevokeAllSessionsDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;
}

export class CleanupExpiredSessionsDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;
}

export class ValidateAccessDto {
    @IsNotEmpty()
    @IsString()
    access_token: string;
}

export class CreateSsoTokenDto {
    @IsNotEmpty()
    @IsString()
    user_id: string;
}

export class ValidateSsoTokenDto {
    @IsNotEmpty()
    @IsString()
    sso_token: string;
}
