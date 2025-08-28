import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshSessionDto {
  @ApiProperty({
    description: 'Session token for refreshing access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  session_token: string;
}

export class GetActiveSessionsDto {
  // user_id will be extracted from the authenticated user's token
}

export class LogoutDto {
  @ApiProperty({
    description: 'Session token to invalidate for logout',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  session_token: string;
}

export class RevokeAllSessionsDto {
  // user_id will be extracted from the authenticated user's token
}

export class ValidateAccessDto {
  @ApiProperty({
    description: 'Access token to validate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  access_token: string;
}

export class CreateSsoTokenDto {
  // user_id will be extracted from the authenticated user's token
}

export class ValidateSsoTokenDto {
  @ApiProperty({
    description: 'SSO token to validate',
    example: 'sso_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  sso_token: string;
}
