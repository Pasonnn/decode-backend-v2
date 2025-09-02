import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class CreateAccountEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}

export class WelcomeMessageEmailDto {
  @IsEmail()
  email: string;
}

export class FingerprintVerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}

export class ForgotPasswordVerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}

export class UsernameChangeVerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}

export class EmailChangeVerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}

export class NewEmailChangeVerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;
}

export type EmailRequestDto =
  | { type: 'create-account'; data: CreateAccountEmailDto }
  | { type: 'welcome-message'; data: WelcomeMessageEmailDto }
  | { type: 'fingerprint-verify'; data: FingerprintVerifyEmailDto }
  | { type: 'forgot-password-verify'; data: ForgotPasswordVerifyEmailDto }
  | { type: 'username-change-verify'; data: UsernameChangeVerifyEmailDto }
  | { type: 'email-change-verify'; data: EmailChangeVerifyEmailDto }
  | { type: 'new-email-change-verify'; data: NewEmailChangeVerifyEmailDto };
