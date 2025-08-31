import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // JWT Secret Keys - These should come from environment variables for security
  secret: {
    accessToken: process.env.JWT_ACCESS_TOKEN_SECRET,
    sessionToken: process.env.JWT_SESSION_TOKEN_SECRET,
    emailVerification: process.env.JWT_EMAIL_VERIFICATION_SECRET,
  },

  // Token Configuration
  accessToken: {
    expiresIn: '1d', // 1 day
    algorithm: 'HS256',
    issuer: 'decode-auth-service',
    audience: 'decode-frontend',
  },

  sessionToken: {
    expiresIn: '30d', // 30 days
    algorithm: 'HS256',
    issuer: 'decode-auth-service',
    audience: 'decode-frontend',
  },

  // Email Verification Token
  emailVerification: {
    expiresIn: '10m', // 10 minutes
    algorithm: 'HS256',
    issuer: 'decode-auth-service',
    audience: 'decode-frontend',
  },

  // Password Reset Token
  passwordReset: {
    expiresIn: '1h', // 1 hour
    algorithm: 'HS256',
    issuer: 'decode-auth-service',
    audience: 'decode-frontend',
  },

  // Token Refresh Configuration
  refresh: {
    enableRotation: true,
    maxRefreshCount: 100,
    refreshThreshold: 300, // 5 minutes before expiry
  },

  // Security Settings
  security: {
    blacklistEnabled: true,
    requireFingerprint: false,
    fingerprintClaim: 'fpr',
  },
}));
