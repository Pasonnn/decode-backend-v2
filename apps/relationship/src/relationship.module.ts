/**
 * @fileoverview Relationship Service Module Configuration
 *
 * This module serves as the central configuration hub for the Decode Relationship Service,
 * which manages social connections, user interactions, and relationship data in the Decode platform.
 * It provides comprehensive relationship management capabilities including following, blocking,
 * mutual connections, and social graph analytics.
 *
 * The Relationship Service implements the following architectural patterns:
 * - Graph Database Integration: Neo4j for social graph operations
 * - Document Database: MongoDB for relationship snapshots and analytics
 * - Caching Layer: Redis for performance optimization
 * - Scheduled Tasks: Automated follower snapshot collection
 * - Microservice Communication: RabbitMQ for async notifications
 * - RESTful API: HTTP endpoints for relationship operations
 *
 * Key Features:
 * - User following and unfollowing operations
 * - User blocking and unblocking functionality
 * - Mutual connection discovery
 * - User search and suggestions
 * - Follower analytics and snapshots
 * - Real-time relationship updates
 * - Automated daily follower snapshots
 * - Social graph traversal and analysis
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
 * Security Features:
 * - JWT-based authentication
 * - Role-based access control
 * - Input validation and sanitization
 * - Rate limiting and abuse prevention
 * - Secure graph traversal operations
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

// HTTP controller for handling relationship API requests
import { RelationshipController } from './relationship.controller';

// Business logic services for different relationship operations
import { UserService } from './services/user.service'; // User profile and information management
import { FollowService } from './services/follow.service'; // Following and follower operations
import { BlockService } from './services/block.service'; // User blocking and unblocking
import { SuggestService } from './services/suggest.service'; // User suggestion algorithms
import { MutualService } from './services/mutual.service'; // Mutual connection discovery
import { SearchService } from './services/search.service'; // User search functionality
import { FollowerSnapshotService } from './services/follower-snapshot.service'; // Follower analytics and snapshots
import { InterestService } from './services/interest.service'; // Interest management

// Infrastructure services for external system integration
import { Neo4jInfrastructure } from './infrastructure/neo4j.infrastructure'; // Neo4j graph database operations
import { RedisInfrastructure } from './infrastructure/cache/redis.infrastructure'; // Redis caching operations

// Configuration and database modules
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';

// MongoDB schemas for data persistence
import {
  FollowerSnapshot,
  FollowerSnapshotSchema,
} from './schema/follower-snapshot.schema';

/**
 * Relationship Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode Relationship Service. It serves as the dependency injection container
 * and configuration hub for the entire relationship management system.
 *
 * Module Structure:
 * - Imports: External modules, configurations, and microservice clients
 * - Controllers: HTTP request handlers for relationship operations
 * - Providers: Business logic services and infrastructure components
 * - Exports: Services available to other modules
 *
 * Database Integration:
 * - Neo4j: Graph database for relationship data and social graph operations
 * - MongoDB: Document database for follower snapshots and analytics
 * - Redis: Caching layer for performance optimization
 *
 * External Services:
 * - RabbitMQ: Message queue for asynchronous notifications
 * - Notification Service: Real-time relationship notifications
 *
 * Scheduled Tasks:
 * - Daily follower snapshots for analytics and reporting
 * - Automated data collection and processing
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
    ConfigModule.forFeature(configuration), // Load relationship-specific configuration

    // Scheduled tasks module for automated operations
    ScheduleModule.forRoot(), // Enable cron jobs and scheduled tasks

    // HTTP client module for external service communication
    HttpModule,

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
        name: 'NOTIFICATION_SERVICE', // Notification service client
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ, // RabbitMQ transport protocol
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672', // RabbitMQ connection URLs
            ],
            queue: 'notification_queue', // Queue name for notification messages
            queueOptions: {
              durable: true, // Persist queue across broker restarts
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // MongoDB connection configuration for document storage
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'), // MongoDB connection string
        dbName: configService.get<string>('MONGO_DB_NAME'), // MongoDB database name
      }),
      inject: [ConfigService],
    }),

    // MongoDB schema registration for data models
    MongooseModule.forFeature([
      { name: FollowerSnapshot.name, schema: FollowerSnapshotSchema }, // Follower snapshot data model
    ]),
  ],

  // HTTP controllers that handle incoming requests and route them to appropriate services
  controllers: [RelationshipController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    // Core business logic services
    UserService, // User profile and information management
    FollowService, // Following and follower operations
    BlockService, // User blocking and unblocking functionality
    SuggestService, // User suggestion algorithms and recommendations
    MutualService, // Mutual connection discovery and analysis
    SearchService, // User search functionality and filtering
    FollowerSnapshotService, // Follower analytics and snapshot management
    InterestService, // Interest management

    // Infrastructure services for external system integration
    Neo4jInfrastructure, // Neo4j graph database operations and queries
    RedisInfrastructure, // Redis caching operations and utilities
  ],

  // Services exported for use by other modules in the application
  exports: [
    Neo4jInfrastructure, // Make Neo4j infrastructure available to other modules
  ],
})
export class RelationshipModule {}
