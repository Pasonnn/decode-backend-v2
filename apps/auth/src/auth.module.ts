/**
 * @fileoverview Authentication Module Configuration
 *
 * This module serves as the central configuration hub for the Decode Authentication Service.
 * It orchestrates all the necessary dependencies, providers, and configurations required
 * for a comprehensive authentication system.
 *
 * The module integrates multiple technologies and services:
 * - NestJS framework for dependency injection and modular architecture
 * - MongoDB for persistent data storage (users, sessions, device fingerprints)
 * - Redis for caching and temporary data management
 * - RabbitMQ for asynchronous email communication
 * - JWT for secure token-based authentication
 * - Passport for authentication strategies
 *
 * Key Features:
 * - User registration and email verification
 * - Secure login with device fingerprinting
 * - Session management with JWT tokens
 * - Password management and reset functionality
 * - Single Sign-On (SSO) capabilities
 * - Device fingerprint tracking and verification
 * - Role-based access control
 *
 * Security Considerations:
 * - All sensitive data is properly encrypted and hashed
 * - JWT tokens are signed with secure secrets
 * - Device fingerprinting provides additional security layer
 * - Email verification prevents unauthorized account creation
 * - Rate limiting and brute force protection
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

// Controllers Import
import { AuthController } from './auth.controller';

// Services Import
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { InfoService } from './services/info.service';
import { DeviceFingerprintService } from './services/device-fingerprint.service';
import { SsoService } from './services/sso.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';

// Strategies and Infrastructure Import
import { JwtStrategy } from './strategies/jwt.strategy';
import { ServicesJwtStrategy } from './strategies/services-jwt.strategy';
import { SessionStrategy } from './strategies/session.strategy';
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';
import { UserServiceClient } from './infrastructure/external-services/auth-service.client';

// Guards Import
import { AuthGuard } from './common/guards/auth.guard';
import { WalletServiceGuard } from './common/guards/service.guard';

// Utils Import
import { PasswordUtils } from './utils/password.utils';
import { CryptoUtils } from './utils/crypto.utils';

// Schemas Import
import { Session, SessionSchema } from './schemas/session.schema';
import {
  DeviceFingerprint,
  DeviceFingerprintSchema,
} from './schemas/device-fingerprint.schema';
import { Otp, OtpSchema } from './schemas/otp';

// Config Import
import authConfig from './config/auth.config';
import jwtConfig from './config/jwt.config';
import otpConfig from './config/otp.config';
import servicesConfig from './config/services.config';

/**
 * Authentication Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode Authentication Service. It serves as the dependency injection container
 * and configuration hub for the entire authentication system.
 *
 * Module Structure:
 * - Imports: External modules and configurations
 * - Controllers: HTTP request handlers
 * - Providers: Business logic services, strategies, guards, and utilities
 * - Exports: Services available to other modules
 *
 * Database Integration:
 * - MongoDB: Primary database for persistent data storage
 * - Redis: Caching layer for temporary data and session management
 *
 * External Services:
 * - RabbitMQ: Message queue for asynchronous email processing
 * - Email Service: Microservice for sending verification and notification emails
 *
 * Security Components:
 * - JWT Module: Token generation and validation
 * - Passport Module: Authentication strategies
 * - Auth Guard: Route protection and authorization
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
    ConfigModule.forFeature(authConfig), // Load authentication-specific configuration
    ConfigModule.forFeature(jwtConfig), // Load JWT-specific configuration
    ConfigModule.forFeature(otpConfig), // Load OTP-specific configuration
    ConfigModule.forFeature(servicesConfig), // Load services-specific configuration
    HttpModule,
    // Passport module for authentication strategies (JWT, Session-based)
    PassportModule,

    // MongoDB connection configuration with async factory pattern
    // This allows for dynamic configuration loading and proper dependency injection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'), // MongoDB connection string from environment
        dbName: config.get<string>('MONGO_DB_NAME'), // MongoDB database name
      }),
      inject: [ConfigService],
    }),

    // MongoDB schema registration for all data models
    // Each schema defines the structure and validation rules for its respective collection
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema }, // User sessions and tokens
      { name: DeviceFingerprint.name, schema: DeviceFingerprintSchema }, // Device tracking
      { name: Otp.name, schema: OtpSchema }, // OTP secrets and 2FA configuration
    ]),

    // JWT module configuration for access token generation and validation
    // Uses async configuration to load secrets and options from environment variables
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
    // Redis module configuration for caching and temporary data storage
    // Used for storing verification codes, session data, and rate limiting information
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single', // Single Redis instance configuration
        url: config.get<string>('REDIS_URI'), // Redis connection string
      }),
      inject: [ConfigService],
    }),

    // RabbitMQ client configuration for email service communication
    // Enables asynchronous email processing for verification codes and notifications
    ClientsModule.registerAsync([
      {
        name: 'EMAIL_SERVICE', // Service identifier for dependency injection
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ, // RabbitMQ transport protocol
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672',
            ], // RabbitMQ connection URLs
            queue: 'email_queue', // Queue name for email messages
            queueOptions: {
              durable: true, // Persist queue across broker restarts
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NEO4JDB_SYNC_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672',
            ],
            queue: 'neo4j_sync_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672',
            ],
            queue: 'notification_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],

  // HTTP controllers that handle incoming requests and route them to appropriate services
  controllers: [AuthController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    // Core business logic services
    RegisterService, // User registration and email verification
    LoginService, // User authentication and login flow
    SessionService, // Session management and token handling
    PasswordService, // Password operations and reset functionality
    InfoService, // User information retrieval and management
    DeviceFingerprintService, // Device tracking and verification
    SsoService, // Single Sign-On token management
    TwoFactorAuthService, // Two-Factor Authentication and OTP management

    // Authentication strategies for different token types
    JwtStrategy, // JWT access token validation strategy
    SessionStrategy, // Session token validation strategy
    ServicesJwtStrategy, // Service JWT token validation strategy

    // Security guards for route protection
    AuthGuard, // Main authentication and authorization guard
    WalletServiceGuard, // Service JWT token validation guard

    // Infrastructure services for external system integration
    RedisInfrastructure, // Redis operations and caching utilities
    UserServiceClient, // User service client for external system integration

    // Utility services for common operations
    PasswordUtils, // Password hashing, validation, and security utilities
    CryptoUtils, // Cryptographic utilities for encryption and security
  ],

  // Services exported for use by other modules in the application
  exports: [
    RedisInfrastructure, // Make Redis infrastructure available to other modules
  ],
})
export class AuthModule {}
