import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
