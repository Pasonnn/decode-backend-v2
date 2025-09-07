import { IsNotEmpty, IsString } from 'class-validator';

class LinkChallengeDto {
  @IsNotEmpty()
  @IsString()
  address: string;
}

class LinkChallengeValidationDto {
  @IsNotEmpty()
  @IsString()
  address: string;
  @IsNotEmpty()
  @IsString()
  signature: string;
}

class UnlinkWalletDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
  @IsNotEmpty()
  @IsString()
  address: string;
}

export { LinkChallengeDto, LinkChallengeValidationDto, UnlinkWalletDto };
