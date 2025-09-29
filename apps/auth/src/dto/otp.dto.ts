/**
 * @fileoverview OTP (One-Time Password) Data Transfer Objects
 *
 * This file contains all DTOs related to Two-Factor Authentication (2FA)
 * operations in the Decode authentication system. These DTOs provide
 * type safety and validation for OTP-related API endpoints.
 *
 * DTOs included:
 * - SetupOtpDto: For initial OTP setup
 * - VerifyOtpDto: For OTP verification
 * - EnableOtpDto: For enabling OTP
 * - DisableOtpDto: For disabling OTP
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * DTO for verifying OTP code
 * Used when a user enters their 6-digit OTP code for verification
 */
export class VerifyOtpDto {
  /** 6-digit OTP code from authenticator app */
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only digits' })
  otp: string;
}

export class LoginVerifyOtpDto extends VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Login session token must be exactly 6 digits' })
  login_session_token: string;
}
