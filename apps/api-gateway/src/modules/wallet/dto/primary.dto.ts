import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PrimaryWalletChallengeDto {
  @ApiProperty({
    description: 'Wallet address to set as primary',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class PrimaryWalletChallengeValidationDto {
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
}

export class UnsetPrimaryWalletDto {
  @ApiProperty({
    description: 'Wallet address to unset as primary',
    example: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
