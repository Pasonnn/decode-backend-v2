/**
 * @fileoverview OTP Configuration
 *
 * This configuration file defines all OTP (One-Time Password) related settings
 * for the Decode authentication system. It provides centralized configuration
 * management for TOTP generation, validation, and security.
 *
 * OTP Configuration Categories:
 * - TOTP algorithm and security settings
 * - Token validity periods and windows
 * - Service issuer and application name
 * - QR code generation parameters
 * - Backup codes and recovery options
 * - Rate limiting and security policies
 * - Encryption settings for secure storage
 *
 * Security Considerations:
 * - Secret keys should be cryptographically secure
 * - Time windows balance security and usability
 * - Rate limiting prevents brute force attacks
 * - Backup codes provide recovery mechanisms
 * - OTP secrets are encrypted at rest for enhanced security
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { registerAs } from '@nestjs/config';

/**
 * OTP Configuration
 *
 * This configuration object contains all OTP-related settings for the system.
 * It provides centralized configuration management with environment-specific
 * overrides for security and flexibility.
 *
 * @param registerAs - NestJS configuration registration function
 * @returns Configuration object with OTP settings
 */
export default registerAs('otp', () => ({
  // TOTP Algorithm Configuration
  totp: {
    algorithm: 'SHA1', // Standard TOTP algorithm (SHA1, SHA256, SHA512)
    digits: 6, // Number of digits in the OTP code
    period: 30, // Time step in seconds (30s is standard)
    window: 1, // Number of time steps to check (allows for clock drift)
    encoding: 'ascii', // Secret encoding format
  },

  // Service Configuration
  service: {
    name: process.env.OTP_SERVICE_NAME || 'Decode',
    issuer: process.env.OTP_ISSUER || 'Decode Authentication',
    label: process.env.OTP_LABEL || 'Decode Account',
  },

  // QR Code Generation
  qrCode: {
    size: 200, // QR code size in pixels
    margin: 2, // QR code margin
    color: {
      dark: '#000000', // Dark color for QR code
      light: '#FFFFFF', // Light color for QR code
    },
    errorCorrectionLevel: 'M', // Error correction level (L, M, Q, H)
  },

  // Secret Generation
  secret: {
    length: 32, // Secret length in bytes
    encoding: 'base32', // Secret encoding for storage
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', // Base32 alphabet
  },

  // Encryption Configuration
  encryption: {
    secret: process.env.OTP_ENCRYPT_SECRET, // Symmetric encryption key for OTP secrets
    algorithm: 'aes-256-gcm', // Encryption algorithm for secure storage
    keyDerivation: 'pbkdf2', // Key derivation function
    iterations: 100000, // PBKDF2 iterations for key strengthening
  },

  // Validation Settings
  validation: {
    maxAttempts: 3, // Maximum OTP validation attempts
    lockoutDuration: 300, // Lockout duration in seconds (5 minutes)
    gracePeriod: 30, // Grace period for time drift in seconds
    allowReuse: false, // Prevent OTP code reuse
  },

  // Backup Codes
  backupCodes: {
    count: 10, // Number of backup codes to generate
    length: 8, // Length of each backup code
    format: 'alphanumeric', // Format: 'numeric', 'alphabetic', 'alphanumeric'
    separator: '-', // Separator for backup code formatting
  },

  // Rate Limiting
  rateLimit: {
    maxRequests: 5, // Maximum OTP requests per window
    windowMs: 300000, // Rate limit window in milliseconds (5 minutes)
    skipSuccessfulRequests: true, // Don't count successful requests
  },

  // Security Settings
  security: {
    requireSetup: true, // Require OTP setup for new users
    enforceForAdmin: true, // Enforce OTP for admin users
    allowDisable: false, // Allow users to disable OTP
    sessionTimeout: 3600, // OTP session timeout in seconds (1 hour)
  },

  // Recovery Options
  recovery: {
    enableBackupCodes: true, // Enable backup codes for recovery
    enableEmailRecovery: true, // Enable email-based recovery
    enableSmsRecovery: false, // Enable SMS-based recovery
    recoveryCodeExpiry: 86400, // Recovery code expiry in seconds (24 hours)
  },
}));
