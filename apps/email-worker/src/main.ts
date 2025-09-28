/**
 * @fileoverview Email Worker Application Bootstrap
 *
 * This is the main entry point for the Decode Email Worker Service application. It initializes
 * the NestJS microservice with RabbitMQ configuration for handling asynchronous email processing
 * requests from other services in the Decode platform.
 *
 * The Email Worker Service provides comprehensive email processing capabilities including:
 * - Asynchronous email processing via RabbitMQ
 * - Email template rendering and customization
 * - SMTP email delivery
 * - Email verification and authentication codes
 * - Password reset and account verification emails
 * - Notification and alert emails
 * - Error handling and retry mechanisms
 * - Email delivery status tracking
 *
 * Key Features:
 * - Microservice architecture with RabbitMQ integration
 * - Template engine for dynamic email content
 * - SMTP integration for email delivery
 * - Asynchronous message processing
 * - Error handling and retry mechanisms
 * - Email delivery status tracking
 * - Configuration management
 * - Secure email processing
 *
 * External Services:
 * - RabbitMQ: Message queue for email processing requests
 * - SMTP Servers: Email delivery infrastructure
 * - Template Engine: Dynamic email content generation
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for microservice initialization
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

// Application module
import { EmailWorkerModule } from './email-worker.module';

/**
 * Bootstrap function to initialize and configure the Email Worker microservice
 *
 * This function sets up the complete microservice stack including:
 * - Microservice initialization with NestJS factory
 * - RabbitMQ transport configuration
 * - Message queue setup and connection
 * - Error handling and logging
 *
 * @returns Promise<void> - Resolves when the microservice is successfully started
 */
async function bootstrap() {
  // Create the NestJS microservice instance with RabbitMQ transport
  const app = await NestFactory.createMicroservice(EmailWorkerModule, {
    transport: Transport.RMQ, // RabbitMQ transport protocol
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'], // RabbitMQ connection URLs
      queue: 'email_queue', // Queue name for email processing messages
      queueOptions: {
        durable: true, // Persist queue across broker restarts
      },
    },
  });

  // Start the microservice and begin listening for messages
  await app.listen();

  // Log successful startup information
  console.log(
    `Email Worker Microservice is listening on email_queue for email_request pattern`,
  );
}

/**
 * Application startup with error handling
 *
 * This function starts the Email Worker microservice and handles any startup errors.
 * If the microservice fails to start, it logs the error and exits the process.
 */
void bootstrap();
