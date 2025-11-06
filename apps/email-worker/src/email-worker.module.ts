/**
 * @fileoverview Email Worker Module Configuration
 *
 * This module serves as the central configuration hub for the Decode Email Worker Service,
 * which handles asynchronous email processing, template rendering, and email delivery
 * in the Decode platform. It provides comprehensive email management capabilities including
 * email template processing, SMTP delivery, and RabbitMQ message consumption.
 *
 * The Email Worker Service implements the following architectural patterns:
 * - Microservice Architecture: RabbitMQ-based message processing
 * - Template Engine: Dynamic email template rendering
 * - SMTP Integration: Email delivery via SMTP servers
 * - Message Queue Processing: Asynchronous email processing
 * - Configuration Management: Environment-based email configuration
 * - Error Handling: Robust error handling and retry mechanisms
 *
 * Key Features:
 * - Asynchronous email processing via RabbitMQ
 * - Email template rendering and customization
 * - SMTP email delivery
 * - Email verification and authentication codes
 * - Password reset and account verification emails
 * - Notification and alert emails
 * - Error handling and retry mechanisms
 * - Email delivery status tracking
 *
 * External Services:
 * - RabbitMQ: Message queue for email processing requests
 * - SMTP Servers: Email delivery infrastructure
 * - Template Engine: Dynamic email content generation
 *
 * Security Features:
 * - Secure email template processing
 * - Input validation and sanitization
 * - SMTP authentication and encryption
 * - Email content validation
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Datadog metrics module
import { MetricsModule } from './common/datadog/metrics.module';

// HTTP controller for email worker endpoints
import { EmailWorkerController } from './email-worker.controller';

// Business logic services for email operations
import { EmailService } from './services/email-worker.service'; // Core email processing and delivery
import { RabbitMQService } from './services/rabbitmq.service'; // RabbitMQ message handling

// Configuration modules for environment variables and feature-specific configs
import emailConfig from './config/email.config'; // Email service configuration

/**
 * Email Worker Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode Email Worker Service. It serves as the dependency injection container
 * and configuration hub for the entire email processing system.
 *
 * Module Structure:
 * - Imports: External modules and configurations
 * - Controllers: HTTP request handlers for email operations
 * - Providers: Business logic services and infrastructure components
 * - Exports: Services available to other modules
 *
 * External Services:
 * - RabbitMQ: Message queue for email processing requests
 * - SMTP Servers: Email delivery infrastructure
 * - Template Engine: Dynamic email content generation
 *
 * Processing Features:
 * - Asynchronous email processing
 * - Template rendering and customization
 * - SMTP email delivery
 * - Error handling and retry mechanisms
 *
 * @Module
 */
@Module({
  imports: [
    // Global configuration module for environment variables and feature-specific configs
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available throughout the application
    }),
    ConfigModule.forFeature(emailConfig), // Load email-specific configuration

    // Datadog metrics module for observability
    MetricsModule, // Metrics service for custom metrics
  ],

  // HTTP controllers that handle incoming requests and route them to appropriate services
  controllers: [EmailWorkerController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    EmailService, // Core email processing and delivery service
    RabbitMQService, // RabbitMQ message handling and processing service
  ],
})
export class EmailWorkerModule {}
