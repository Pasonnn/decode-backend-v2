import { IsNotEmpty, IsString } from 'class-validator';

class PrimaryWalletChallengeDto {
  @IsNotEmpty()
  @IsString()
  address: string;
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
  address: string;
}

export {
  PrimaryWalletChallengeDto,
  PrimaryWalletChallengeValidationDto,
  UnsetPrimaryWalletDto,
};
