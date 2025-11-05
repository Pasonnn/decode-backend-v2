/**
 * @fileoverview Notification Service Application Bootstrap
 *
 * This is the main entry point for the Decode Notification Service application. It initializes
 * the NestJS application with microservice configuration, WebSocket support, validation,
 * and Swagger documentation for handling real-time notifications and messaging.
 *
 * The Notification Service provides comprehensive notification management capabilities including:
 * - Real-time push notifications via WebSocket
 * - Notification creation and management
 * - Notification history and persistence
 * - Mark notifications as read/unread
 * - Pagination and filtering for notifications
 * - RabbitMQ message consumption
 * - WebSocket connection management
 * - JWT-based authentication
 *
 * Key Features:
 * - Microservice architecture with RabbitMQ integration
 * - WebSocket support for real-time communication
 * - Document database integration with MongoDB
 * - Redis caching for WebSocket connection management
 * - Comprehensive input validation
 * - Swagger/OpenAPI documentation
 * - CORS support for cross-origin requests
 * - JWT-based authentication
 *
 * Database Integration:
 * - MongoDB: Primary database for notification data storage
 * - Redis: Caching layer for WebSocket connection management
 *
 * External Services:
 * - RabbitMQ: Message queue for notification processing
 * - WebSocket Clients: Real-time notification delivery
 * - Auth Service: User authentication and authorization
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application initialization
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

// Application module
import { NotificationModule } from './notification.module';

// Datadog observability
import 'dd-trace/init';

/**
 * Bootstrap function to initialize and configure the Notification Service application
 *
 * This function sets up the complete application stack including:
 * - Application initialization with NestJS factory
 * - Microservice configuration with RabbitMQ
 * - WebSocket support with CORS configuration
 * - Global validation pipes for input validation
 * - Swagger documentation setup
 * - Server startup with environment-based configuration
 * - Error handling and logging
 *
 * @returns Promise<void> - Resolves when the application is successfully started
 */
async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(NotificationModule);

  // Configure RabbitMQ microservice for notification processing
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ, // RabbitMQ transport protocol
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'], // RabbitMQ connection URLs
      queue: 'notification_queue', // Queue name for notification messages
      queueOptions: {
        durable: true, // Persist queue across broker restarts
      },
    },
  });

  // Enable CORS for WebSocket connections and cross-origin requests
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*', // Allow requests from frontend or all origins
    credentials: true, // Allow credentials in CORS requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });

  // Configure global validation pipe for input validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    }),
  );

  // Configure Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Notification Service API') // API title
    .setDescription('API for managing notifications with WebSocket support') // API description
    .setVersion('1.0') // API version
    .addBearerAuth() // Add Bearer token authentication support
    .build();

  // Generate OpenAPI specification document
  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI with custom path
  SwaggerModule.setup('api/docs', app, document);

  // Get server configuration from environment variables
  const port = process.env.NOTIFICATION_PORT || 4006; // Default port 4006
  const host = process.env.NOTIFICATION_HOST || '0.0.0.0'; // Default host 0.0.0.0 (all interfaces)

  // Start all microservices and the HTTP server
  await app.startAllMicroservices(); // Start RabbitMQ microservice
  await app.listen(port, host); // Start HTTP server

  // Log successful startup information
  console.log(`Notification service is running on ${host}:${port}`);
  console.log(`Notif service is consuming from RabbitMQ`);
}

/**
 * Application startup with error handling
 *
 * This function starts the Notification Service application and handles any startup errors.
 * If the application fails to start, it logs the error and exits the process.
 */
bootstrap().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1); // Exit with error code 1
});
