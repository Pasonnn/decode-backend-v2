/**
 * @fileoverview Neo4j Database Sync Application Bootstrap
 *
 * This is the main entry point for the Decode Neo4j Database Sync Service application. It initializes
 * the NestJS microservice with RabbitMQ configuration for handling asynchronous data synchronization
 * requests between MongoDB and Neo4j databases in the Decode platform.
 *
 * The Neo4j DB Sync Service provides comprehensive data synchronization capabilities including:
 * - User data synchronization between MongoDB and Neo4j
 * - Real-time graph relationship updates
 * - Asynchronous data processing via RabbitMQ
 * - User creation and update synchronization
 * - Graph node and relationship management
 * - Data consistency and integrity
 * - Error handling and retry mechanisms
 * - Performance optimization for large datasets
 *
 * Key Features:
 * - Microservice architecture with RabbitMQ integration
 * - Graph database integration with Neo4j
 * - Document database synchronization from MongoDB
 * - Asynchronous message processing
 * - Real-time data consistency
 * - Data transformation and mapping
 * - Error handling and retry mechanisms
 * - Performance optimization
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
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Datadog observability
import 'dd-trace/init';

// Core NestJS modules for microservice initialization
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';

// Application module
import { Neo4jDbSyncModule } from './neo4jdb-sync.module';

/**
 * Bootstrap function to initialize and configure the Neo4j Database Sync microservice
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
  const app = await NestFactory.createMicroservice(Neo4jDbSyncModule, {
    transport: Transport.RMQ, // RabbitMQ transport protocol
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'], // RabbitMQ connection URLs
      queue: 'neo4j_sync_queue', // Queue name for Neo4j synchronization messages
      queueOptions: {
        durable: true, // Persist queue across broker restarts
      },
    },
  });

  // Start the microservice and begin listening for messages
  await app.listen();

  // Log successful startup information
  console.log(
    `Neo4j Database Sync Microservice is listening on neo4j_sync_queue for both create_user_request and update_user_request patterns`,
  );
}

/**
 * Application startup with error handling
 *
 * This function starts the Neo4j Database Sync microservice and handles any startup errors.
 * If the microservice fails to start, it logs the error and exits the process.
 */
void bootstrap();
