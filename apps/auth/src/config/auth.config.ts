import { registerAs } from '@nestjs/config';

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
