/**
 * @fileoverview Wallet Service Application Bootstrap
 *
 * This is the main entry point for the Decode Wallet Service application. It initializes
 * the NestJS application with validation configuration, exception filters, and starts
 * the HTTP server for handling wallet management requests.
 *
 * The Wallet Service provides comprehensive wallet management capabilities including:
 * - Wallet linking and management
 * - Primary wallet designation
 * - Secure cryptographic operations
 * - User authentication integration
 * - Wallet data persistence
 * - Caching for performance optimization
 * - Service-to-service communication
 * - Secure key handling
 *
 * Key Features:
 * - Document database integration with MongoDB
 * - Redis caching for performance optimization
 * - External service integration with Auth service
 * - Comprehensive input validation
 * - JWT-based service authentication
 * - Cryptographic security operations
 * - Secure wallet data handling
 *
 * Database Integration:
 * - MongoDB: Primary database for wallet data storage
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - Auth Service: User authentication and authorization
 * - Blockchain Networks: Cryptocurrency wallet operations
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application initialization
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// Application module
import { WalletModule } from './wallet.module';

// Global exception filters for centralized error handling
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

/**
 * Bootstrap function to initialize and configure the Wallet Service application
 *
 * This function sets up the complete application stack including:
 * - Application initialization with NestJS factory
 * - Global exception filters for error handling
 * - Global validation pipes for input validation
 * - Server startup with environment-based configuration
 * - Error handling and logging
 *
 * @returns Promise<void> - Resolves when the application is successfully started
 */
async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(WalletModule);

  // Configure global exception filters for centralized error handling
  app.useGlobalFilters(
    new ValidationExceptionFilter(), // Handle validation errors with proper formatting
    new HttpExceptionFilter(), // Handle HTTP exceptions with consistent error responses
  );

  // Configure global validation pipe for input validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable automatic type conversion
      },
    }),
  );

  // Get server configuration from environment variables
  const port = process.env.WALLET_PORT ?? 4003; // Default port 4003
  const host = process.env.WALLET_HOST
    ? process.env.WALLET_HOST.replace('http://', '').replace('https://', '') // Remove protocol prefixes
    : 'localhost'; // Default host localhost

  // Start the server and listen for incoming requests
  await app.listen(port, host);

  // Log successful startup information
  console.info(`[WalletService] Wallet service is running on ${host}:${port}`);
}

/**
 * Application startup with error handling
 *
 * This function starts the Wallet Service application and handles any startup errors.
 * If the application fails to start, it logs the error and exits the process.
 */
bootstrap().catch((error) => {
  console.error('Failed to start Wallet service:', error);
  process.exit(1); // Exit with error code 1
});
