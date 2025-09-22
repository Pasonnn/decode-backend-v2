import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { EmailWorkerModule } from './email-worker.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(EmailWorkerModule, {
    transport: Transport.RMQ,
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => ({
      options: {
        urls: [
          configService.get<string>('RABBITMQ_URI') || 'amqp://localhost:5672',
        ],
        queue: 'email_queue',
        queueOptions: {
          durable: true,
        },
      },
    }),
    inject: [ConfigService],
  });

  await app.listen();
  console.log('Email Worker Microservice is listening');
}

void bootstrap();
