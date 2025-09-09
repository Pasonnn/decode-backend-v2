import { Test, TestingModule } from '@nestjs/testing';
import { EmailWorkerController } from '../src/email-worker.controller';
import { EmailService } from '../src/services/email-worker.service';
import { RabbitMQService } from '../src/services/rabbitmq.service';
import { EmailRequestDto } from '../src/dto/email.dto';

describe('EmailWorkerController', () => {
  let controller: EmailWorkerController;
  let emailService: EmailService;
  let rabbitMQService: RabbitMQService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailWorkerController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
            testConnection: jest.fn(),
          },
        },
        {
          provide: RabbitMQService,
          useValue: {
            processEmailRequest: jest.fn(),
            sendEmailRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailWorkerController>(EmailWorkerController);
    emailService = module.get<EmailService>(EmailService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleEmailRequest', () => {
    it('should process email request successfully', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'new-email-change-verify',
        data: {
          email: 'test@example.com',
          otpCode: '123456',
        },
      };

      const processEmailRequestSpy = jest
        .spyOn(rabbitMQService, 'processEmailRequest')
        .mockResolvedValue(undefined);

      const result = await controller.handleEmailRequest(mockRequest);

      expect(result).toEqual({
        success: true,
        message: 'Email processed successfully',
      });
      expect(processEmailRequestSpy).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle errors in email request processing', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'new-email-change-verify',
        data: {
          email: 'test@example.com',
          otpCode: '123456',
        },
      };

      const error = new Error('Processing failed');
      jest
        .spyOn(rabbitMQService, 'processEmailRequest')
        .mockRejectedValue(error);

      const result = await controller.handleEmailRequest(mockRequest);

      expect(result).toEqual({
        success: false,
        error: 'Processing failed',
      });
    });
  });

  describe('handleNewEmailChangeVerify', () => {
    it('should send new email change verification email successfully', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'new-email-change-verify',
        data: {
          email: 'newemail@example.com',
          otpCode: '123456',
        },
      };

      const sendEmailSpy = jest
        .spyOn(emailService, 'sendEmail')
        .mockResolvedValue(true);

      const result = await controller.handleNewEmailChangeVerify(mockRequest);

      expect(result).toEqual({
        success: true,
        message: 'New email change verification email sent successfully',
        email: 'newemail@example.com',
      });
      expect(sendEmailSpy).toHaveBeenCalledWith(mockRequest);
    });

    it('should reject invalid email type', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'email-change-verify',
        data: {
          email: 'test@example.com',
          otpCode: '123456',
        },
      };

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      const result = await controller.handleNewEmailChangeVerify(mockRequest);

      expect(result).toEqual({
        success: false,
        error: 'Invalid email type. Expected new-email-change-verify',
      });
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('should handle errors in email sending', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'new-email-change-verify',
        data: {
          email: 'newemail@example.com',
          otpCode: '123456',
        },
      };

      const error = new Error('Email service failed');
      jest.spyOn(emailService, 'sendEmail').mockRejectedValue(error);

      const result = await controller.handleNewEmailChangeVerify(mockRequest);

      expect(result).toEqual({
        success: false,
        error: 'Email service failed',
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'new-email-change-verify',
        data: {
          email: 'test@example.com',
          otpCode: '123456',
        },
      };

      const sendEmailSpy = jest
        .spyOn(emailService, 'sendEmail')
        .mockResolvedValue(true);

      await controller.sendEmail(mockRequest);

      expect(sendEmailSpy).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('queueEmail', () => {
    it('should queue email successfully', async () => {
      const mockRequest: EmailRequestDto = {
        type: 'new-email-change-verify',
        data: {
          email: 'test@example.com',
          otpCode: '123456',
        },
      };

      const sendEmailRequestSpy = jest
        .spyOn(rabbitMQService, 'sendEmailRequest')
        .mockResolvedValue(undefined);

      const result = await controller.queueEmail(mockRequest);

      expect(result).toEqual({
        success: true,
        message: 'Email queued successfully',
      });
      expect(sendEmailRequestSpy).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      jest.spyOn(emailService, 'testConnection').mockResolvedValue(true);

      const result = await controller.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('emailService', 'connected');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
