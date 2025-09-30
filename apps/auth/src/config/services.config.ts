/**
 * @fileoverview Services Configuration
 *
 * This configuration file defines all external service URLs for the
 * Decode authentication system. It provides centralized configuration management
 * for service-to-service communication.
 *
 * Configuration Categories:
 * - User service communication URLs
 * - Email service communication URLs
 * - Other microservice endpoints
 *
 * Benefits:
 * - Centralized service URL management
 * - Environment-specific overrides
 * - Type safety and validation
 * - Easy maintenance and updates
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { registerAs } from '@nestjs/config';

/**
 * Services Configuration
 *
 * This configuration object contains all external service URLs
 * for the system. It provides centralized configuration management with
 * environment-specific overrides.
 *
 * @param registerAs - NestJS configuration registration function
 * @returns Configuration object with service URLs
 */
export default registerAs('services', () => ({
  user: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:4002',
  },
  email: {
    url: process.env.EMAIL_SERVICE_URL || 'http://localhost:4003',
  },
  relationship: {
    url: process.env.RELATIONSHIP_SERVICE_URL || 'http://localhost:4004',
  },
  wallet: {
    url: process.env.WALLET_SERVICE_URL || 'http://localhost:4005',
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
  },
}));
