/**
 * @fileoverview Authentication Service Bootstrap
 *
 * This is the main entry point for the Decode Authentication Service, a microservice
 * responsible for handling user authentication, authorization, session management,
 * and security operations within the Decode ecosystem.
 *
 * The service provides comprehensive authentication features including:
 * - User registration with email verification
 * - Secure login with device fingerprinting
 * - JWT-based session management
 * - Password management and reset functionality
 * - Single Sign-On (SSO) capabilities
 * - Device fingerprint tracking and verification
 * - Role-based access control
 *
 * Architecture:
 * - Built on NestJS framework for enterprise-grade scalability
 * - Uses MongoDB for persistent data storage
 * - Redis for caching and temporary data (verification codes, sessions)
 * - RabbitMQ for asynchronous email communication
 * - JWT tokens for stateless authentication
 *
 * Security Features:
 * - Bcrypt password hashing with configurable salt rounds
 * - Device fingerprinting for enhanced security
 * - Email verification for account creation and device trust
 * - Rate limiting and brute force protection
 * - Comprehensive input validation and sanitization
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

// Datadog observability
import 'dd-trace/init';

/**
 * Bootstrap function to initialize and start the Authentication Service
 *
 * This function performs the following initialization steps:
 * 1. Creates the NestJS application instance with AuthModule
 * 2. Configures global exception filters for consistent error handling
 * 3. Sets up global validation pipes for request validation
 * 4. Configures the server to listen on the specified host and port
 *
 * Global Configuration:
 * - Exception Filters: Handle HTTP exceptions and validation errors consistently
 * - Validation Pipe: Automatically validates incoming requests against DTOs
 * - CORS: Configured for cross-origin requests (if needed)
 * - Security: Implements comprehensive security measures
 *
 * Environment Variables:
 * - AUTH_PORT: Port number for the service (default: 4001)
 * - AUTH_HOST: Host address for the service (default: 0.0.0.0)
 * - MONGO_URI: MongoDB connection string
 * - REDIS_URI: Redis connection string
 * - RABBITMQ_URI: RabbitMQ connection string for email service
 * - JWT_ACCESS_TOKEN_SECRET: Secret key for access token signing
 * - JWT_SESSION_TOKEN_SECRET: Secret key for session token signing
 *
 * @returns Promise<void> Resolves when the service is successfully started
 * @throws Error if the service fails to start
 */
async function bootstrap() {
  // Create the NestJS application instance with the AuthModule
  // The AuthModule contains all the necessary providers, controllers, and configurations
  const app = await NestFactory.create(AuthModule);

  // Configure global exception filters for consistent error handling across the application
  // These filters ensure that all errors are formatted consistently and logged appropriately
  app.useGlobalFilters(
    new ValidationExceptionFilter(), // Handles validation errors with detailed field information
    new HttpExceptionFilter(), // Handles HTTP exceptions and external service errors
  );

  // Configure global validation pipe for automatic request validation
  // This ensures all incoming requests are validated against their respective DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that don't have validation decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion for better DX
      },
    }),
  );

  // Configure server host and port from environment variables
  // Default values ensure the service can run in various environments
  const port = process.env.AUTH_PORT ?? 4001;
  const host = process.env.AUTH_HOST ?? '0.0.0.0';

  // Start the server and listen for incoming requests
  await app.listen(port, host);

  // Log successful startup with service information
  console.info(`[AuthService] Auth service is running on ${host}:${port}`);
}

/**
 * Start the authentication service with error handling
 *
 * If the service fails to start, it will log the error and exit with code 1
 * This ensures proper error reporting and prevents the service from running in an invalid state
 */
bootstrap().catch((error) => {
  console.error('Failed to start Auth service:', error);
  process.exit(1);
});
