/**
 * @fileoverview OTP Document Interface Definition
 *
 * This interface defines the structure for OTP documents in the Decode
 * authentication system. It provides type safety and clear contracts
 * for OTP-related operations and data handling.
 *
 * Interface Features:
 * - Type-safe OTP document structure
 * - MongoDB document integration
 * - User reference management
 * - OTP secret and enablement properties
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Document, Types } from 'mongoose';

/**
 * OTP Document Interface
 *
 * Defines the structure for OTP documents stored in MongoDB.
 * This interface extends the Mongoose Document class to provide
 * type safety for OTP-related database operations.
 *
 * @interface IOtpDoc
 * @extends {Document}
 */
export interface IOtpDoc extends Document {
  /** Reference to the user who owns this OTP configuration */
  user_id: Types.ObjectId;

  /** Secret key used for generating time-based one-time passwords (TOTP) */
  otp_secret: string;

  /** Flag indicating whether OTP is enabled for this user */
  otp_enable: boolean;

  /** Document creation timestamp (automatically managed by Mongoose) */
  createdAt?: Date;

  /** Document last update timestamp (automatically managed by Mongoose) */
  updatedAt?: Date;
}
