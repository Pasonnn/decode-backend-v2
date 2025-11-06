/**
 * @fileoverview User Service Application Bootstrap
 *
 * This is the main entry point for the Decode User Service application. It initializes
 * the NestJS application with validation configuration, exception filters, and starts
 * the HTTP server for handling user management requests.
 *
 * The User Service provides comprehensive user management capabilities including:
 * - User profile management and updates
 * - Username change with email verification
 * - Email change with verification process
 * - User search and discovery
 * - Account deactivation and reactivation
 * - Avatar and bio management
 * - User data synchronization with Neo4j
 * - Asynchronous email notifications
 *
 * Key Features:
 * - Document database integration with MongoDB
 * - Redis caching for performance optimization
 * - Asynchronous email processing via RabbitMQ
 * - Neo4j synchronization for graph data
 * - Comprehensive input validation
 * - JWT-based service authentication
 * - Email verification for sensitive operations
 *
 * Database Integration:
 * - MongoDB: Primary database for user data storage
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - Email Service: Asynchronous email processing
 * - Neo4j Sync Service: Graph database synchronization
 * - Auth Service: User authentication and authorization
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Datadog observability
import 'dd-trace/init';

// Core NestJS modules for application initialization
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

// Application module
import { UserModule } from './user.module';

// Global exception filters for centralized error handling
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

/**
 * Bootstrap function to initialize and configure the User Service application
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
  const app = await NestFactory.create(UserModule);

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
  const port = process.env.USER_PORT ?? 4002; // Default port 4002
  const host = process.env.USER_HOST
    ? process.env.USER_HOST.replace('http://', '').replace('https://', '') // Remove protocol prefixes
    : 'localhost'; // Default host localhost

  // Start the server and listen for incoming requests
  await app.listen(port, host);

  // Log successful startup information
  console.info(`[UserService] User service is running on ${host}:${port}`);
}

/**
 * Application startup with error handling
 *
 * This function starts the User Service application and handles any startup errors.
 * If the application fails to start, it logs the error and exits the process.
 */
bootstrap().catch((error) => {
  console.error('Failed to start User service:', error);
  process.exit(1); // Exit with error code 1
});
