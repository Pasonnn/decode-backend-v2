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
    EMAIL_EXISTS: 'Email already exists',
    USERNAME_EXISTS: 'Username already exists',
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
    USER_ACTIVE_SESSIONS_FETCHING_ERROR: 'Error getting user active sessions',
    EXPIRED_SESSIONS_CLEANING_ERROR: 'Error cleaning up expired sessions',
    LOGOUT_ERROR: 'Error logging out',
    ACCESS_TOKEN_VALIDATION_ERROR: 'Error validating access token',
    SSO_TOKEN_CREATION_ERROR: 'Error creating SSO token',
    SSO_TOKEN_INVALID: 'SSO token is invalid',
    SSO_TOKEN_VALIDATION_ERROR: 'Error validating SSO token',
    SESSION_VALIDATION_ERROR: 'Error validating session',
    SESSION_REVOKING_ERROR: 'Error revoking session',
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
  },

  // User Info Errors
  USER_INFO: {
    USER_NOT_FOUND: 'User not found',
    INVALID_USER_ID: 'Invalid user ID',
    INVALID_ACCESS_TOKEN: 'Invalid access token',
    USER_INFO_FETCH_FAILED: 'Failed to fetch user information',
  },

  // Profile Management Errors
  PROFILE: {
    PROFILE_NOT_FOUND: 'Profile not found',
    PROFILE_FETCH_FAILED: 'Failed to fetch profile',
    PROFILE_UPDATE_FAILED: 'Failed to update profile',
    PROFILE_PICTURE_UPLOAD_FAILED: 'Failed to upload profile picture',
    PROFILE_PICTURE_DELETE_FAILED: 'Failed to delete profile picture',
    PROFILE_PICTURE_NOT_FOUND: 'Profile picture not found',
    INVALID_PROFILE_DATA: 'Invalid profile data',
    PROFILE_PICTURE_SIZE_EXCEEDED: 'Profile picture size exceeds limit',
    PROFILE_PICTURE_FORMAT_INVALID: 'Invalid profile picture format',
    PROFILE_PICTURE_PROCESSING_FAILED: 'Failed to process profile picture',
    PUBLIC_PROFILE_ACCESS_DENIED: 'Access to public profile denied',
    PROFILE_VISIBILITY_SETTING_INVALID: 'Invalid profile visibility setting',
  },

  // User Search & Discovery Errors
  SEARCH: {
    SEARCH_FAILED: 'Search operation failed',
    INVALID_SEARCH_PARAMETERS: 'Invalid search parameters',
    SEARCH_QUERY_TOO_SHORT: 'Search query too short',
    SEARCH_QUERY_TOO_LONG: 'Search query too long',
    INVALID_FILTER_PARAMETERS: 'Invalid filter parameters',
    SUGGESTIONS_FETCH_FAILED: 'Failed to fetch user suggestions',
    SEARCH_RATE_LIMIT_EXCEEDED: 'Search rate limit exceeded',
    INVALID_SORT_PARAMETER: 'Invalid sort parameter',
    INVALID_PAGINATION_PARAMETERS: 'Invalid pagination parameters',
  },

  // Username Change Errors
  USERNAME: {
    USERNAME_CHANGE_INITIATION_FAILED: 'Failed to initiate username change',
    USERNAME_CHANGE_VERIFICATION_FAILED:
      'Failed to verify username change code',
    USERNAME_CHANGE_FAILED: 'Failed to change username',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    USERNAME_INVALID_FORMAT: 'Invalid username format',
    USERNAME_TOO_SHORT: 'Username too short',
    USERNAME_TOO_LONG: 'Username too long',
    USERNAME_CONTAINS_INVALID_CHARACTERS:
      'Username contains invalid characters',
    USERNAME_CHANGE_CODE_INVALID: 'Invalid username change verification code',
    USERNAME_CHANGE_CODE_EXPIRED: 'Username change verification code expired',
    USERNAME_CHANGE_CODE_NOT_FOUND:
      'Username change verification code not found',
    USERNAME_CHANGE_NOT_INITIATED: 'Username change not initiated',
    USERNAME_CHANGE_ALREADY_IN_PROGRESS: 'Username change already in progress',
    USERNAME_CHANGE_COOLDOWN_ACTIVE: 'Username change cooldown period active',
    USERNAME_CHANGE_EMAIL_FAILED:
      'Failed to send username change verification email',
    USERNAME_CHANGE_LIMIT_EXCEEDED: 'Username change limit exceeded',
  },

  // Email Change Errors
  EMAIL_CHANGE: {
    EMAIL_CHANGE_INITIATION_FAILED: 'Failed to initiate email change',
    EMAIL_CHANGE_VERIFICATION_FAILED: 'Failed to verify email change code',
    EMAIL_CHANGE_FAILED: 'Failed to change email',
    NEW_EMAIL_ALREADY_EXISTS: 'New email already exists',
    NEW_EMAIL_INVALID_FORMAT: 'Invalid new email format',
    EMAIL_CHANGE_CODE_INVALID: 'Invalid email change verification code',
    EMAIL_CHANGE_CODE_EXPIRED: 'Email change verification code expired',
    EMAIL_CHANGE_CODE_NOT_FOUND: 'Email change verification code not found',
    EMAIL_CHANGE_NOT_INITIATED: 'Email change not initiated',
    EMAIL_CHANGE_ALREADY_IN_PROGRESS: 'Email change already in progress',
    EMAIL_CHANGE_COOLDOWN_ACTIVE: 'Email change cooldown period active',
    EMAIL_CHANGE_EMAIL_FAILED: 'Failed to send email change verification email',
    EMAIL_CHANGE_LIMIT_EXCEEDED: 'Email change limit exceeded',
    CURRENT_EMAIL_VERIFICATION_REQUIRED: 'Current email verification required',
    NEW_EMAIL_VERIFICATION_REQUIRED: 'New email verification required',
    NEW_EMAIL_CHANGE_CODE_INVALID: 'Invalid new email change verification code',
    NEW_EMAIL_CHANGE_CODE_EXPIRED: 'New email change verification code expired',
    NEW_EMAIL_CHANGE_CODE_NOT_FOUND:
      'New email change verification code not found',
    NEW_EMAIL_CHANGE_NOT_INITIATED: 'New email change not initiated',
    NEW_EMAIL_CHANGE_ALREADY_IN_PROGRESS:
      'New email change already in progress',
    NEW_EMAIL_CHANGE_COOLDOWN_ACTIVE: 'New email change cooldown period active',
    NEW_EMAIL_CHANGE_EMAIL_FAILED:
      'Failed to send new email change verification email',
    NEW_EMAIL_CHANGE_LIMIT_EXCEEDED: 'New email change limit exceeded',
  },

  // Account Management Errors
  ACCOUNT: {
    ACCOUNT_DEACTIVATION_FAILED: 'Failed to deactivate account',
    ACCOUNT_REACTIVATION_FAILED: 'Failed to reactivate account',
    ACCOUNT_ALREADY_DEACTIVATED: 'Account is already deactivated',
    ACCOUNT_ALREADY_ACTIVE: 'Account is already active',
    ACCOUNT_DEACTIVATION_CONFIRMATION_REQUIRED:
      'Account deactivation confirmation required',
    ACCOUNT_REACTIVATION_CONFIRMATION_REQUIRED:
      'Account reactivation confirmation required',
    ACCOUNT_DEACTIVATION_EMAIL_FAILED:
      'Failed to send account deactivation email',
    ACCOUNT_REACTIVATION_EMAIL_FAILED:
      'Failed to send account reactivation email',
    ACCOUNT_STATUS_INVALID: 'Invalid account status',
    ACCOUNT_DEACTIVATION_REASON_REQUIRED:
      'Account deactivation reason required',
    ACCOUNT_REACTIVATION_NOT_ALLOWED: 'Account reactivation not allowed',
    ACCOUNT_PERMANENTLY_DELETED: 'Account has been permanently deleted',
    ACCOUNT_SUSPENDED: 'Account has been suspended',
    ACCOUNT_UNDER_REVIEW: 'Account is under review',
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

  // File Upload Errors
  FILE_UPLOAD: {
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_UPLOAD_FAILED: 'File upload failed',
    FILE_PROCESSING_FAILED: 'File processing failed',
    FILE_STORAGE_FAILED: 'File storage failed',
    FILE_DELETE_FAILED: 'File deletion failed',
    FILE_NOT_FOUND: 'File not found',
    INVALID_FILE_FORMAT: 'Invalid file format',
    FILE_CORRUPTED: 'File is corrupted',
    UPLOAD_DIRECTORY_NOT_FOUND: 'Upload directory not found',
  },

  // Success Messages (for consistency)
  SUCCESS: {
    SEARCH_SUCCESSFUL: 'Search successful',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    USERNAME_AVAILABLE: 'Username is available',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    EMAIL_AVAILABLE: 'Email is available',
    REGISTRATION_SUCCESSFUL: 'Registration successful',
    EMAIL_VERIFICATION_SENT: 'Email verification sent',
    EMAIL_VERIFICATION_SUCCESSFUL: 'Email verification successful',
    EMAIL_CHANGE_CODE_VERIFIED: 'Email change code verified',
    PASSWORD_CHANGED: 'Password changed successfully',
    PASSWORD_RESET_SENT: 'Password reset email sent',
    PASSWORD_CODE_VERIFIED: 'Password code verified',
    PASSWORD_RESET_SUCCESSFUL: 'Password reset successful',
    SESSION_CREATED: 'Session created',
    SESSION_REFRESHED: 'Session refreshed',
    SESSION_REVOKED: 'Session revoked',
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
    PROFILE_FETCHED: 'Profile fetched successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PROFILE_PICTURE_UPLOADED: 'Profile picture uploaded successfully',
    PROFILE_PICTURE_DELETED: 'Profile picture deleted successfully',
    USER_SEARCH_COMPLETED: 'User search completed successfully',
    USER_SUGGESTIONS_FETCHED: 'User suggestions fetched successfully',
    USERNAME_CHANGE_INITIATED: 'Username change initiated successfully',
    USERNAME_CHANGE_VERIFIED: 'Username change verified successfully',
    USERNAME_CHANGE_CODE_VERIFIED: 'Username change code verified successfully',
    USERNAME_CHANGED: 'Username changed successfully',
    EMAIL_CHANGE_INITIATED: 'Email change initiated successfully',
    EMAIL_CHANGE_VERIFIED: 'Email change verified successfully',
    NEW_EMAIL_CHANGE_INITIATED: 'New email change initiated successfully',
    NEW_EMAIL_CHANGE_VERIFIED: 'New email change verified successfully',
    EMAIL_CHANGED: 'Email changed successfully',
    ACCOUNT_DEACTIVATED: 'Account deactivated successfully',
    ACCOUNT_REACTIVATED: 'Account reactivated successfully',
  },
};
