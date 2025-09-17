/**
 * @fileoverview Session Schema Definition
 *
 * This schema defines the structure and validation rules for user sessions
 * in the Decode authentication system. It represents active user sessions
 * with device fingerprinting and token management.
 *
 * Session Architecture:
 * - Links users to their devices through device fingerprinting
 * - Manages session tokens for authentication
 * - Tracks session expiration and activity
 * - Supports session revocation and cleanup
 *
 * Security Features:
 * - Device fingerprinting for enhanced security
 * - Session expiration with automatic cleanup
 * - Session revocation capabilities
 * - Activity tracking for monitoring
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Session Schema
 *
 * Defines the structure for user sessions in the authentication system.
 * Each session links a user to a specific device and manages authentication
 * tokens and session lifecycle.
 *
 * @Schema - Mongoose schema decorator with automatic timestamps and collection name
 */
@Schema({ timestamps: true, collection: 'sessions' })
export class Session extends Document {
  /** Reference to the user who owns this session */
  @Prop({ required: true, index: true })
  user_id: Types.ObjectId;

  /** Reference to the device fingerprint associated with this session */
  @Prop({ required: true, index: true })
  device_fingerprint_id: Types.ObjectId;

  /** JWT session token for authentication and refresh */
  @Prop({ required: true })
  session_token: string;

  /** Application identifier - defaults to 'Decode' */
  @Prop({ default: 'Decode' })
  app: string;

  /** Session expiration timestamp - defaults to 30 days from creation */
  @Prop({ required: true, default: Date.now() + 1000 * 60 * 60 * 24 * 30 })
  expires_at: Date;

  /** Whether the session is currently active - used for session management */
  @Prop({ required: true, default: true })
  is_active: boolean;

  /** Timestamp when the session was revoked - null if still active */
  @Prop({ required: false })
  revoked_at: Date;

  /** Timestamp of last session activity - updated on each request */
  @Prop({ required: false, default: new Date() })
  last_used_at: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
