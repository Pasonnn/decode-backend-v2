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
}

export { LoginChallengeDto, LoginChallengeValidationDto };
