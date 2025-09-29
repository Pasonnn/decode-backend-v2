/**
 * @fileoverview Error Messages Constants
 *
 * This file contains all error messages and success messages used throughout
 * the Decode authentication system. It provides centralized message management
 * for consistent user experience and easy maintenance.
 *
 * Message Categories:
 * - Authentication and login errors
 * - Registration and account creation errors
 * - Session management errors
 * - Password operation errors
 * - Email verification errors
 * - Device fingerprint errors
 * - User information errors
 * - Validation errors
 * - Database operation errors
 * - Redis operation errors
 * - Server and system errors
 * - Microservice communication errors
 * - Success messages and confirmations
 *
 * Benefits of Centralized Messages:
 * - Consistent error messaging across the system
 * - Easy localization and translation
 * - Centralized message updates and maintenance
 * - Clear documentation of all possible responses
 * - Type safety and validation
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

/**
 * System Messages Constants
 *
 * This object contains all error messages and success messages for the
 * authentication system. It provides centralized message management for
 * consistent user experience and easy maintenance.
 *
 * @constant {Object} MESSAGES - Main messages object
 */
export const MESSAGES = {
  // Authentication & Login Errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email/username or password',
    USER_NOT_FOUND: 'User not found',
    ACCOUNT_LOCKED:
      'Account temporarily locked due to too many failed attempts',
    SESSION_EXPIRED: 'Session has expired',
    INVALID_TOKEN: 'Invalid or expired token',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    LOGIN_FAILED: 'Login failed',
    DEVICE_FINGERPRINT_NOT_TRUSTED:
      'Device fingerprint not trusted, send email verification',
    DEVICE_FINGERPRINT_VERIFICATION_REQUIRED:
      'Device fingerprint verification required',
    DEVICE_FINGERPRINT_NOT_FOUND: 'Device fingerprint not found',
    DEVICE_FINGERPRINT_CREATION_FAILED: 'Cannot create device fingerprint',
    DEVICE_FINGERPRINT_EMAIL_VERIFICATION_FAILED:
      'Cannot send device fingerprint email verification',
    SESSION_CREATION_FAILED: 'Cannot create session',
    LOGIN_ERROR: 'Error logging in',
  },

  // Registration Errors
  REGISTRATION: {
    EMAIL_OR_USERNAME_EXISTS: 'Email or username already exists',
    EXISTING_USER: 'User already exists',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    INVALID_PASSWORD: 'Invalid password',
    INVALID_EMAIL: 'Invalid email format',
    EMAIL_VERIFICATION_FAILED: 'Email verification failed',
    EMAIL_VERIFICATION_EXPIRED: 'Email verification code has expired',
    EMAIL_VERIFICATION_SEND_FAILED: 'Cannot send email verification',
    REGISTER_INFO_INVALID: 'Register info is invalid',
    USER_CREATION_FAILED: 'Failed to create user',
    WELCOME_EMAIL_FAILED: 'Failed to send welcome email',
    REGISTRATION_ERROR: 'Registration failed',
    REGISTER_INFO_NOT_FOUND: 'Register info not found',
  },

  // Session Errors
  SESSION: {
    SESSION_NOT_FOUND: 'Session not found',
    SESSION_REVOKED: 'Session has been revoked',
    SESSION_EXPIRED: 'Session has expired',
    INVALID_SESSION_TOKEN: 'Invalid session token',
    TOO_MANY_SESSIONS: 'Maximum number of active sessions reached',
    SESSION_REFRESH_FAILED: 'Failed to refresh session',
    SESSION_REVOKE_FAILED: 'Failed to revoke session',
    SESSION_CLEANUP_FAILED: 'Failed to cleanup expired sessions',
    SESSION_VALIDATION_FAILED: 'Session validation failed',
    SESSION_CREATION_ERROR: 'Error creating session',
    SESSION_REFRESH_ERROR: 'Error refreshing session',
    ALL_SESSIONS_REVOKING_ERROR: 'Error revoking all sessions',
    SESSIONS_REVOKING_ERROR: 'Error revoking sessions',
    USER_ACTIVE_SESSIONS_FETCHING_ERROR: 'Error getting user active sessions',
    EXPIRED_SESSIONS_CLEANING_ERROR: 'Error cleaning up expired sessions',
    LOGOUT_ERROR: 'Error logging out',
    ACCESS_TOKEN_VALIDATION_ERROR: 'Error validating access token',
    SSO_TOKEN_CREATION_ERROR: 'Error creating SSO token',
    SSO_TOKEN_INVALID: 'SSO token is invalid',
    SSO_TOKEN_VALIDATION_ERROR: 'Error validating SSO token',
    SESSION_VALIDATION_ERROR: 'Error validating session',
    SESSION_REVOKING_ERROR: 'Error revoking session',
    WALLET_SESSION_CREATION_ERROR: 'Error creating wallet session',
  },

  // Password Errors
  PASSWORD: {
    INVALID_PASSWORD: 'Invalid password',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    PASSWORD_VERIFICATION_FAILED: 'Password verification failed',
    PASSWORD_HASHING_FAILED: 'Password hashing failed',
    PASSWORD_CHANGE_FAILED: 'Failed to change password',
    OLD_PASSWORD_INCORRECT: 'Old password is incorrect',
    PASSWORD_RESET_VERIFICATION_FAILED: 'Password reset verification failed',
    PASSWORD_RESET_CODE_INVALID: 'Invalid password reset code',
    PASSWORD_RESET_CODE_EXPIRED: 'Password reset code has expired',
    PASSWORD_RESET_EMAIL_FAILED: 'Failed to send password reset email',
    PASSWORD_RESET_ERROR: 'Password reset failed',
  },

  // Email Verification Errors
  EMAIL_VERIFICATION: {
    INVALID_CODE: 'Invalid email verification code',
    CODE_EXPIRED: 'Email verification code has expired',
    CODE_NOT_FOUND: 'Email verification code not found',
    VERIFICATION_FAILED: 'Email verification failed',
    EMAIL_SEND_FAILED: 'Failed to send email',
    EMAIL_SERVICE_ERROR: 'Email service unavailable',
  },

  // Device Fingerprint Errors
  DEVICE_FINGERPRINT: {
    NOT_FOUND: 'Device fingerprint not found',
    NOT_TRUSTED: 'Device fingerprint not trusted',
    CREATION_FAILED: 'Failed to create device fingerprint',
    VERIFICATION_FAILED: 'Device fingerprint verification failed',
    VERIFICATION_CODE_INVALID: 'Invalid device fingerprint verification code',
    VERIFICATION_CODE_EXPIRED:
      'Device fingerprint verification code has expired',
    EMAIL_VERIFICATION_FAILED:
      'Failed to send device fingerprint email verification',
    MAX_DEVICES_REACHED: 'Maximum number of devices reached',
    REVOKING_FAILED: 'Failed to revoke device fingerprint',
  },

  // User Info Errors
  USER_INFO: {
    USER_NOT_FOUND: 'User not found',
    INVALID_USER_ID: 'Invalid user ID',
    INVALID_ACCESS_TOKEN: 'Invalid access token',
    USER_INFO_FETCH_FAILED: 'Failed to fetch user information',
  },

  OTP: {
    OTP_NOT_ENABLED: 'OTP is not enabled for this user',
    OTP_SETUP_FAILED: 'Failed to setup OTP',
    OTP_SECRET_GENERATION_FAILED: 'Failed to generate OTP secret',
    OTP_SECRET_ENCRYPTION_FAILED: 'Failed to encrypt OTP secret',
    OTP_SECRET_DECRYPTION_FAILED: 'Failed to decrypt OTP secret',
    OTP_SECRET_COMPARISON_FAILED: 'Failed to compare OTP secret',
    OTP_ALREADY_SETUP: 'OTP already setup',
    OTP_FETCH_FAILED: 'Failed to fetch OTP',
    OTP_NOT_FOUND: 'OTP not found',
  },

  // Validation Errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format',
    MIN_LENGTH: 'Minimum length not met',
    MAX_LENGTH: 'Maximum length exceeded',
    INVALID_TYPE: 'Invalid data type',
    INVALID_EMAIL_FORMAT: 'Invalid email format',
    INVALID_USERNAME_FORMAT: 'Invalid username format',
    INVALID_PASSWORD_FORMAT: 'Invalid password format',
    INVALID_FINGERPRINT_FORMAT: 'Invalid fingerprint format',
  },

  // Database Errors
  DATABASE: {
    CONNECTION_FAILED: 'Database connection failed',
    QUERY_FAILED: 'Database query failed',
    SAVE_FAILED: 'Failed to save data',
    UPDATE_FAILED: 'Failed to update data',
    DELETE_FAILED: 'Failed to delete data',
    TRANSACTION_FAILED: 'Database transaction failed',
    VALIDATION_FAILED: 'Database validation failed',
  },

  // Redis Errors
  REDIS: {
    CONNECTION_FAILED: 'Redis connection failed',
    SET_FAILED: 'Failed to set data in Redis',
    GET_FAILED: 'Failed to get data from Redis',
    DELETE_FAILED: 'Failed to delete data from Redis',
    KEY_NOT_FOUND: 'Key not found in Redis',
    EXPIRATION_FAILED: 'Failed to set expiration in Redis',
  },

  // Server Errors
  SERVER: {
    INTERNAL_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    TIMEOUT: 'Request timeout',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    MAINTENANCE_MODE: 'Service is under maintenance',
    CONFIGURATION_ERROR: 'Configuration error',
  },

  // Microservice Errors
  MICROSERVICE: {
    EMAIL_SERVICE_UNAVAILABLE: 'Email service unavailable',
    EMAIL_SERVICE_ERROR: 'Email service error',
    COMMUNICATION_FAILED: 'Microservice communication failed',
    TIMEOUT: 'Microservice timeout',
  },

  // Success Messages (for consistency)
  SUCCESS: {
    LOGIN_SUCCESSFUL: 'Login successful',
    REGISTRATION_SUCCESSFUL: 'Registration successful',
    EMAIL_VERIFICATION_SENT: 'Email verification sent',
    EMAIL_VERIFICATION_SUCCESSFUL: 'Email verification successful',
    PASSWORD_CHANGED: 'Password changed successfully',
    PASSWORD_RESET_SENT: 'Password reset email sent',
    PASSWORD_CODE_VERIFIED: 'Password code verified',
    PASSWORD_RESET_SUCCESSFUL: 'Password reset successful',
    SESSION_CREATED: 'Session created',
    SESSION_REFRESHED: 'Session refreshed',
    SESSION_REVOKED: 'Session revoked',
    SESSIONS_REVOKED: 'Sessions revoked',
    ALL_SESSIONS_REVOKED: 'All sessions revoked',
    USER_ACTIVE_SESSIONS_FETCHED: 'User active sessions fetched',
    EXPIRED_SESSIONS_CLEANED_UP: 'Expired sessions cleaned up',
    ACCESS_TOKEN_VALIDATED: 'Access token validated',
    SSO_TOKEN_CREATED: 'SSO token created',
    SSO_TOKEN_VALIDATED: 'SSO token validated',
    SESSION_VALID: 'Session valid',
    DEVICE_FINGERPRINT_CREATED: 'Device fingerprint created',
    DEVICE_FINGERPRINT_VERIFIED: 'Device fingerprint verified',
    USER_CREATED: 'User created successfully',
    USER_INFO_FETCHED: 'User information fetched successfully',
    USER_UPDATED: 'User updated successfully',
    USER_FOUND: 'User found',
    DEVICE_FINGERPRINT_FETCHED: 'Device fingerprint fetched',
    DEVICE_FINGERPRINT_REVOKED: 'Device fingerprint revoked',
    WALLET_SESSION_CREATED_WITH_NEW_DEVICE_FINGERPRINT:
      'Wallet session created with new device fingerprint',
    WALLET_SESSION_CREATED: 'Wallet session created',
    OTP_FETCHED: 'OTP fetched',
    OTP_SETUP_SUCCESS: 'OTP setup successful',
  },
};
