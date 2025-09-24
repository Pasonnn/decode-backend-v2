/**
 * @fileoverview JWT Configuration
 *
 * This configuration file defines all JWT-related settings for the Decode
 * authentication system. It provides centralized configuration management
 * for token generation, validation, and security.
 *
 * JWT Configuration Categories:
 * - Secret keys for token signing and validation
 * - Token expiration times and lifecycle management
 * - Issuer and audience validation settings
 * - Algorithm and security configurations
 * - Token refresh and rotation settings
 * - Security policies and restrictions
 *
 * Security Considerations:
 * - Secret keys should be stored in environment variables
 * - Token expiration times balance security and user experience
 * - Issuer and audience validation prevent token misuse
 * - Algorithm selection affects security and performance
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { registerAs } from '@nestjs/config';

/**
 * JWT Configuration
 *
 * This configuration object contains all JWT-related settings for the system.
 * It provides centralized configuration management with environment-specific
 * overrides for security and flexibility.
 *
 * @param registerAs - NestJS configuration registration function
 * @returns Configuration object with JWT settings
 */
export default registerAs('jwt', () => ({
  // JWT Secret Keys - These should come from environment variables for security
  secret: {
    servicesToken: process.env.JWT_SERVICE_TOKEN_SECRET,
  },

  servicesToken: {
    expiresIn: '5s', // 5 seconds
    algorithm: 'HS256',
    issuer: 'decode-user-service',
    audience: 'decode-user-service',
    authIssuer: 'decode-auth-service',
  },
}));
