/**
 * @fileoverview OTP (One-Time Password) Schema Definition
 *
 * This schema defines the structure and validation rules for OTP configurations
 * in the Decode authentication system. It manages user-specific OTP settings
 * for two-factor authentication and enhanced security.
 *
 * OTP Features:
 * - Secure OTP secret storage for TOTP generation
 * - User-specific OTP configuration management
 * - Enable/disable OTP functionality per user
 * - Integration with authenticator apps (Google Authenticator, Authy, etc.)
 *
 * Security Benefits:
 * - Adds an additional layer of security through two-factor authentication
 * - Prevents unauthorized access even with compromised passwords
 * - Supports time-based one-time password (TOTP) standard
 * - Enables secure account recovery and verification
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * OTP Schema
 *
 * Defines the structure for OTP configurations in the authentication system.
 * Each OTP record represents a user's two-factor authentication settings
 * and manages their OTP secret and enablement status.
 *
 * @Schema - Mongoose schema decorator with automatic timestamps and collection name
 */
@Schema({ timestamps: true, collection: 'otps' })
export class Otp extends Document {
  /** Reference to the user who owns this OTP configuration */
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  user_id: Types.ObjectId;

  /** Secret key used for generating time-based one-time passwords (TOTP) */
  @Prop({ required: true })
  otp_secret: string;

  /** Flag indicating whether OTP is enabled for this user */
  @Prop({ required: true, default: true })
  otp_enable: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
