/**
 * @fileoverview Notification Service Module Configuration
 *
 * This module serves as the central configuration hub for the Decode Notification Service,
 * which manages real-time notifications, messaging, and communication features in the Decode platform.
 * It provides comprehensive notification management capabilities including push notifications,
 * WebSocket connections, message queuing, and notification persistence.
 *
 * The Notification Service implements the following architectural patterns:
 * - Real-time Communication: WebSocket connections for instant notifications
 * - Message Queue Integration: RabbitMQ for asynchronous notification processing
 * - Document Database: MongoDB for notification persistence and history
 * - Caching Layer: Redis for WebSocket connection management
 * - Microservice Architecture: RabbitMQ consumer for notification processing
 * - RESTful API: HTTP endpoints for notification management
 *
 * Key Features:
 * - Real-time push notifications via WebSocket
 * - Notification creation and management
 * - Notification history and persistence
 * - Mark notifications as read/unread
 * - Pagination and filtering for notifications
 * - RabbitMQ message consumption
 * - WebSocket connection management
 * - JWT-based authentication
 *
 * Database Integration:
 * - MongoDB: Primary database for notification data storage
 * - Redis: Caching layer for WebSocket connection management
 *
 * External Services:
 * - RabbitMQ: Message queue for notification processing
 * - Auth Service: User authentication and authorization
 * - WebSocket Clients: Real-time notification delivery
 *
 * Security Features:
 * - JWT-based authentication
 * - WebSocket connection validation
 * - Input validation and sanitization
 * - Secure message handling
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';

// HTTP controllers for handling notification API requests
import { NotificationController } from './notification.controller'; // Main notification endpoints
import { RabbitMQController } from './controllers/rabbitmq.controller'; // RabbitMQ message handling

// Business logic services for notification operations
import { NotificationService } from './services/notification.service'; // Core notification management
import { NotificationPushService } from './services/notification-push.service'; // Push notification delivery
import { RedisInfrastructure } from './infrastructure/redis.infrastructure'; // Redis caching operations

// WebSocket gateway for real-time communication
import { NotificationGateway } from './gateways/notification.gateway'; // WebSocket connection management

// MongoDB schemas for data persistence
import { Notification, NotificationSchema } from './schema/notification.schema'; // Notification data model

// Infrastructure services for external system integration
import { RabbitMQInfrastructure } from './infrastructure/rabbitmq.infrastructure'; // RabbitMQ operations

// Authentication strategies for JWT validation
import { JwtStrategy } from './strategy/jwt.strategy'; // JWT validation strategy

// Configuration modules for environment variables and feature-specific configs
import jwtConfig from './config/jwt.config'; // JWT configuration
import configuration from './config/configuration'; // Notification service configuration

/**
 * Notification Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode Notification Service. It serves as the dependency injection container
 * and configuration hub for the entire notification management system.
 *
 * Module Structure:
 * - Imports: External modules, configurations, and database connections
 * - Controllers: HTTP request handlers and RabbitMQ message consumers
 * - Providers: Business logic services, infrastructure, and WebSocket gateway
 * - Exports: Services available to other modules
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
 * Real-time Features:
 * - WebSocket connections for instant notifications
 * - Push notification delivery
 * - Connection management and persistence
 *
 * @Module
 */
@Module({
  imports: [
    // Global configuration module for environment variables and feature-specific configs
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available throughout the application
      envFilePath: '.env', // Load environment variables from .env file
    }),

    ConfigModule.forFeature(configuration), // Load notification-specific configuration
    ConfigModule.forFeature(jwtConfig), // Load JWT-specific configuration

    // HTTP client module for external service communication
    HttpModule,

    // MongoDB connection configuration for document storage
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), // MongoDB connection string
      }),
      inject: [ConfigService],
    }),

    // Redis module configuration for WebSocket connection management
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single', // Single Redis instance configuration
        url: config.get<string>('REDIS_URI'), // Redis connection string
      }),
      inject: [ConfigService],
    }),

    // JWT module configuration for authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret.accessToken'), // Secret key for signing tokens
        signOptions: {
          expiresIn: config.get<string>('jwt.accessToken.expiresIn'), // Token expiration time
          issuer: config.get<string>('jwt.accessToken.issuer'), // Token issuer identification
          audience: config.get<string>('jwt.accessToken.audience'), // Token audience validation
        },
      }),
      inject: [ConfigService],
    }),

    // MongoDB schema registration for data models
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema }, // Notification data model
    ]),
  ],

  // HTTP controllers and RabbitMQ message consumers
  controllers: [NotificationController, RabbitMQController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    // Core business logic services
    NotificationService, // Core notification management and operations
    NotificationPushService, // Push notification delivery and WebSocket management

    // Infrastructure services for external system integration
    RedisInfrastructure, // Redis caching operations and utilities
    RabbitMQInfrastructure, // RabbitMQ operations and message handling

    // WebSocket gateway for real-time communication
    NotificationGateway, // WebSocket connection management and real-time notifications

    // Authentication and security components
    JwtStrategy, // JWT validation strategy for authentication
  ],

  // Services exported for use by other modules in the application
  exports: [
    NotificationService, // Make notification service available to other modules
    NotificationGateway, // Make WebSocket gateway available to other modules
    RedisInfrastructure, // Make Redis infrastructure available to other modules
  ],
})
export class NotificationModule {}
