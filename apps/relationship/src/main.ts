import { NestFactory } from '@nestjs/core';
import { RelationshipModule } from './relationship.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Create HTTP application
  const app = await NestFactory.create(RelationshipModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit conversion
      },
    }),
  );

  // Create RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'neo4j_database_sync_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start microservice
  await app.startAllMicroservices();

  // Start HTTP server
  const port = process.env.RELATIONSHIP_PORT ?? 4004;
  const host = process.env.RELATIONSHIP_HOST
    ? process.env.RELATIONSHIP_HOST.replace('http://', '').replace(
        'https://',
        '',
      )
    : '0.0.0.0';
  await app.listen(port, host);
  console.info(
    `[RelationshipService] Relationship service is running on ${host}:${port}`,
  );
  console.info(
    `[RelationshipService] RabbitMQ microservice is listening on neo4j_database_sync_queue`,
  );
}
bootstrap().catch((error) => {
  console.error('Failed to start Relationship service:', error);
  process.exit(1);
});
