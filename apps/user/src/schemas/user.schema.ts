/**
 * @fileoverview User Schema Definition
 *
 * This schema defines the structure and validation rules for user accounts
 * in the Decode authentication system. It represents the core user entity
 * with all necessary fields for authentication, profile management, and
 * role-based access control.
 *
 * Schema Features:
 * - Automatic timestamp management (createdAt, updatedAt)
 * - Unique constraints on email and username
 * - Indexed fields for optimal query performance
 * - Default values for profile fields
 * - Role-based access control with enum validation
 *
 * Security Considerations:
 * - Password is stored as a hash, never in plain text
 * - Email and username are unique to prevent duplicates
 * - Role field is restricted to predefined values
 * - Sensitive fields are properly indexed for security
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * User Schema
 *
 * Defines the structure for user accounts in the authentication system.
 * Each user has a unique email and username, along with profile information
 * and authentication credentials.
 *
 * @Schema - Mongoose schema decorator with automatic timestamps and collection name
 */
@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  /** Unique username for the user account - must be unique across the system */
  @Prop({ required: true, unique: true, index: true })
  username: string;

  /** User's email address - must be unique and valid email format */
  @Prop({ required: true, unique: true, index: true })
  email: string;

  /** Display name shown to other users - can be different from username */
  @Prop({ required: false })
  display_name: string;

  /** Hashed password using bcrypt - never store plain text passwords */
  @Prop({ required: true })
  password_hashed: string;

  /** User's bio/description - default message for new users */
  @Prop({ required: false, default: 'Hi, i am a new Decode User' })
  bio: string;

  /** IPFS hash for user's avatar image - default avatar for new users */
  @Prop({
    required: false,
    default: 'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
  })
  avatar_ipfs_hash: string;

  /** User role for access control - restricted to predefined values */
  @Prop({
    required: false,
    default: 'user',
    enum: ['user', 'admin', 'moderator'],
  })
  role: string;

  /** Timestamp of user's last login - updated on each successful login */
  @Prop({ required: false, default: new Date() })
  last_login: Date;

  /** Timestamp of user's last username change - updated on each username change */
  @Prop({ required: false })
  last_username_change: Date;

  /** Timestamp of user's last email change - updated on each email change */
  @Prop({ required: false })
  last_email_change: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
