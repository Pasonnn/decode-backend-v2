import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_CONSTANTS } from '../constants/user.constants';

export class GetUserProfileDto {
  @ApiProperty({
    description: 'User ID to get profile for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;
}

export class UpdateUserDisplayNameDto {
  @ApiProperty({
    description: 'User ID to update display name for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;

  @ApiProperty({
    description: 'New display name for the user',
    example: 'John Doe',
    minLength: USER_CONSTANTS.PROFILE.DISPLAY_NAME.MIN_LENGTH,
    maxLength: USER_CONSTANTS.PROFILE.DISPLAY_NAME.MAX_LENGTH,
    pattern: '^[a-zA-Z0-9\\s\\-_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.PROFILE.DISPLAY_NAME.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.PROFILE.DISPLAY_NAME.MAX_LENGTH)
  @Matches(USER_CONSTANTS.PROFILE.DISPLAY_NAME.PATTERN, {
    message:
      'Display name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  display_name: string;
}

export class UpdateUserBioDto {
  @ApiProperty({
    description: 'User ID to update bio for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;

  @ApiProperty({
    description: 'New bio for the user',
    example: 'Software engineer passionate about technology and innovation',
    minLength: USER_CONSTANTS.PROFILE.BIOGRAPHY.MIN_LENGTH,
    maxLength: USER_CONSTANTS.PROFILE.BIOGRAPHY.MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.PROFILE.BIOGRAPHY.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.PROFILE.BIOGRAPHY.MAX_LENGTH)
  bio: string;
}

export class UpdateUserAvatarDto {
  @ApiProperty({
    description: 'User ID to update avatar for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;

  @ApiProperty({
    description: 'IPFS hash for the avatar image',
    example: 'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
    minLength: USER_CONSTANTS.PROFILE.AVATAR.IPFS_HASH.MIN_LENGTH,
    maxLength: USER_CONSTANTS.PROFILE.AVATAR.IPFS_HASH.MAX_LENGTH,
    pattern: '^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(USER_CONSTANTS.PROFILE.AVATAR.IPFS_HASH.MIN_LENGTH)
  @MaxLength(USER_CONSTANTS.PROFILE.AVATAR.IPFS_HASH.MAX_LENGTH)
  @Matches(USER_CONSTANTS.PROFILE.AVATAR.IPFS_HASH.PATTERN, {
    message: 'Invalid IPFS hash format',
  })
  avatar_ipfs_hash: string;

  @ApiProperty({
    description: 'Fallback URL for the avatar image',
    example:
      'https://res.cloudinary.com/dfzu1b238/image/upload/v1748419831/default_user_icon_rt4zcm.png',
    maxLength: USER_CONSTANTS.PROFILE.AVATAR.FALLBACK_URL.MAX_LENGTH,
    pattern: '^https?://.+',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(USER_CONSTANTS.PROFILE.AVATAR.FALLBACK_URL.MAX_LENGTH)
  @Matches(USER_CONSTANTS.PROFILE.AVATAR.FALLBACK_URL.PATTERN, {
    message: 'Invalid URL format',
  })
  avatar_fallback_url: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'User ID to update role for',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(USER_CONSTANTS.VALIDATION.USER_ID.PATTERN, {
    message: 'Invalid user ID format',
  })
  user_id: string;

  @ApiProperty({
    description: 'New role for the user',
    example: 'moderator',
    enum: USER_CONSTANTS.ROLES.ALL,
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(USER_CONSTANTS.ROLES.ALL, {
    message: 'Role must be one of: user, admin, moderator',
  })
  role: string;
}
