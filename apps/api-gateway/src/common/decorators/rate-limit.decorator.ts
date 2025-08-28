import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  keyGenerator?: (request: any) => string; // Custom key generator function
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  standardHeaders?: boolean; // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders?: boolean; // Return rate limit info in the `X-RateLimit-*` headers
  handler?: (request: any, response: any) => void; // Custom handler when limit is exceeded
}

export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Rate Limit Decorator
 *
 * Usage examples:
 *
 * // Basic rate limiting
 * @RateLimit({ windowMs: 60000, max: 10 })
 *
 * // Auth-specific rate limiting
 * @RateLimit({ windowMs: 900000, max: 5, message: 'Too many login attempts' })
 *
 * // User-specific rate limiting (requires authentication)
 * @RateLimit({
 *   windowMs: 60000,
 *   max: 60,
 *   keyGenerator: (req) => req.user?.userId || req.ip
 * })
 *
 * // Admin rate limiting
 * @RateLimit({
 *   windowMs: 60000,
 *   max: 100,
 *   keyGenerator: (req) => `admin:${req.user?.userId}`
 * })
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Predefined rate limit decorators for common use cases
 */

// Authentication rate limits
export const AuthRateLimit = {
  login: () =>
    RateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: 'Too many login attempts, please try again later.',
      keyGenerator: (req) => `auth:login:${req.ip}`,
    }),

  register: () =>
    RateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: 'Too many registration attempts, please try again later.',
      keyGenerator: (req) => `auth:register:${req.ip}`,
    }),

  forgotPassword: () =>
    RateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: 'Too many password reset attempts, please try again later.',
      keyGenerator: (req) => `auth:forgot:${req.ip}`,
    }),

  verifyEmail: () =>
    RateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 5,
      message: 'Too many email verification attempts, please try again later.',
      keyGenerator: (req) => `auth:verify:${req.ip}`,
    }),
};

// User-specific rate limits (requires authentication)
export const UserRateLimit = {
  standard: () =>
    RateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60,
      message: 'Too many requests, please try again later.',
      keyGenerator: (req) => `user:${req.user?.userId || req.ip}`,
    }),

  strict: () =>
    RateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30,
      message: 'Too many requests, please try again later.',
      keyGenerator: (req) => `user:strict:${req.user?.userId || req.ip}`,
    }),

  burst: () =>
    RateLimit({
      windowMs: 10 * 1000, // 10 seconds
      max: 10,
      message: 'Too many requests, please slow down.',
      keyGenerator: (req) => `user:burst:${req.user?.userId || req.ip}`,
    }),
};

// Admin rate limits
export const AdminRateLimit = {
  standard: () =>
    RateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      message: 'Too many admin requests, please try again later.',
      keyGenerator: (req) => `admin:${req.user?.userId || req.ip}`,
    }),

  strict: () =>
    RateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 50,
      message: 'Too many admin requests, please try again later.',
      keyGenerator: (req) => `admin:strict:${req.user?.userId || req.ip}`,
    }),
};

// IP-based rate limits
export const IPRateLimit = {
  standard: () =>
    RateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
      keyGenerator: (req) => `ip:${req.ip}`,
    }),

  strict: () =>
    RateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30,
      message: 'Too many requests from this IP, please try again later.',
      keyGenerator: (req) => `ip:strict:${req.ip}`,
    }),
};
