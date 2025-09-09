export const AUTH_CONSTANTS = {
  // JWT Configuration
  JWT: {
    ACCESS_TOKEN_EXPIRES_IN: '15m',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
    SESSION_TOKEN_EXPIRES_IN: '30d',
  },

  // Session Configuration
  SESSION: {
    EXPIRES_IN_DAYS: 30,
    EXPIRES_IN_HOURS: 24 * 30, // 30 days
    MAX_SESSIONS_PER_USER: 5,
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Redis Configuration
  REDIS: {
    // Timeouts in seconds
    REGISTER_INFO_EXPIRES_IN: 60 * 60, // 1 hour
    EMAIL_VERIFICATION_EXPIRES_IN: 5 * 60, // 5 minutes
    FINGERPRINT_VERIFICATION_EXPIRES_IN: 5 * 60, // 5 minutes
    PASSWORD_RESET_EXPIRES_IN: 5 * 60, // 5 minutes
    CHANGE_PASSWORD_VERIFICATION_EXPIRES_IN: 5 * 60, // 5 minutes

    // Key prefixes
    KEYS: {
      REGISTER_INFO: 'register_info',
      EMAIL_VERIFICATION: 'email_verification_code',
      FINGERPRINT_VERIFICATION: 'fingerprint-email-verification',
      PASSWORD_RESET: 'change_password_verification_code',
      LOGIN_ATTEMPTS: 'login_attempts',
    },
  },

  // Email Configuration
  EMAIL: {
    VERIFICATION_CODE_LENGTH: 6,
    TYPES: {
      CREATE_ACCOUNT: 'create-account',
      WELCOME_MESSAGE: 'welcome-message',
      FINGERPRINT_VERIFY: 'fingerprint-verify',
      FORGOT_PASSWORD_VERIFY: 'forgot-password-verify',
    },
  },

  // Password Configuration
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    SALT_ROUNDS: 10,
    REQUIREMENTS: {
      UPPERCASE: true,
      LOWERCASE: true,
      NUMBERS: true,
      SPECIAL_CHARS: true,
    },
  },

  // Device Fingerprint Configuration
  DEVICE_FINGERPRINT: {
    VERIFICATION_CODE_LENGTH: 6,
    TRUSTED_BY_DEFAULT: false,
    MAX_DEVICES_PER_USER: 10,
  },

  // User Configuration
  USER: {
    ROLES: {
      USER: 'user',
      ADMIN: 'admin',
      MODERATOR: 'moderator',
    },
    DEFAULT_ROLE: 'user',
    DEFAULT_BIO: 'Hi, i am a new Decode User',
    DEFAULT_AVATAR_IPFS_HASH:
      'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
    DEFAULT_AVATAR_FALLBACK_URL:
      'https://res.cloudinary.com/dfzu1b238/image/upload/v1748419831/default_user_icon_rt4zcm.png',
  },

  // HTTP Status Codes
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Rate Limiting
  RATE_LIMIT: {
    LOGIN_ATTEMPTS_LIMIT: 5,
    LOGIN_ATTEMPTS_WINDOW: 15 * 60 * 1000, // 15 minutes
    REGISTER_ATTEMPTS_LIMIT: 3,
    REGISTER_ATTEMPTS_WINDOW: 60 * 60 * 1000, // 1 hour
    PASSWORD_RESET_ATTEMPTS_LIMIT: 3,
    PASSWORD_RESET_ATTEMPTS_WINDOW: 60 * 60 * 1000, // 1 hour
  },

  // Validation
  VALIDATION: {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 30,
      PATTERN: /^[a-zA-Z0-9_]+$/,
    },
    EMAIL: {
      MAX_LENGTH: 254,
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    FINGERPRINT_HASH: {
      MIN_LENGTH: 32,
      MAX_LENGTH: 128,
    },
  },

  // Security
  SECURITY: {
    PASSWORD_HASH_ALGORITHM: 'bcrypt',
    JWT_ALGORITHM: 'HS256',
    SESSION_TOKEN_LENGTH: 64,
    VERIFICATION_CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  },

  // Logging
  LOGGING: {
    SENSITIVE_FIELDS: [
      'password',
      'password_hashed',
      'token',
      'session_token',
      'access_token',
      'refresh_token',
    ],
    MASK_CHARACTER: '*',
    MASK_LENGTH: 8,
  },
};
