/**
 * @fileoverview Authentication Configuration
 *
 * This configuration file defines all authentication-related settings for the
 * Decode authentication system. It provides centralized configuration management
 * for security, validation, and system behavior.
 *
 * Configuration Categories:
 * - Password security requirements and validation
 * - Session management and timeout settings
 * - Email verification configuration
 * - Security policies and restrictions
 * - Rate limiting and throttling
 * - Redis caching and TTL settings
 *
 * Benefits:
 * - Centralized configuration management
 * - Environment-specific overrides
 * - Type safety and validation
 * - Easy maintenance and updates
 * - Clear documentation of all settings
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { registerAs } from '@nestjs/config';

/**
 * Authentication Configuration
 *
 * This configuration object contains all authentication-related settings
 * for the system. It provides centralized configuration management with
 * environment-specific overrides.
 *
 * @param registerAs - NestJS configuration registration function
 * @returns Configuration object with authentication settings
 */
export default registerAs('auth', () => ({
  // Password Configuration
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    saltRounds: 12,
  },

  // Session Configuration
  session: {
    maxSessionsPerUser: 5,
    sessionTimeout: 3600, // 1 hour in seconds
    sessionTokenRotation: true,
  },

  // Email Verification Configuration
  emailVerification: {
    enabled: true,
    codeLength: 6,
    codeExpiry: 300, // 5 minutes
    maxAttempts: 3,
  },

  // Security Configuration
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 900, // 15 minutes
    requireFingerprint: false,
    fingerprintExpiry: 86400, // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    loginAttempts: 5,
    loginWindow: 900, // 15 minutes
    emailVerification: 3,
    emailVerificationWindow: 3600, // 1 hour
  },

  // Redis Configuration
  redis: {
    prefix: 'auth',
    ttl: {
      session: 3600,
      emailVerification: 300,
      fingerprint: 86400,
      passwordReset: 900,
      loginAttempts: 900,
    },
  },
}));
