import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
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
      host:
        this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com') ||
        'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT', 587) || 587,
      secure: false, // true for 465, false for other ports
      requireTLS: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || '',
        pass: this.configService.get<string>('SMTP_PASS') || '',
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
      await this.sendEmailWithTemplate(request, template);

      this.logger.log(
        `Email sent successfully: ${request.type} to ${recipientEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${request.type} to ${this.getEmailFromRequest(request)}`,
        error instanceof Error ? error.stack : String(error),
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

      case 'username-change-verify':
        return EmailTemplates.usernameChangeVerify(
          request.data.email,
          request.data.otpCode,
        );

      case 'email-change-verify':
        return EmailTemplates.emailChangeVerify(
          request.data.email,
          request.data.otpCode,
        );

      case 'new-email-change-verify':
        return EmailTemplates.newEmailChangeVerify(
          request.data.email,
          request.data.otpCode,
        );

      default:
        throw new Error(
          `Unknown email type request: ${JSON.stringify(request)}`,
        );
    }
  }

  private async sendEmailWithTemplate(request: EmailRequestDto, template: any) {
    const recipientEmail = this.getEmailFromRequest(request);
    const senderEmail = this.configService.get<string>('SMTP_USER') || '';

    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      subject: template.subject as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      html: template.html as string,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      text: template.text as string,
    };

    this.logger.log(`Sending email from: ${mailOptions.from}`);
    this.logger.log(`Sending email to: ${mailOptions.to}`);
    this.logger.log(`Email subject: ${mailOptions.subject}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
      case 'username-change-verify':
        return request.data.email;
      case 'email-change-verify':
        return request.data.email;
      case 'new-email-change-verify':
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
      this.logger.error(
        'Email service connection failed',
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
