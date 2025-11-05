/**
 * @fileoverview Relationship Service Application Bootstrap
 *
 * This is the main entry point for the Decode Relationship Service application. It initializes
 * the NestJS application with validation configuration and starts the HTTP server for
 * handling relationship management requests.
 *
 * The Relationship Service provides comprehensive social relationship management including:
 * - User following and unfollowing operations
 * - User blocking and unblocking functionality
 * - Mutual connection discovery and analysis
 * - User search and suggestion algorithms
 * - Follower analytics and snapshot collection
 * - Real-time relationship notifications
 * - Social graph traversal and analysis
 *
 * Key Features:
 * - Graph database integration with Neo4j
 * - Document storage with MongoDB for analytics
 * - Redis caching for performance optimization
 * - Automated daily follower snapshots
 * - Real-time notifications via RabbitMQ
 * - Comprehensive input validation
 * - JWT-based authentication
 * - Role-based access control
 *
 * Database Integration:
 * - Neo4j: Primary graph database for relationship data
 * - MongoDB: Document storage for follower snapshots
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - Notification Service: Real-time relationship notifications
 * - Auth Service: User authentication and authorization
 * - User Service: User profile and account information
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
import { RelationshipModule } from './relationship.module';

/**
 * Bootstrap function to initialize and configure the Relationship Service application
 *
 * This function sets up the complete application stack including:
 * - Application initialization with NestJS factory
 * - Global validation pipes for input validation
 * - Server startup with environment-based configuration
 * - Error handling and logging
 *
 * @returns Promise<void> - Resolves when the application is successfully started
 */
async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(RelationshipModule);

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
  const port = process.env.RELATIONSHIP_PORT ?? 4004; // Default port 4004
  const host = process.env.RELATIONSHIP_HOST
    ? process.env.RELATIONSHIP_HOST.replace('http://', '').replace(
        'https://',
        '',
      ) // Remove protocol prefixes
    : 'localhost'; // Default host localhost

  // Start the server and listen for incoming requests
  await app.listen(port, host);

  // Log successful startup information
  console.info(
    `[RelationshipService] Relationship service is running on ${host}:${port}`,
  );
}

/**
 * Application startup with error handling
 *
 * This function starts the Relationship Service application and handles any startup errors.
 * If the application fails to start, it logs the error and exits the process.
 */
bootstrap().catch((error) => {
  console.error('Failed to start Relationship service:', error);
  process.exit(1); // Exit with error code 1
});
