export const MESSAGES = {
  // Authentication & Login Errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid wallet address or signature',
    WALLET_NOT_FOUND: 'Wallet not found',
    ONLY_PRIMARY_WALLET_ALLOWED: 'Only primary wallet is allowed',
    ACCOUNT_LOCKED:
      'Account temporarily locked due to too many failed attempts',
    SESSION_EXPIRED: 'Session has expired',
    INVALID_TOKEN: 'Invalid or expired token',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    LOGIN_FAILED: 'Login failed',
    SIGNATURE_VERIFICATION_FAILED: 'Signature verification failed',
    WALLET_OWNERSHIP_VERIFICATION_FAILED:
      'Wallet ownership verification failed',
    LOGIN_CHALLENGE_GENERATION_FAILED: 'Failed to generate login challenge',
    LOGIN_CHALLENGE_VALIDATION_FAILED: 'Failed to validate login challenge',
    LOGIN_ERROR: 'Error during wallet login',
  },

  // Wallet Linking Errors
  WALLET_LINK: {
    WALLET_ALREADY_LINKED: 'Wallet already linked',
    WALLET_NOT_LINKED: 'Wallet not linked',
    LINK_CHALLENGE_GENERATION_FAILED: 'Failed to generate link challenge',
    LINK_CHALLENGE_VALIDATION_FAILED: 'Failed to validate link challenge',
    WALLET_LINKING_FAILED: 'Failed to link wallet',
    WALLET_UNLINKING_FAILED: 'Failed to unlink wallet',
    MAX_WALLETS_EXCEEDED: 'Maximum number of wallets exceeded',
    INVALID_WALLET_ADDRESS: 'Invalid wallet address format',
    WALLET_OWNERSHIP_VERIFICATION_REQUIRED:
      'Wallet ownership verification required',
    LINK_COOLDOWN_ACTIVE: 'Wallet linking cooldown is active',
    WALLET_LINK_ERROR: 'Error during wallet linking',
  },

  // Primary Wallet Errors
  PRIMARY_WALLET: {
    PRIMARY_WALLET_EXISTS: 'Primary wallet already exists',
    PRIMARY_WALLET_NOT_FOUND: 'Primary wallet not found',
    PRIMARY_WALLET_CANNOT_UNLINK: 'Primary wallet cannot be unlinked',
    PRIMARY_CHALLENGE_GENERATION_FAILED:
      'Failed to generate primary wallet challenge',
    PRIMARY_CHALLENGE_VALIDATION_FAILED:
      'Failed to validate primary wallet challenge',
    PRIMARY_WALLET_SET_FAILED: 'Failed to set primary wallet',
    PRIMARY_WALLET_UNSET_FAILED: 'Failed to unset primary wallet',
    PRIMARY_WALLET_ALREADY_SET: 'Wallet is already primary',
    PRIMARY_WALLET_NOT_SET: 'Wallet is not primary',
    PRIMARY_WALLET_CHANGE_COOLDOWN_ACTIVE:
      'Primary wallet change cooldown is active',
    PRIMARY_WALLET_ERROR: 'Error during primary wallet operation',
  },

  // Challenge & Signature Errors
  CHALLENGE: {
    CHALLENGE_EXPIRED: 'Challenge has expired',
    CHALLENGE_INVALID: 'Invalid challenge',
    CHALLENGE_NOT_FOUND: 'Challenge not found',
    CHALLENGE_GENERATION_FAILED: 'Failed to generate challenge',
    CHALLENGE_VALIDATION_FAILED: 'Failed to validate challenge',
    SIGNATURE_INVALID: 'Invalid signature',
    SIGNATURE_VERIFICATION_FAILED: 'Signature verification failed',
    SIGNATURE_MALFORMED: 'Malformed signature',
    NONCE_MESSAGE_GENERATION_FAILED: 'Failed to generate nonce message',
    NONCE_MESSAGE_VALIDATION_FAILED: 'Failed to validate nonce message',
    CHALLENGE_ERROR: 'Error during challenge operation',
  },

  // Wallet Management Errors
  WALLET_MANAGEMENT: {
    WALLET_NOT_FOUND: 'Wallet not found',
    WALLET_FETCH_FAILED: 'Failed to fetch wallet',
    WALLET_CREATION_FAILED: 'Failed to create wallet',
    WALLET_UPDATE_FAILED: 'Failed to update wallet',
    WALLET_DELETION_FAILED: 'Failed to delete wallet',
    WALLET_ALREADY_EXISTS: 'Wallet already exists',
    WALLET_ACCESS_DENIED: 'Access to wallet denied',
    WALLET_OPERATION_FAILED: 'Wallet operation failed',
    WALLET_VERIFICATION_FAILED: 'Wallet verification failed',
    WALLET_STATUS_INVALID: 'Invalid wallet status',
    WALLET_MANAGEMENT_ERROR: 'Error during wallet management',
  },

  // User Wallet Errors
  USER_WALLETS: {
    USER_WALLETS_NOT_FOUND: 'No wallets found for user',
    USER_WALLETS_FETCH_FAILED: 'Failed to fetch user wallets',
    USER_WALLET_LIMIT_EXCEEDED: 'User wallet limit exceeded',
    USER_WALLET_NOT_OWNED: 'User does not own this wallet',
    USER_WALLET_ACCESS_DENIED: 'Access to user wallet denied',
    USER_WALLET_OPERATION_FAILED: 'User wallet operation failed',
    USER_WALLET_ERROR: 'Error during user wallet operation',
  },

  // Validation Errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format',
    MIN_LENGTH: 'Minimum length not met',
    MAX_LENGTH: 'Maximum length exceeded',
    INVALID_TYPE: 'Invalid data type',
    INVALID_WALLET_ADDRESS_FORMAT: 'Invalid wallet address format',
    INVALID_SIGNATURE_FORMAT: 'Invalid signature format',
    INVALID_USER_ID_FORMAT: 'Invalid user ID format',
    INVALID_CHALLENGE_FORMAT: 'Invalid challenge format',
    INVALID_NONCE_FORMAT: 'Invalid nonce format',
  },

  // Database Errors
  DATABASE: {
    CONNECTION_FAILED: 'Database connection failed',
    QUERY_FAILED: 'Database query failed',
    SAVE_FAILED: 'Failed to save wallet data',
    UPDATE_FAILED: 'Failed to update wallet data',
    DELETE_FAILED: 'Failed to delete wallet data',
    TRANSACTION_FAILED: 'Database transaction failed',
    VALIDATION_FAILED: 'Database validation failed',
    WALLET_NOT_FOUND: 'Wallet not found in database',
    DUPLICATE_WALLET: 'Duplicate wallet entry',
  },

  // Redis Errors
  REDIS: {
    CONNECTION_FAILED: 'Redis connection failed',
    SET_FAILED: 'Failed to set data in Redis',
    GET_FAILED: 'Failed to get data from Redis',
    DELETE_FAILED: 'Failed to delete data from Redis',
    KEY_NOT_FOUND: 'Key not found in Redis',
    EXPIRATION_FAILED: 'Failed to set expiration in Redis',
    CHALLENGE_CACHE_FAILED: 'Failed to cache challenge',
    RATE_LIMIT_CACHE_FAILED: 'Failed to cache rate limit',
  },

  // Server Errors
  SERVER: {
    INTERNAL_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    TIMEOUT: 'Request timeout',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    MAINTENANCE_MODE: 'Service is under maintenance',
    CONFIGURATION_ERROR: 'Configuration error',
    CRYPTO_SERVICE_ERROR: 'Cryptographic service error',
    AUTH_SERVICE_ERROR: 'Authentication service error',
  },

  // Microservice Errors
  MICROSERVICE: {
    AUTH_SERVICE_UNAVAILABLE: 'Authentication service unavailable',
    AUTH_SERVICE_ERROR: 'Authentication service error',
    CRYPTO_SERVICE_UNAVAILABLE: 'Cryptographic service unavailable',
    CRYPTO_SERVICE_ERROR: 'Cryptographic service error',
    COMMUNICATION_FAILED: 'Microservice communication failed',
    TIMEOUT: 'Microservice timeout',
    SERVICE_DISCOVERY_FAILED: 'Service discovery failed',
  },

  // Rate Limiting Errors
  RATE_LIMIT: {
    WALLET_LINK_LIMIT_EXCEEDED: 'Wallet linking rate limit exceeded',
    WALLET_UNLINK_LIMIT_EXCEEDED: 'Wallet unlinking rate limit exceeded',
    PRIMARY_WALLET_LIMIT_EXCEEDED:
      'Primary wallet operation rate limit exceeded',
    CHALLENGE_GENERATION_LIMIT_EXCEEDED:
      'Challenge generation rate limit exceeded',
    CHALLENGE_VALIDATION_LIMIT_EXCEEDED:
      'Challenge validation rate limit exceeded',
    WALLET_LISTING_LIMIT_EXCEEDED: 'Wallet listing rate limit exceeded',
    GENERAL_RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later',
  },

  // Security Errors
  SECURITY: {
    SIGNATURE_TAMPERING_DETECTED: 'Signature tampering detected',
    CHALLENGE_REPLAY_ATTACK: 'Challenge replay attack detected',
    INVALID_NONCE: 'Invalid nonce detected',
    WALLET_ADDRESS_SPOOFING: 'Wallet address spoofing detected',
    UNAUTHORIZED_WALLET_ACCESS: 'Unauthorized wallet access attempt',
    SECURITY_VIOLATION: 'Security violation detected',
    SUSPICIOUS_ACTIVITY: 'Suspicious activity detected',
  },

  // Success Messages
  SUCCESS: {
    // Authentication Success
    LOGIN_SUCCESSFUL: 'Wallet login successful',
    LOGIN_CHALLENGE_GENERATED: 'Login challenge generated successfully',
    LOGIN_CHALLENGE_VALIDATED: 'Login challenge validated successfully',
    SIGNATURE_VERIFIED: 'Signature verified successfully',
    WALLET_OWNERSHIP_VERIFIED: 'Wallet ownership verified successfully',

    // Wallet Linking Success
    WALLET_LINKED: 'Wallet linked successfully',
    WALLET_UNLINKED: 'Wallet unlinked successfully',
    LINK_CHALLENGE_GENERATED: 'Link challenge generated successfully',
    LINK_CHALLENGE_VALIDATED: 'Link challenge validated successfully',
    WALLET_LINKING_INITIATED: 'Wallet linking initiated successfully',

    // Primary Wallet Success
    PRIMARY_WALLET_SET: 'Primary wallet set successfully',
    PRIMARY_WALLET_UNSET: 'Primary wallet unset successfully',
    PRIMARY_CHALLENGE_GENERATED:
      'Primary wallet challenge generated successfully',
    PRIMARY_CHALLENGE_VALIDATED:
      'Primary wallet challenge validated successfully',
    PRIMARY_WALLET_CHANGED: 'Primary wallet changed successfully',
    PRIMARY_WALLET_FETCHED: 'Primary wallet fetched successfully',
    PRIMARY_WALLET_VALID: 'Primary wallet is valid',
    // Wallet Management Success
    WALLET_CREATED: 'Wallet created successfully',
    WALLET_UPDATED: 'Wallet updated successfully',
    WALLET_DELETED: 'Wallet deleted successfully',
    WALLET_FETCHED: 'Wallet fetched successfully',
    WALLETS_FETCHED: 'Wallets fetched successfully',
    WALLET_VERIFIED: 'Wallet verified successfully',

    // Challenge Success
    CHALLENGE_GENERATED: 'Challenge generated successfully',
    CHALLENGE_VALIDATED: 'Challenge validated successfully',
    NONCE_MESSAGE_GENERATED: 'Nonce message generated successfully',
    NONCE_MESSAGE_VALIDATED: 'Nonce message validated successfully',

    // General Success
    OPERATION_SUCCESSFUL: 'Operation completed successfully',
    DATA_FETCHED: 'Data fetched successfully',
    CACHE_UPDATED: 'Cache updated successfully',
    RATE_LIMIT_RESET: 'Rate limit reset successfully',
  },

  // Info Messages
  INFO: {
    WALLET_ALREADY_LINKED: 'Wallet is already linked',
    WALLET_NOT_LINKED: 'Wallet is not linked',
    PRIMARY_WALLET_EXISTS: 'Primary wallet already exists',
    PRIMARY_WALLET_NOT_SET: 'No primary wallet set',
    WALLET_LIMIT_REACHED: 'Wallet limit reached',
    CHALLENGE_EXPIRED: 'Challenge has expired',
    RATE_LIMIT_ACTIVE: 'Rate limit is active',
    COOLDOWN_ACTIVE: 'Cooldown period is active',
  },

  // Warning Messages
  WARNING: {
    WALLET_ADDRESS_FORMAT: 'Wallet address format may be invalid',
    SIGNATURE_FORMAT: 'Signature format may be invalid',
    CHALLENGE_EXPIRING: 'Challenge is expiring soon',
    RATE_LIMIT_APPROACHING: 'Rate limit is approaching',
    PRIMARY_WALLET_CHANGE: 'Changing primary wallet will affect operations',
    WALLET_UNLINKING: 'Unlinking wallet will remove access',
  },
};
