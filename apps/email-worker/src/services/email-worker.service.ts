import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { EmailTemplates } from '../templates/email.templates';
import { EmailRequestDto } from '../dto/email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(request: EmailRequestDto): Promise<boolean> {
    try {
      const recipientEmail = this.getEmailFromRequest(request);
      this.logger.log(
        `Processing email request: ${request.type} to ${recipientEmail}`,
      );

      const template = this.getEmailTemplate(request);
      const emailResult = await this.sendEmailWithTemplate(request, template);

      this.logger.log(
        `Email sent successfully: ${request.type} to ${recipientEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${request.type} to ${this.getEmailFromRequest(request)}`,
        error.stack,
      );
      throw error;
    }
  }

  private getEmailTemplate(request: EmailRequestDto) {
    switch (request.type) {
      case 'create-account':
        return EmailTemplates.createAccount(
          request.data.email,
          request.data.otpCode,
        );

      case 'welcome-message':
        return EmailTemplates.welcomeMessage(request.data.email);

      case 'fingerprint-verify':
        return EmailTemplates.fingerprintVerify(
          request.data.email,
          request.data.otpCode,
        );

      case 'forgot-password-verify':
        return EmailTemplates.forgotPasswordVerify(
          request.data.email,
          request.data.otpCode,
        );

      default:
        throw new Error(`Unknown email type: ${(request as any).type}`);
    }
  }

  private async sendEmailWithTemplate(request: EmailRequestDto, template: any) {
    const recipientEmail = this.getEmailFromRequest(request);
    const senderEmail = this.configService.get('SMTP_USER');

    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    this.logger.log(`Sending email from: ${mailOptions.from}`);
    this.logger.log(`Sending email to: ${mailOptions.to}`);
    this.logger.log(`Email subject: ${mailOptions.subject}`);

    return await this.transporter.sendMail(mailOptions);
  }

  private getEmailFromRequest(request: EmailRequestDto): string {
    switch (request.type) {
      case 'create-account':
        return request.data.email;
      case 'welcome-message':
        return request.data.email;
      case 'fingerprint-verify':
        return request.data.email;
      case 'forgot-password-verify':
        return request.data.email;
      default:
        return 'unknown';
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed', error.stack);
      return false;
    }
  }
}
