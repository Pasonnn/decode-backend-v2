import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NotificationModule } from './notification.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

/**
 * Bootstrap the notification service
 */
async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
      queue: 'notification_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Enable CORS for WebSocket connections
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('API for managing notifications with WebSocket support')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.NOTIFICATION_PORT || 4006;
  const host = process.env.NOTIFICATION_HOST || 'localhost';
  await app.startAllMicroservices();
  await app.listen(port, host);

  console.log(`Notification service is running on ${host}:${port}`);
  console.log(`Notif service is consuming from RabbitMQ`);
  console.log(`API Documentation: http://${host}:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});
