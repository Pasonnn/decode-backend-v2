import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, Matches, IsUrl } from 'class-validator';

export class UpdateUserDisplayNameDto {
  @ApiProperty({
    description: 'New display name for the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9\\s\\-_]+$',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Display name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  display_name: string;
}

export class UpdateUserBioDto {
  @ApiProperty({
    description: 'New bio for the user',
    example: 'Software engineer passionate about technology and innovation',
    minLength: 0,
    maxLength: 500,
  })
  @IsString()
  @MinLength(0)
  @MaxLength(500)
  bio: string;
}

export class UpdateUserAvatarDto {
  @ApiProperty({
    description: 'IPFS hash for the avatar image',
    example: 'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
    minLength: 46,
    maxLength: 62,
    pattern: '^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$',
  })
  @IsString()
  @MinLength(46)
  @MaxLength(62)
  @Matches(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$/, {
    message: 'Invalid IPFS hash format',
  })
  avatar_ipfs_hash: string;

  @ApiProperty({
    description: 'Fallback URL for the avatar image',
    example: 'https://res.cloudinary.com/dfzu1b238/image/upload/v1748419831/default_user_icon_rt4zcm.png',
    maxLength: 500,
    pattern: '^https?://.+',
  })
  @IsString()
  @IsUrl()
  @MaxLength(500)
  @Matches(/^https?:\/\/.+/, {
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
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid user ID format',
  })
  user_id: string;

  @ApiProperty({
    description: 'New role for the user',
    example: 'moderator',
    enum: ['user', 'admin', 'moderator'],
  })
  @IsString()
  role: string;
}
