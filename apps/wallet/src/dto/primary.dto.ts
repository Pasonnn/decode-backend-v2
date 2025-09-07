import { IsNotEmpty, IsString } from 'class-validator';

class PrimaryWalletChallengeDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
  @IsNotEmpty()
  @IsString()
  wallet_address: string;
}

class PrimaryWalletChallengeValidationDto {
  @IsNotEmpty()
  @IsString()
  address: string;
  @IsNotEmpty()
  @IsString()
  signature: string;
}

class UnsetPrimaryWalletDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
  @IsNotEmpty()
  @IsString()
  wallet_address: string;
}

export {
  PrimaryWalletChallengeDto,
  PrimaryWalletChallengeValidationDto,
  UnsetPrimaryWalletDto,
};
