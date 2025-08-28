import { registerAs } from '@nestjs/config';

export default registerAs('environment', () => ({
  // Rate Limiting Configuration
  rateLimit: {
    // Global rate limiting
    global: {
      enabled: process.env.RATE_LIMIT_GLOBAL_ENABLED === 'true' || true,
      windowMs: parseInt(
        process.env.RATE_LIMIT_GLOBAL_WINDOW_MS || '900000',
        10,
      ), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100', 10), // 100 requests per window
      message:
        process.env.RATE_LIMIT_GLOBAL_MESSAGE ||
        'Too many requests from this IP, please try again later.',
      standardHeaders:
        process.env.RATE_LIMIT_GLOBAL_STANDARD_HEADERS === 'true' || true,
      legacyHeaders:
        process.env.RATE_LIMIT_GLOBAL_LEGACY_HEADERS === 'true' || false,
    },

    // Authentication endpoints rate limiting
    auth: {
      login: {
        windowMs: parseInt(
          process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW_MS || '900000',
          10,
        ), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_MAX || '5', 10), // 5 attempts per window
        message: 'Too many login attempts, please try again later.',
      },
      register: {
        windowMs: parseInt(
          process.env.RATE_LIMIT_AUTH_REGISTER_WINDOW_MS || '3600000',
          10,
        ), // 1 hour
        max: parseInt(process.env.RATE_LIMIT_AUTH_REGISTER_MAX || '3', 10), // 3 attempts per window
        message: 'Too many registration attempts, please try again later.',
      },
      forgotPassword: {
        windowMs: parseInt(
          process.env.RATE_LIMIT_AUTH_FORGOT_PASSWORD_WINDOW_MS || '3600000',
          10,
        ), // 1 hour
        max: parseInt(
          process.env.RATE_LIMIT_AUTH_FORGOT_PASSWORD_MAX || '3',
          10,
        ), // 3 attempts per window
        message: 'Too many password reset attempts, please try again later.',
      },
      verifyEmail: {
        windowMs: parseInt(
          process.env.RATE_LIMIT_AUTH_VERIFY_EMAIL_WINDOW_MS || '300000',
          10,
        ), // 5 minutes
        max: parseInt(process.env.RATE_LIMIT_AUTH_VERIFY_EMAIL_MAX || '5', 10), // 5 attempts per window
        message:
          'Too many email verification attempts, please try again later.',
      },
    },

    // User-specific rate limiting (when authenticated)
    user: {
      windowMs: parseInt(process.env.RATE_LIMIT_USER_WINDOW_MS || '60000', 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_USER_MAX || '60', 10), // 60 requests per minute
      message: 'Too many requests, please try again later.',
    },

    // Admin endpoints rate limiting
    admin: {
      windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || '60000', 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '100', 10), // 100 requests per minute
      message: 'Too many admin requests, please try again later.',
    },
  },

  // Redis configuration for rate limiting storage
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'rate_limit:',
  },

  // Environment settings
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
}));
