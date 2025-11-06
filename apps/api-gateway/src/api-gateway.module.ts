/**
 * @fileoverview API Gateway Module Configuration
 *
 * This module serves as the central orchestration hub for the Decode API Gateway,
 * which acts as the single entry point for all client requests to the Decode backend services.
 * It provides a unified API interface, request routing, authentication, and service integration.
 *
 * The API Gateway implements the following architectural patterns:
 * - API Gateway Pattern: Single entry point for all client requests
 * - Microservices Integration: Routes requests to appropriate backend services
 * - Service Mesh Communication: Manages inter-service communication
 * - Centralized Authentication: Handles auth for all downstream services
 * - Request/Response Transformation: Standardizes API responses
 * - Rate Limiting & Security: Implements security policies and rate limiting
 *
 * Key Features:
 * - Unified API endpoint for all Decode services
 * - JWT-based authentication with device fingerprinting
 * - Request routing to microservices (Auth, User, Wallet, Relationship, Notification)
 * - Response transformation and standardization
 * - Comprehensive error handling and logging
 * - Swagger/OpenAPI documentation
 * - Health monitoring and service discovery
 * - Caching and performance optimization
 *
 * Service Integration:
 * - Auth Service: User authentication and authorization
 * - User Service: User profile and account management
 * - Wallet Service: Cryptocurrency wallet operations
 * - Relationship Service: Social connections and interactions
 * - Notification Service: Real-time notifications and messaging
 * - Email Worker: Asynchronous email processing
 * - Neo4j Sync: Graph database synchronization
 *
 * Security Features:
 * - JWT token validation and refresh
 * - Device fingerprint verification
 * - Role-based access control (RBAC)
 * - Rate limiting and DDoS protection
 * - CORS and security headers
 * - Input validation and sanitization
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Configuration imports for environment variables and feature-specific configs
import configuration from './config/configuration';
import environmentConfig from './config/environment.config';

// Feature modules for different service domains
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RelationshipModule } from './modules/relationship/relationship.module';
import { NotificationModule } from './modules/notification/notification.module';

// Infrastructure modules for shared services and utilities
import { CacheModule } from './infrastructure/cache/cache.module';
import { GuardsModule } from './common/guards/guards.module';
import { MetricsModule } from './common/datadog/metrics.module';

/**
 * API Gateway Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode API Gateway. It serves as the dependency injection container and configuration
 * hub for the entire gateway system.
 *
 * Module Structure:
 * - Imports: External modules, configurations, and microservice clients
 * - Controllers: HTTP request handlers (delegated to feature modules)
 * - Providers: Shared services and utilities
 * - Exports: Services available to other modules
 *
 * Configuration Management:
 * - Environment variables loaded from .env file
 * - Feature-specific configurations for different services
 * - Global configuration available throughout the application
 *
 * Microservice Integration:
 * - RabbitMQ clients for asynchronous communication
 * - HTTP clients for synchronous service calls
 * - Service discovery and health monitoring
 *
 * Security & Performance:
 * - Global guards for authentication and authorization
 * - Caching layer for improved performance
 * - Rate limiting and request validation
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
    ConfigModule.forFeature(configuration), // Load API Gateway-specific configuration
    ConfigModule.forFeature(environmentConfig), // Load environment-specific configuration

    // HTTP client module for making requests to backend services
    HttpModule,

    // Infrastructure modules for shared services
    CacheModule, // Redis caching layer for performance optimization
    GuardsModule, // Global authentication and authorization guards
    MetricsModule, // Datadog metrics collection

    // Feature modules for different service domains
    HealthModule, // Health check and monitoring endpoints
    AuthModule, // Authentication and authorization endpoints
    UsersModule, // User management and profile endpoints
    WalletModule, // Wallet and cryptocurrency endpoints
    RelationshipModule, // Social relationships and connections endpoints
    NotificationModule, // Notification and messaging endpoints

    // RabbitMQ microservice clients for asynchronous communication
    ClientsModule.registerAsync([
      {
        name: 'NEO4JDB_SYNC_SERVICE', // Neo4j database synchronization service
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

  // No controllers at this level - all controllers are in feature modules
  controllers: [],

  // No providers at this level - all providers are in feature modules
  providers: [],

  // Export microservice clients for use by feature modules
  exports: [ClientsModule],
})
export class ApiGatewayModule {}
