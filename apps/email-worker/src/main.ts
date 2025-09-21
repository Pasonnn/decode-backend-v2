import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { EmailWorkerModule } from './email-worker.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(EmailWorkerModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
      queue: 'email_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen();
  console.log('Email Worker Microservice is listening');
}

void bootstrap();
