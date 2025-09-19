export const WALLET_CONSTANTS = {
  // Wallet Address Configuration
  ADDRESS: {
    // Ethereum address validation
    ETHEREUM: {
      LENGTH: 42, // 0x + 40 hex characters
      PATTERN: /^0x[a-fA-F0-9]{40}$/,
      PREFIX: '0x',
    },
    // Bitcoin address validation (simplified)
    BITCOIN: {
      MIN_LENGTH: 26,
      MAX_LENGTH: 62,
      PATTERN: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    },
    // Generic crypto address validation
    GENERIC: {
      MIN_LENGTH: 26,
      MAX_LENGTH: 62,
      PATTERN: /^[a-zA-Z0-9]{26,62}$/,
    },
  },

  // Wallet Status
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
    VERIFIED: 'verified',
    UNVERIFIED: 'unverified',
  },

  // Challenge Configuration
  CHALLENGE: {
    // Nonce message configuration
    NONCE: {
      EXPIRES_IN: 300, // 5 minutes in seconds
      MESSAGE_TEMPLATE: {
        LOGIN:
          'Welcome to Decode Wallet! To ensure the security of your wallet and verify your identity, please sign this message with your wallet. This cryptographic signature proves you control your wallet without revealing any sensitive information. By signing this message, you are requesting access to your wallet. This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.',
        LINK: 'Welcome to Decode Network! To link your wallet to your account, please sign this message with your wallet. This cryptographic signature proves you control your wallet without revealing any sensitive information. By signing this message, you are requesting access to your wallet. This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.',
        PRIMARY:
          'Welcome to Decode Network! To set your wallet as primary, please sign this message with your wallet. This cryptographic signature proves you control your wallet without revealing any sensitive information. By signing this message, you are requesting access to your wallet. This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.',
      },
    },
    // Signature validation
    SIGNATURE: {
      MIN_LENGTH: 130, // Minimum signature length
      MAX_LENGTH: 132, // Maximum signature length
      PATTERN: /^0x[a-fA-F0-9]{130,132}$/,
    },
  },

  // Primary Wallet Configuration
  PRIMARY: {
    MAX_PER_USER: 1, // Maximum primary wallets per user
    CAN_UNLINK: false, // Whether primary wallet can be unlinked
    REQUIRED_FOR_OPERATIONS: true, // Whether primary wallet is required for operations
  },

  // Wallet Limits
  LIMITS: {
    MAX_WALLETS_PER_USER: 10, // Maximum wallets per user
    MIN_WALLETS_FOR_PRIMARY: 1, // Minimum wallets required to set primary
    LINK_COOLDOWN: 60 * 1000, // 1 minute cooldown between link attempts
    PRIMARY_CHANGE_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours cooldown for primary changes
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
    // Wallet linking
    WALLET_LINK: {
      LIMIT: 5,
      WINDOW: 60 * 60 * 1000, // 1 hour
    },
    // Wallet unlinking
    WALLET_UNLINK: {
      LIMIT: 3,
      WINDOW: 60 * 60 * 1000, // 1 hour
    },
    // Primary wallet operations
    PRIMARY_WALLET: {
      SET_LIMIT: 3,
      SET_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
      UNSET_LIMIT: 1,
      UNSET_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
    },
    // Challenge generation
    CHALLENGE_GENERATION: {
      LOGIN_LIMIT: 10,
      LOGIN_WINDOW: 60 * 1000, // 1 minute
      LINK_LIMIT: 5,
      LINK_WINDOW: 60 * 1000, // 1 minute
      PRIMARY_LIMIT: 3,
      PRIMARY_WINDOW: 60 * 1000, // 1 minute
    },
    // Challenge validation
    CHALLENGE_VALIDATION: {
      LOGIN_LIMIT: 20,
      LOGIN_WINDOW: 60 * 1000, // 1 minute
      LINK_LIMIT: 10,
      LINK_WINDOW: 60 * 1000, // 1 minute
      PRIMARY_LIMIT: 5,
      PRIMARY_WINDOW: 60 * 1000, // 1 minute
    },
    // Wallet listing
    WALLET_LISTING: {
      LIMIT: 30,
      WINDOW: 60 * 1000, // 1 minute
    },
  },

  // Redis Configuration
  REDIS: {
    // Timeouts in seconds
    DEFAULT_TTL: 300, // 5 minutes
    CHALLENGE_TTL: 300, // 5 minutes
    RATE_LIMIT_TTL: 60, // 1 minute
    CACHE_TTL: 1800, // 30 minutes
    SESSION_TTL: 3600, // 1 hour

    // Key prefixes
    KEYS: {
      CHALLENGE: 'challenge',
      RATE_LIMIT: 'rate_limit',
      WALLET_CACHE: 'wallet_cache',
      PRIMARY_WALLET: 'primary_wallet',
      USER_WALLETS: 'user_wallets',
      WALLET_PASS_TOKEN: 'wallet_pass_token',
    },
  },

  // Validation Rules
  VALIDATION: {
    USER_ID: {
      PATTERN: /^[0-9a-fA-F]{24}$/, // MongoDB ObjectId
    },
    WALLET_ADDRESS: {
      ETHEREUM_PATTERN: /^0x[a-fA-F0-9]{40}$/,
      BITCOIN_PATTERN: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      GENERIC_PATTERN: /^[a-zA-Z0-9]{26,62}$/,
    },
    SIGNATURE: {
      PATTERN: /^0x[a-fA-F0-9]{130,132}$/,
      MIN_LENGTH: 130,
      MAX_LENGTH: 132,
    },
  },

  // Security Configuration
  SECURITY: {
    SIGNATURE_REQUIRED_FOR_OPERATIONS: true,
    CHALLENGE_EXPIRATION_ENABLED: true,
    RATE_LIMITING_ENABLED: true,
    PRIMARY_WALLET_PROTECTION: true,
    WALLET_OWNERSHIP_VERIFICATION: true,
  },

  // Logging Configuration
  LOGGING: {
    SENSITIVE_FIELDS: [
      'signature',
      'private_key',
      'seed_phrase',
      'challenge_message',
      'nonce',
    ],
    MASK_CHARACTER: '*',
    MASK_LENGTH: 8,
    AUDIT_EVENTS: [
      'wallet_linked',
      'wallet_unlinked',
      'primary_wallet_set',
      'primary_wallet_unset',
      'challenge_generated',
      'challenge_validated',
      'wallet_accessed',
    ],
  },

  // Error Codes
  ERROR_CODES: {
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    WALLET_ALREADY_LINKED: 'WALLET_ALREADY_LINKED',
    WALLET_NOT_LINKED: 'WALLET_NOT_LINKED',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    CHALLENGE_EXPIRED: 'CHALLENGE_EXPIRED',
    CHALLENGE_INVALID: 'CHALLENGE_INVALID',
    PRIMARY_WALLET_EXISTS: 'PRIMARY_WALLET_EXISTS',
    PRIMARY_WALLET_NOT_FOUND: 'PRIMARY_WALLET_NOT_FOUND',
    PRIMARY_WALLET_CANNOT_UNLINK: 'PRIMARY_WALLET_CANNOT_UNLINK',
    MAX_WALLETS_EXCEEDED: 'MAX_WALLETS_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_WALLET_ADDRESS: 'INVALID_WALLET_ADDRESS',
    WALLET_OWNERSHIP_VERIFICATION_FAILED:
      'WALLET_OWNERSHIP_VERIFICATION_FAILED',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    WALLET_LINKED: 'Wallet linked successfully',
    WALLET_UNLINKED: 'Wallet unlinked successfully',
    PRIMARY_WALLET_SET: 'Primary wallet set successfully',
    PRIMARY_WALLET_UNSET: 'Primary wallet unset successfully',
    CHALLENGE_GENERATED: 'Challenge generated successfully',
    CHALLENGE_VALIDATED: 'Challenge validated successfully',
    WALLETS_FETCHED: 'Wallets fetched successfully',
    WALLET_VERIFIED: 'Wallet verified successfully',
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
    WALLET_TTL: 30 * 60, // 30 minutes
    PRIMARY_WALLET_TTL: 60 * 60, // 1 hour
    USER_WALLETS_TTL: 15 * 60, // 15 minutes
    CHALLENGE_TTL: 5 * 60, // 5 minutes
    WALLET_PASS_TOKEN_TTL: 30, // 30 seconds
  },

  // External Service Configuration
  EXTERNAL_SERVICES: {
    AUTH_SERVICE: {
      TIMEOUT: 5000, // 5 seconds
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY: 1000, // 1 second
    },
    CRYPTO_SERVICE: {
      TIMEOUT: 10000, // 10 seconds
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY: 2000, // 2 seconds
    },
  },
};
