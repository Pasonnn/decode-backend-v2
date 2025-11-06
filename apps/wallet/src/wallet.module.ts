/**
 * @fileoverview Wallet Service Module Configuration
 *
 * This module serves as the central configuration hub for the Decode Wallet Service,
 * which manages cryptocurrency wallets, blockchain interactions, and financial operations
 * in the Decode platform. It provides comprehensive wallet management capabilities including
 * wallet linking, authentication, primary wallet management, and secure cryptographic operations.
 *
 * The Wallet Service implements the following architectural patterns:
 * - Document Database Integration: MongoDB for wallet data persistence
 * - Caching Layer: Redis for performance optimization
 * - External Service Integration: Auth service for user authentication
 * - JWT Authentication: Service-to-service authentication
 * - RESTful API: HTTP endpoints for wallet operations
 * - Cryptographic Security: Secure key management and operations
 *
 * Key Features:
 * - Wallet linking and management
 * - Primary wallet designation
 * - Secure cryptographic operations
 * - User authentication integration
 * - Wallet data persistence
 * - Caching for performance optimization
 * - Service-to-service communication
 * - Secure key handling
 *
 * Database Integration:
 * - MongoDB: Primary database for wallet data storage
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - Auth Service: User authentication and authorization
 * - Blockchain Networks: Cryptocurrency wallet operations
 *
 * Security Features:
 * - JWT-based service authentication
 * - Cryptographic key management
 * - Secure wallet operations
 * - Input validation and sanitization
 * - Encrypted data storage
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Datadog metrics module
import { MetricsModule } from './common/datadog/metrics.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

// HTTP controller for handling wallet API requests
import { WalletController } from './wallet.controller';

// External service clients for inter-service communication
import { AuthServiceClient } from './infrastructure/external-services/auth-service.client'; // Auth service integration

// Business logic services for different wallet operations
import { LinkService } from './services/link.service'; // Wallet linking operations
import { AuthService } from './services/auth.service'; // Wallet authentication
import { PrimaryService } from './services/primary.service'; // Primary wallet management

// Utility services for cryptographic operations
import { CryptoUtils } from './utils/crypto.utils'; // Cryptographic utilities and operations

// Authentication strategies for service-to-service communication
import { ServicesJwtStrategy } from './strategies/services-jwt.strategy'; // JWT validation strategy

// Infrastructure services for external system integration
import { RedisInfrastructure } from './infrastructure/redis.infrastructure'; // Redis caching operations

// MongoDB schemas for data persistence
import { Wallet, WalletSchema } from './schemas/wallet.schema'; // Wallet data model

// Configuration modules for environment variables and feature-specific configs
import configuration from './config/configuration'; // Wallet service configuration
import jwtConfig from './config/jwt.config'; // JWT configuration
/**
 * Wallet Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode Wallet Service. It serves as the dependency injection container
 * and configuration hub for the entire wallet management system.
 *
 * Module Structure:
 * - Imports: External modules, configurations, and database connections
 * - Controllers: HTTP request handlers for wallet operations
 * - Providers: Business logic services and infrastructure components
 * - Exports: Services available to other modules
 *
 * Database Integration:
 * - MongoDB: Primary database for wallet data storage
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - Auth Service: User authentication and authorization
 * - Blockchain Networks: Cryptocurrency wallet operations
 *
 * Security Features:
 * - JWT-based service authentication
 * - Cryptographic key management
 * - Secure wallet operations
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
    ConfigModule.forFeature(configuration), // Load wallet-specific configuration
    ConfigModule.forFeature(jwtConfig), // Load JWT-specific configuration

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

    // HTTP client module for external service communication
    HttpModule,

    // MongoDB connection configuration for document storage
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'), // MongoDB connection string
        dbName: config.get<string>('MONGO_DB_NAME'), // MongoDB database name
      }),
      inject: [ConfigService],
    }),

    // MongoDB schema registration for data models
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]), // Wallet data model

    // Datadog metrics module for observability
    MetricsModule, // Metrics service for custom metrics

    // Redis module configuration for caching and temporary data storage
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single', // Single Redis instance configuration
        url: config.get<string>('REDIS_URI'), // Redis connection string
      }),
      inject: [ConfigService],
    }),
  ],

  // HTTP controllers that handle incoming requests and route them to appropriate services
  controllers: [WalletController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    // Core business logic services
    LinkService, // Wallet linking operations and management
    AuthService, // Wallet authentication and security
    PrimaryService, // Primary wallet designation and management

    // Infrastructure services for external system integration
    RedisInfrastructure, // Redis caching operations and utilities
    CryptoUtils, // Cryptographic utilities and secure operations

    // Authentication and security components
    ServicesJwtStrategy, // JWT validation strategy for service-to-service communication

    // External service clients for inter-service communication
    AuthServiceClient, // Auth service integration for user authentication
  ],

  // Services exported for use by other modules in the application
  exports: [
    RedisInfrastructure, // Make Redis infrastructure available to other modules
  ],
})
export class WalletModule {}
