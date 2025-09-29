/**
 * @fileoverview Two-Factor Authentication (2FA) Data Transfer Objects
 *
 * This file contains all DTOs related to Two-Factor Authentication (2FA)
 * operations in the Decode API Gateway. These DTOs provide type safety
 * and validation for 2FA-related API endpoints.
 *
 * DTOs included:
 * - VerifyOtpDto: For OTP verification
 * - LoginVerifyOtpDto: For OTP verification during login
 * - FingerprintTrustVerifyOtpDto: For OTP verification during device fingerprint trust
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for verifying OTP code
 * Used when a user enters their 6-digit OTP code for verification
 */
export class VerifyOtpDto {
  /** 6-digit OTP code from authenticator app */
  @ApiProperty({
    description: '6-digit OTP code from authenticator app',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    pattern: '^\\d{6}$',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP code must contain only digits' })
  otp: string;
}

/**
 * DTO for OTP verification during login process
 * Used when a user needs to verify OTP after initial login
 */
export class LoginVerifyOtpDto extends VerifyOtpDto {
  /** Login session token for OTP verification */
  @ApiProperty({
    description: 'Login session token for OTP verification',
    example: 'abc123',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Login session token must be exactly 6 digits' })
  login_session_token: string;
}

/**
 * DTO for OTP verification during device fingerprint trust process
 * Used when a user needs to verify OTP to trust a new device
 */
export class FingerprintTrustVerifyOtpDto extends VerifyOtpDto {
  /** Verify device fingerprint session token for OTP verification */
  @ApiProperty({
    description: 'Verify device fingerprint session token for OTP verification',
    example: 'def456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, {
    message: 'Verify device fingerprint session token must be exactly 6 digits',
  })
  verify_device_fingerprint_session_token: string;
}
