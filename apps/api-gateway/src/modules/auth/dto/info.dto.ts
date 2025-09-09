import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for getting user info by access token
 */
export class InfoByAccessTokenDto {
  @ApiProperty({
    description: 'Access token for user identification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: 'string',
    required: true,
  })
  @IsNotEmpty({
    message: 'Access token is required',
  })
  @IsString({
    message: 'Access token must be a string',
  })
  access_token: string;
}

/**
 * DTO for getting user info by user ID
 */
export class InfoByUserIdDto {
  @ApiProperty({
    description: 'User ID for profile lookup',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
    required: true,
  })
  @IsNotEmpty({
    message: 'User ID is required',
  })
  @IsString({
    message: 'User ID must be a string',
  })
  user_id: string;
}

/**
 * DTO for getting user info by email or username
 */
export class InfoByEmailOrUsernameDto {
  @ApiProperty({
    description: 'User email address or username for profile lookup',
    example: 'user@example.com',
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 254,
    oneOf: [
      {
        type: 'string',
        format: 'email',
        description: 'Valid email address',
        example: 'user@example.com',
      },
      {
        type: 'string',
        pattern: '^[a-zA-Z0-9_.-]+$',
        description: 'Valid username (alphanumeric, underscore, dot, hyphen)',
        example: 'exampleusername',
        minLength: 2,
        maxLength: 50,
      },
    ],
  })
  @IsNotEmpty({
    message: 'Email or username is required',
  })
  @IsString({
    message: 'Email or username must be a string',
  })
  email_or_username: string;
}

/**
 * DTO for checking if a user exists by email or username
 * Used for user lookup operations before registration or authentication
 */
export class ExistUserByEmailOrUsernameDto {
  @ApiProperty({
    description: 'User email address or username for existence check',
    example: 'user@example.com',
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 254,
    oneOf: [
      {
        type: 'string',
        format: 'email',
        description: 'Valid email address',
        example: 'user@example.com',
      },
      {
        type: 'string',
        pattern: '^[a-zA-Z0-9_.-]+$',
        description: 'Valid username (alphanumeric, underscore, dot, hyphen)',
        example: 'exampleusername',
        minLength: 2,
        maxLength: 50,
      },
    ],
  })
  @IsNotEmpty({
    message: 'Email or username is required',
  })
  @IsString({
    message: 'Email or username must be a string',
  })
  email_or_username: string;
}
