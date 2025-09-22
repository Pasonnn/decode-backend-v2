import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EmailService } from './services/email-worker.service';
import { RabbitMQService } from './services/rabbitmq.service';
import type { EmailRequestDto } from './dto/email.dto';

@Controller('email-worker')
export class EmailWorkerController {
  private readonly logger = new Logger(EmailWorkerController.name);
  constructor(
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
  ) {
    this.logger = new Logger(EmailWorkerController.name);
  }

  // This is the main message handler for RabbitMQ
  @MessagePattern('email_request')
  async handleEmailRequest(request: EmailRequestDto) {
    try {
      await this.rabbitMQService.processEmailRequest(request);
      this.logger.log(`Email request processed: ${request.type}`);
      return { success: true, message: 'Email processed successfully' };
    } catch (error) {
      this.logger.error(
        `Email request processing failed: ${request.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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

  @Post('new-email-change-verify')
  async handleNewEmailChangeVerify(@Body() request: EmailRequestDto) {
    try {
      if (request.type !== 'new-email-change-verify') {
        return {
          success: false,
          error: 'Invalid email type. Expected new-email-change-verify',
        };
      }
      await this.emailService.sendEmail(request);
      return {
        success: true,
        message: 'New email change verification email sent successfully',
        email: request.data.email,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
