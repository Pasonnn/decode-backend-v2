import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { EmailService } from './email-worker.service';
import { EmailRequestDto } from '../dto/email.dto';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private client: ClientProxy;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.client = ClientProxyFactory.create({
      options: {
        urls: [this.configService.get('RABBITMQ_URI', 'amqp://localhost:5672')],
        queue: 'email_queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
        prefetchCount: 1,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Connected to RabbitMQ successfully');

      // Start consuming messages
      this.startConsuming();
    } catch (error) {
      this.logger.error(
        'Failed to connect to RabbitMQ',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private startConsuming() {
    // For a worker service, we need to use a different approach
    // This will be handled by the controller with @MessagePattern
    this.logger.log('RabbitMQ consumer initialized');
  }

  async sendEmailRequest(request: EmailRequestDto): Promise<void> {
    try {
      await this.client.emit('email_request', request).toPromise();
      this.logger.log(`Email request queued: ${request.type}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue email request: ${request.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async processEmailRequest(request: EmailRequestDto): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Processing email request ${request.type}`);
    try {
      await this.emailService.sendEmail(request);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Email processed successfully in ${duration}ms: ${request.type}`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Email processing failed after ${duration}ms: ${request.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
