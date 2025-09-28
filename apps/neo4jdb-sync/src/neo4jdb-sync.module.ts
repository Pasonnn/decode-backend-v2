/**
 * @fileoverview Neo4j Database Sync Module Configuration
 *
 * This module serves as the central configuration hub for the Decode Neo4j Database Sync Service,
 * which handles synchronization between MongoDB (document database) and Neo4j (graph database)
 * in the Decode platform. It provides comprehensive data synchronization capabilities including
 * user data synchronization, graph relationship management, and real-time data consistency.
 *
 * The Neo4j DB Sync Service implements the following architectural patterns:
 * - Microservice Architecture: RabbitMQ-based message processing
 * - Graph Database Integration: Neo4j for social graph operations
 * - Document Database Sync: MongoDB to Neo4j data synchronization
 * - Message Queue Processing: Asynchronous data synchronization
 * - Event-Driven Architecture: Real-time data consistency
 * - Data Transformation: Document to graph data mapping
 *
 * Key Features:
 * - User data synchronization between MongoDB and Neo4j
 * - Real-time graph relationship updates
 * - Asynchronous data processing via RabbitMQ
 * - User creation and update synchronization
 * - Graph node and relationship management
 * - Data consistency and integrity
 * - Error handling and retry mechanisms
 * - Performance optimization for large datasets
 *
 * Database Integration:
 * - MongoDB: Source document database for user data
 * - Neo4j: Target graph database for social relationships
 *
 * External Services:
 * - RabbitMQ: Message queue for synchronization requests
 * - User Service: Source of user data changes
 * - Relationship Service: Graph relationship operations
 *
 * Security Features:
 * - Secure data transformation and mapping
 * - Input validation and sanitization
 * - Database connection security
 * - Data integrity validation
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for application structure and configuration
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// HTTP controller for Neo4j sync endpoints
import { Neo4jdbSyncController } from './neo4jdb-sync.controller';

// Business logic services for synchronization operations
import { UserSyncService } from './services/user-sync.service'; // User data synchronization service

// Configuration modules for environment variables and feature-specific configs
import neo4jdbSyncConfig from './config/neo4jdb-sync.config'; // Neo4j sync service configuration

// Infrastructure services for external system integration
import { Neo4jInfrastructure } from './infrastructure/neo4j.infrastructure'; // Neo4j graph database operations
import { RabbitMQInfrastructure } from './infrastructure/rabbitmq.infrastructure'; // RabbitMQ operations

/**
 * Neo4j Database Sync Module
 *
 * This is the main module that configures and orchestrates all components of the
 * Decode Neo4j Database Sync Service. It serves as the dependency injection container
 * and configuration hub for the entire data synchronization system.
 *
 * Module Structure:
 * - Imports: External modules and configurations
 * - Controllers: HTTP request handlers for sync operations
 * - Providers: Business logic services and infrastructure components
 * - Exports: Services available to other modules
 *
 * Database Integration:
 * - MongoDB: Source document database for user data
 * - Neo4j: Target graph database for social relationships
 *
 * External Services:
 * - RabbitMQ: Message queue for synchronization requests
 * - User Service: Source of user data changes
 * - Relationship Service: Graph relationship operations
 *
 * Synchronization Features:
 * - Real-time data synchronization
 * - User creation and update sync
 * - Graph relationship management
 * - Data consistency and integrity
 *
 * @Module
 */
@Module({
  imports: [
    // Global configuration module for environment variables and feature-specific configs
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available throughout the application
    }),
    ConfigModule.forFeature(neo4jdbSyncConfig), // Load Neo4j sync-specific configuration
  ],

  // HTTP controllers that handle incoming requests and route them to appropriate services
  controllers: [Neo4jdbSyncController],

  // Service providers that contain business logic and are available for dependency injection
  providers: [
    UserSyncService, // User data synchronization service
    RabbitMQInfrastructure, // RabbitMQ operations and message handling
    Neo4jInfrastructure, // Neo4j graph database operations and queries
  ],
})
export class Neo4jDbSyncModule {}
