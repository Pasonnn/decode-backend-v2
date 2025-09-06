export const USER_CONSTANTS = {
  // User Profile Configuration
  PROFILE: {
    // Display Name Validation
    DISPLAY_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
    },

    // Biography Validation
    BIOGRAPHY: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 500,
      DEFAULT: 'Hi, i am a new Decode User',
    },

    // Avatar Configuration
    AVATAR: {
      IPFS_HASH: {
        MIN_LENGTH: 46, // IPFS CID v0 length
        MAX_LENGTH: 62, // IPFS CID v1 length
        PATTERN: /^[a-zA-Z0-9]{46,62}$/,
        DEFAULT: 'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
      },
      FALLBACK_URL: {
        MAX_LENGTH: 500,
        PATTERN: /^https?:\/\/.+/,
        DEFAULT:
          'https://res.cloudinary.com/dfzu1b238/image/upload/v1748419831/default_user_icon_rt4zcm.png',
      },
      ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
    },

    // Profile Picture Upload
    PICTURE_UPLOAD: {
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_MIME_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      MAX_DIMENSIONS: {
        WIDTH: 2048,
        HEIGHT: 2048,
      },
      MIN_DIMENSIONS: {
        WIDTH: 100,
        HEIGHT: 100,
      },
    },
  },

  // Username Configuration
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    RESERVED_NAMES: [
      'admin',
      'administrator',
      'moderator',
      'mod',
      'support',
      'help',
      'info',
      'contact',
      'about',
      'terms',
      'privacy',
      'login',
      'logout',
      'register',
      'signup',
      'signin',
      'api',
      'docs',
      'status',
      'health',
      'system',
      'root',
      'guest',
      'anonymous',
      'null',
      'undefined',
      'test',
      'demo',
      'example',
      'sample',
      'temp',
      'tmp',
      'backup',
      'old',
      'new',
    ],
    CHANGE_COOLDOWN: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  },

  // Email Configuration
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 254,
    PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    CHANGE_COOLDOWN: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    TYPES: {
      USERNAME_CHANGE_VERIFY: 'username-change-verify',
      EMAIL_CHANGE_VERIFY: 'email-change-verify',
      NEW_EMAIL_CHANGE_VERIFY: 'new-email-change-verify',
    },
  },

  // Verification Configuration
  VERIFICATION: {
    CODE_LENGTH: 6,
    EXPIRES_IN: 300, // 5 minutes in seconds
    MAX_ATTEMPTS: 3,
    ATTEMPT_WINDOW: 900, // 15 minutes in seconds
    RESEND_COOLDOWN: 60, // 1 minute in seconds
  },

  // User Roles Configuration
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    DEFAULT: 'user',
    ALL: ['user', 'admin', 'moderator'],
  },

  // Search Configuration
  SEARCH: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MIN_PAGE: 1,
    MAX_PAGE: 1000,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100,
    MIN_QUERY_LENGTH: 1,
    MAX_QUERY_LENGTH: 100,
    SORT_FIELDS: ['username', 'display_name', 'created_at'],
    SORT_ORDERS: ['asc', 'desc'],
  },

  // Account Management
  ACCOUNT: {
    DEACTIVATION: {
      REASON_MAX_LENGTH: 500,
      COOLDOWN_PERIOD: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      AUTO_DELETE_AFTER: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
    },
    REACTIVATION: {
      MAX_ATTEMPTS: 3,
      ATTEMPT_WINDOW: 60 * 60, // 1 hour in seconds
    },
  },

  // HTTP Status Codes
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Rate Limiting Configuration
  RATE_LIMIT: {
    // Profile Updates
    PROFILE_UPDATE: {
      LIMIT: 10,
      WINDOW: 60 * 60 * 1000, // 1 hour
    },

    // Username Changes
    USERNAME_CHANGE: {
      INITIATE_LIMIT: 3,
      INITIATE_WINDOW: 60 * 60 * 1000, // 1 hour
      VERIFY_LIMIT: 5,
      VERIFY_WINDOW: 15 * 60 * 1000, // 15 minutes
    },

    // Email Changes
    EMAIL_CHANGE: {
      INITIATE_LIMIT: 3,
      INITIATE_WINDOW: 60 * 60 * 1000, // 1 hour
      VERIFY_LIMIT: 5,
      VERIFY_WINDOW: 15 * 60 * 1000, // 15 minutes
    },

    // Profile Picture Upload
    PICTURE_UPLOAD: {
      LIMIT: 5,
      WINDOW: 60 * 60 * 1000, // 1 hour
    },

    // User Search
    SEARCH: {
      LIMIT: 30,
      WINDOW: 60 * 1000, // 1 minute
    },

    // Account Management
    ACCOUNT_DEACTIVATE: {
      LIMIT: 3,
      WINDOW: 24 * 60 * 60 * 1000, // 24 hours
    },

    ACCOUNT_REACTIVATE: {
      LIMIT: 5,
      WINDOW: 60 * 60 * 1000, // 1 hour
    },
  },

  // Redis Configuration
  REDIS: {
    // Timeouts in seconds
    DEFAULT_TTL: 300, // 5 minutes
    SESSION_TTL: 3600, // 1 hour
    VERIFICATION_TTL: 300, // 5 minutes
    RATE_LIMIT_TTL: 60, // 1 minute
    CACHE_TTL: 1800, // 30 minutes

    // Key prefixes
    KEYS: {
      SESSION: 'session',
      VERIFICATION: 'verification',
      RATE_LIMIT: 'rate_limit',
      USERNAME_CHANGE: 'username_change',
      EMAIL_CHANGE: 'email_change',
      NEW_EMAIL_CHANGE: 'new_email_change',
      PASSWORD_RESET: 'password_reset',
      LOGIN_ATTEMPT: 'login_attempt',
    },
  },

  // Validation Rules
  VALIDATION: {
    USER_ID: {
      PATTERN: /^[0-9a-fA-F]{24}$/, // MongoDB ObjectId
    },
    DISPLAY_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
    },
    BIOGRAPHY: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 500,
    },
    AVATAR_IPFS_HASH: {
      MIN_LENGTH: 46,
      MAX_LENGTH: 62,
      PATTERN: /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafy[a-z2-7]{55}$/,
    },
    AVATAR_FALLBACK_URL: {
      MAX_LENGTH: 500,
      PATTERN: /^https?:\/\/.+/,
    },
  },

  // Security Configuration
  SECURITY: {
    PASSWORD_REQUIRED_FOR_CHANGES: true,
    VERIFICATION_CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    SESSION_REQUIRED_FOR_CHANGES: true,
    ADMIN_ACTION_AUDIT: true,
  },

  // Logging Configuration
  LOGGING: {
    SENSITIVE_FIELDS: [
      'password',
      'password_hashed',
      'email',
      'verification_code',
      'session_token',
      'access_token',
    ],
    MASK_CHARACTER: '*',
    MASK_LENGTH: 8,
    AUDIT_EVENTS: [
      'profile_update',
      'username_change',
      'email_change',
      'avatar_upload',
      'account_deactivate',
      'account_reactivate',
      'role_change',
    ],
  },

  // Error Messages
  MESSAGES: {
    USER_NOT_FOUND: 'User not found',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    INVALID_VERIFICATION_CODE: 'Invalid verification code',
    VERIFICATION_CODE_EXPIRED: 'Verification code has expired',
    TOO_MANY_ATTEMPTS: 'Too many attempts, please try again later',
    INVALID_FILE_FORMAT: 'Invalid file format',
    FILE_TOO_LARGE: 'File size too large',
    INVALID_IPFS_HASH: 'Invalid IPFS hash format',
    INVALID_URL: 'Invalid URL format',
    USERNAME_CHANGE_COOLDOWN: 'Username can only be changed once every 30 days',
    EMAIL_CHANGE_COOLDOWN: 'Email can only be changed once every 7 days',
    ACCOUNT_DEACTIVATED: 'Account is deactivated',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    PROFILE: {
      PROFILE_NOT_FOUND: 'Profile not found',
    },
    USERNAME: {
      USERNAME_CHANGE_COOLDOWN_ACTIVE: 'Username change cooldown is active',
      USERNAME_CHANGE_CODE_INVALID: 'Invalid username change verification code',
    },
    EMAIL_CHANGE: {
      NEW_EMAIL_ALREADY_EXISTS: 'New email already exists',
      EMAIL_CHANGE_CODE_INVALID: 'Invalid email change verification code',
    },
    USER_INFO: {
      USER_NOT_FOUND: 'User not found',
    },
    SEARCH: {
      SEARCH_FAILED: 'Search operation failed',
    },
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    PROFILE_UPDATED: 'Profile updated successfully',
    USERNAME_CHANGE_INITIATED: 'Username change initiated, check your email',
    USERNAME_CHANGED: 'Username changed successfully',
    EMAIL_CHANGE_INITIATED: 'Email change initiated, check your new email',
    EMAIL_CHANGED: 'Email changed successfully',
    AVATAR_UPLOADED: 'Profile picture uploaded successfully',
    AVATAR_REMOVED: 'Profile picture removed successfully',
    ACCOUNT_DEACTIVATED: 'Account deactivated successfully',
    ACCOUNT_REACTIVATED: 'Account reactivated successfully',
    VERIFICATION_CODE_SENT: 'Verification code sent successfully',
    PROFILE_FETCHED: 'Profile fetched successfully',
    USERNAME_CHANGE_CODE_VERIFIED: 'Username change code verified successfully',
    EMAIL_CHANGE_CODE_VERIFIED: 'Email change code verified successfully',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    USERNAME_AVAILABLE: 'Username is available',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    EMAIL_AVAILABLE: 'Email is available',
    SEARCH_SUCCESSFUL: 'Search completed successfully',
    EMAIL_VERIFICATION_SENT: 'Email verification sent successfully',
  },

  // Pagination Configuration
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
    MAX_PAGE: 1000,
  },

  // Cache Configuration
  CACHE: {
    PROFILE_TTL: 30 * 60, // 30 minutes
    SEARCH_TTL: 5 * 60, // 5 minutes
    SUGGESTIONS_TTL: 10 * 60, // 10 minutes
    PUBLIC_PROFILE_TTL: 60 * 60, // 1 hour
  },
};
