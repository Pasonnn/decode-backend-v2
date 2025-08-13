import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailWorkerController } from './email-worker.controller';
import { EmailService } from './services/email-worker.service';
import { RabbitMQService } from './services/rabbitmq.service';
import emailConfig from './config/email.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConfigModule.forFeature(emailConfig),
  ],
  controllers: [EmailWorkerController],
  providers: [EmailService, RabbitMQService],
})
export class EmailWorkerModule {}