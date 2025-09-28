/**
 * @fileoverview User Service Module Configuration
 *
 * This module serves as the central configuration hub for the Decode User Service,
 * which manages user profiles, account information, and user-related operations in the Decode platform.
 * It provides comprehensive user management capabilities including profile updates, username changes,
 * email management, user search, and account deactivation.
 *
 * The User Service implements the following architectural patterns:
 * - Document Database Integration: MongoDB for user data persistence
 * - Caching Layer: Redis for performance optimization
 * - Microservice Communication: RabbitMQ for async operations
 * - JWT Authentication: Service-to-service authentication
 * - RESTful API: HTTP endpoints for user operations
 * - Event-Driven Architecture: Asynchronous email and sync operations
 *
 * Key Features:
 * - User profile management and updates
 * - Username change with email verification
 * - Email change with verification process
 * - User search and discovery
 * - Account deactivation and reactivation
 * - Avatar and bio management
 * - User data synchronization with Neo4j
 * - Asynchronous email notifications
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
 * Security Features:
 * - JWT-based service authentication
 * - Input validation and sanitization
 * - Email verification for sensitive operations
 * - Secure data handling and storage
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

// HTTP controller for handling user API requests
import { UserController } from './user.controller';

// Business logic services for different user operations
import { ProfileService } from './services/profile.service'; // User profile management
import { UsernameService } from './services/username.service'; // Username change operations
import { SearchService } from './services/search.service'; // User search functionality
import { EmailService } from './services/email.service'; // Email change operations
import { ServicesResponseService } from './services/services-response.service'; // Service response formatting
import { DeactivateService } from './services/deactivate.service'; // Account deactivation

// Infrastructure services for external system integration
import { RedisInfrastructure } from './infrastructure/redis.infrastructure'; // Redis caching operations

// MongoDB schemas for data persistence
import { User, UserSchema } from './schemas/user.schema'; // User data model

// Authentication strategies for service-to-service communication
import { ServicesJwtStrategy } from './strategies/services-jwt.strategy'; // JWT validation strategy

// Security guards for route protection
import { AuthServiceGuard } from './common/guards/service.guard'; // Service authentication guard

// Configuration modules for environment variables and feature-specific configs
import configuration from './config/configuration'; // User service configuration
import jwtConfig from './config/jwt.config'; // JWT configuration
/**
 * User Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode User Service. It serves as the dependency injection container
 * and configuration hub for the entire user management system.
 *
 * Module Structure:
 * - Imports: External modules, configurations, and microservice clients
 * - Controllers: HTTP request handlers for user operations
 * - Providers: Business logic services and infrastructure components
 * - Exports: Services available to other modules
 *
 * Database Integration:
 * - MongoDB: Primary database for user data storage
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - RabbitMQ: Message queue for asynchronous operations
 * - Email Service: Asynchronous email processing
 * - Neo4j Sync Service: Graph database synchronization
 *
 * Security Features:
 * - JWT-based service authentication
 * - Input validation and sanitization
 * - Email verification for sensitive operations
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
    ConfigModule.forFeature(configuration), // Load user-specific configuration
    ConfigModule.forFeature(jwtConfig), // Load JWT-specific configuration

    // HTTP client module for external service communication
    HttpModule,

    // JWT module configuration for service-to-service authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret.servicesToken'), // Secret key for signing service tokens
        signOptions: {
          expiresIn: config.get<string>('jwt.servicesToken.expiresIn'), // Token expiration time
          issuer: config.get<string>('jwt.servicesToken.issuer'), // Token issuer identification
          audience: config.get<string>('jwt.servicesToken.audience'), // Token audience validation
        },
      }),
      inject: [ConfigService],
    }),

    // MongoDB connection configuration for document storage
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'), // MongoDB connection string
      }),
      inject: [ConfigService],
    }),

    // MongoDB schema registration for data models
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // User data model

    // Redis module configuration for caching and temporary data storage
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single', // Single Redis instance configuration
        url: config.get<string>('REDIS_URI'), // Redis connection string
      }),
      inject: [ConfigService],
    }),

    // RabbitMQ microservice clients for asynchronous communication
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE', // Email service client
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ, // RabbitMQ transport protocol
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672', // RabbitMQ connection URLs
            ],
            queue: 'email_queue', // Queue name for email messages
            queueOptions: {
              durable: true, // Persist queue across broker restarts
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NEO4JDB_SYNC_SERVICE', // Neo4j sync service client
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ, // RabbitMQ transport protocol
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672', // RabbitMQ connection URLs
            ],
            queue: 'neo4j_sync_queue', // Queue name for Neo4j sync messages
            queueOptions: {
              durable: true, // Persist queue across broker restarts
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],

  // HTTP controllers that handle incoming requests and route them to appropriate services
  controllers: [UserController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    // Core business logic services
    ProfileService, // User profile management and updates
    UsernameService, // Username change operations with verification
    SearchService, // User search functionality and filtering
    EmailService, // Email change operations with verification
    ServicesResponseService, // Service response formatting and standardization
    DeactivateService, // Account deactivation and reactivation

    // Authentication and security components
    ServicesJwtStrategy, // JWT validation strategy for service-to-service communication
    AuthServiceGuard, // Service authentication guard for route protection

    // Infrastructure services for external system integration
    RedisInfrastructure, // Redis caching operations and utilities
  ],

  // Services exported for use by other modules in the application
  exports: [
    RedisInfrastructure, // Make Redis infrastructure available to other modules
    ServicesResponseService, // Make service response formatting available to other modules
  ],
})
export class UserModule {}
