import { IsNotEmpty, IsString } from 'class-validator';

class LoginChallengeDto {
  @IsNotEmpty()
  @IsString()
  address: string;
}

class LoginChallengeValidationDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsNotEmpty()
  @IsString()
  fingerprint_hashed: string;

  @IsNotEmpty()
  @IsString()
  browser: string;

  @IsNotEmpty()
  @IsString()
  device: string;
}

export { LoginChallengeDto, LoginChallengeValidationDto };
