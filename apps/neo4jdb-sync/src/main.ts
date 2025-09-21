import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Neo4jDbSyncModule } from './neo4jdb-sync.module';

async function bootstrap() {
  // Create a single microservice that can handle both queues
  const app = await NestFactory.createMicroservice(Neo4jDbSyncModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
      queue: 'neo4j_sync_queue', // Single queue for both operations
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen();
  console.log(
    `Neo4j Database Sync Microservice is listening on neo4j_sync_queue for both create_user_request and update_user_request patterns`,
  );
}

void bootstrap();
