/**
 * @fileoverview Device Fingerprint Schema Definition
 *
 * This schema defines the structure and validation rules for device fingerprints
 * in the Decode authentication system. It represents unique device identifiers
 * used for enhanced security and device tracking.
 *
 * Device Fingerprinting Features:
 * - Unique device identification through hashed fingerprints
 * - Device trust management and verification
 * - Browser and device information tracking
 * - User-device relationship management
 *
 * Security Benefits:
 * - Prevents unauthorized access from unknown devices
 * - Enables device-specific security policies
 * - Supports multi-factor authentication through device verification
 * - Provides audit trail for device access
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Device Fingerprint Schema
 *
 * Defines the structure for device fingerprints in the authentication system.
 * Each fingerprint represents a unique device used by a user and tracks
 * trust status and device information.
 *
 * @Schema - Mongoose schema decorator with automatic timestamps and collection name
 */
@Schema({ timestamps: true, collection: 'device_fingerprints' })
export class DeviceFingerprint extends Document {
  /** Reference to the user who owns this device fingerprint */
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  user_id: Types.ObjectId;

  /** Device information (e.g., "iPhone 12", "MacBook Pro") */
  @Prop({ required: false })
  device: string;

  /** Browser information (e.g., "Chrome 91", "Safari 14") */
  @Prop({ required: false })
  browser: string;

  /** Hashed device fingerprint for unique device identification */
  @Prop({ required: true, index: true })
  fingerprint_hashed: string;

  /** Whether this device is trusted by the user - affects login flow */
  @Prop({ required: true, default: true })
  is_trusted: boolean;
}

export const DeviceFingerprintSchema =
  SchemaFactory.createForClass(DeviceFingerprint);
