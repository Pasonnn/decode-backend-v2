export const ERROR_MESSAGES = {
    // Authentication & Login Errors
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email/username or password',
        USER_NOT_FOUND: 'User not found',
        ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
        SESSION_EXPIRED: 'Session has expired',
        INVALID_TOKEN: 'Invalid or expired token',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'Access forbidden',
        LOGIN_FAILED: 'Login failed',
        DEVICE_FINGERPRINT_NOT_TRUSTED: 'Device fingerprint not trusted, send email verification',
        DEVICE_FINGERPRINT_VERIFICATION_REQUIRED: 'Device fingerprint verification required',
        DEVICE_FINGERPRINT_NOT_FOUND: 'Device fingerprint not found',
        DEVICE_FINGERPRINT_CREATION_FAILED: 'Cannot create device fingerprint',
        DEVICE_FINGERPRINT_EMAIL_VERIFICATION_FAILED: 'Cannot send device fingerprint email verification',
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
        VERIFICATION_CODE_EXPIRED: 'Device fingerprint verification code has expired',
        EMAIL_VERIFICATION_FAILED: 'Failed to send device fingerprint email verification',
        MAX_DEVICES_REACHED: 'Maximum number of devices reached',
    },

    // User Info Errors
    USER_INFO: {
        USER_NOT_FOUND: 'User not found',
        INVALID_USER_ID: 'Invalid user ID',
        INVALID_ACCESS_TOKEN: 'Invalid access token',
        USER_INFO_FETCH_FAILED: 'Failed to fetch user information',
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
    },
};
