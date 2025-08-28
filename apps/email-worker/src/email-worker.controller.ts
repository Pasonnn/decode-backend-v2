import { Controller, Post, Body, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EmailService } from './services/email-worker.service';
import { RabbitMQService } from './services/rabbitmq.service';
import type { EmailRequestDto } from './dto/email.dto';

@Controller('email-worker')
export class EmailWorkerController {
  constructor(
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  // This is the main message handler for RabbitMQ
  @MessagePattern('email_request')
  async handleEmailRequest(request: EmailRequestDto) {
    try {
      await this.rabbitMQService.processEmailRequest(request);
      return { success: true, message: 'Email processed successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('send')
  async sendEmail(@Body() request: EmailRequestDto) {
    return await this.emailService.sendEmail(request);
  }

  @Post('queue')
  async queueEmail(@Body() request: EmailRequestDto) {
    await this.rabbitMQService.sendEmailRequest(request);
    return { success: true, message: 'Email queued successfully' };
  }

  @Get('health')
  async healthCheck() {
    const emailConnection = await this.emailService.testConnection();
    return {
      status: 'ok',
      emailService: emailConnection ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
