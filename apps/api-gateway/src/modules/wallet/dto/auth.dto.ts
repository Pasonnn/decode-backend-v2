import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginChallengeDto {
  @ApiProperty({
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class LoginChallengeValidationDto {
  @ApiProperty({
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Signature from wallet',
    example: '0x1234567890abcdef...',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Hashed device fingerprint',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  fingerprint_hashed: string;

  @ApiProperty({
    description: 'Browser information',
    example: 'Chrome 120.0.0.0',
  })
  @IsString()
  @IsNotEmpty()
  browser: string;

  @ApiProperty({
    description: 'Device information',
    example: 'Windows 10',
  })
  @IsString()
  @IsNotEmpty()
  device: string;
}
