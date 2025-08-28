import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";


export class GetUserProfileDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
}

export class UpdateUserUsernameDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
    
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    username: string;
}

export class UpdateUserEmailDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
    
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    email: string;
}

export class UpdateUserDisplayNameDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
    
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    display_name: string;
}

export class UpdateUserBioDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
    
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @MaxLength(254)
    bio: string;
}

export class UpdateUserAvatarDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
    
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    avatar_ipfs_hash: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    avatar_fallback_url: string;
}

export class UpdateUserRoleDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    user_id: string;
    
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    role: string;
}
