import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { Neo4jDbSyncModule } from './neo4jdb-sync.module';

async function bootstrap() {
  // Create microservice for create user queue
  const createUserApp = await NestFactory.createMicroservice(
    Neo4jDbSyncModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'create_user_queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
        prefetchCount: 1,
      },
    },
  );

  // Create microservice for update user queue
  const updateUserApp = await NestFactory.createMicroservice(
    Neo4jDbSyncModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'update_user_queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
        prefetchCount: 1,
      },
    },
  );

  await createUserApp.listen();
  await updateUserApp.listen();
  console.log(
    `Neo4j Database Sync Microservice is listening on both queues:\ncreate_user_queue (create_user_request) and update_user_queue (update_user_request)`,
  );
}

void bootstrap();
