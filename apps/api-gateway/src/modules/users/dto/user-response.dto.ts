import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'User ID (alternative)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  user_id?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    enum: ['user', 'admin', 'moderator'],
  })
  role: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  display_name: string;

  @ApiProperty({
    description: 'User bio',
    example: 'Software engineer passionate about technology',
  })
  bio: string;

  @ApiProperty({
    description: 'IPFS hash for avatar',
    example: 'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
  })
  avatar_ipfs_hash: string;

  @ApiProperty({
    description: 'Fallback URL for avatar',
    example: 'https://res.cloudinary.com/dfzu1b238/image/upload/v1748419831/default_user_icon_rt4zcm.png',
  })
  avatar_fallback_url: string;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  last_login: Date;
}
