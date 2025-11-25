import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../email.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../schemas/user.schema';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { USER_CONSTANTS } from '../../constants/user.constants';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { ClientProxy } from '@nestjs/microservices';
import { MetricsService } from '../../common/datadog/metrics.service';

const VALID_USER_ID = '656a35d3b7e7b4a9a9b6b6b6'; // Valid ObjectId string

const createUser = (overrides?: Partial<UserDoc>): UserDoc => ({
  _id: VALID_USER_ID,
  email: 'test@example.com',
  username: 'testuser',
  password_hashed: 'hashedpassword',
  display_name: 'Test User',
  bio: 'Test bio',
  avatar_ipfs_hash: 'hash',
  role: 'user',
  last_login: new Date(),
  last_username_change: new Date(),
  last_email_change: new Date(),
  is_active: true,
  last_account_deactivation: new Date(),
  ...overrides,
});

describe('EmailService', () => {
  let service: EmailService;
  let userModel: any;
  let emailService: jest.Mocked<ClientProxy>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    emailService = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    metricsService = {
      increment: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: 'EMAIL_SERVICE', useValue: emailService },
        { provide: RedisInfrastructure, useValue: redisInfrastructure },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('changeEmailInitiate', () => {
    it('initiates email change successfully', async () => {
      const user = createUser();
      userModel.findById.mockResolvedValue(user);
      redisInfrastructure.set.mockResolvedValue(undefined);
      emailService.emit.mockReturnValue(undefined);

      // Mock the private sendEmailVerification method
      jest.spyOn(service as any, 'sendEmailVerification').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      });

      const result = await service.changeEmailInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.email.changed',
        1,
        { operation: 'changeEmailInitiate', status: 'success' },
      );
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.changeEmailInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during email change initiation', async () => {
      userModel.findById.mockRejectedValue(new Error('database error'));

      const result = await service.changeEmailInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.email.changed',
        1,
        { operation: 'changeEmailInitiate', status: 'failed' },
      );
    });
  });

  describe('verifyEmailCode', () => {
    it('verifies email code successfully', async () => {
      const verificationValue = {
        user_id: VALID_USER_ID,
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);

      const result = await service.verifyEmailCode({
        user_id: VALID_USER_ID,
        code: 'code123',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_CHANGE_CODE_VERIFIED);
    });

    it('returns error when verification code is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.verifyEmailCode({
        user_id: VALID_USER_ID,
        code: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.EMAIL_CHANGE.EMAIL_CHANGE_CODE_INVALID,
      );
    });

    it('returns error when user_id does not match', async () => {
      const verificationValue = {
        user_id: 'different-user-id',
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);

      const result = await service.verifyEmailCode({
        user_id: VALID_USER_ID,
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe(
        MESSAGES.EMAIL_CHANGE.EMAIL_CHANGE_CODE_INVALID,
      );
    });
  });

  describe('newEmailInitiate', () => {
    it('initiates new email change successfully', async () => {
      const user = createUser({ email: 'old@example.com' });
      userModel.findById.mockResolvedValue(user);
      userModel.findOne.mockResolvedValue(null); // No existing email
      redisInfrastructure.get.mockResolvedValue({
        user_id: VALID_USER_ID,
        verification_code: 'code123',
      });
      redisInfrastructure.del.mockResolvedValue(undefined);
      redisInfrastructure.set.mockResolvedValue(undefined);
      emailService.emit.mockReturnValue(undefined);

      // Mock verifyEmailCode and sendNewEmailVerification
      jest.spyOn(service, 'verifyEmailCode').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_CHANGE_CODE_VERIFIED,
      });
      jest.spyOn(service as any, 'sendNewEmailVerification').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      });

      const result = await service.newEmailInitiate({
        user_id: VALID_USER_ID,
        new_email: 'new@example.com',
        code: 'code123',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.NEW_EMAIL_CHANGE_INITIATED);
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.newEmailInitiate({
        user_id: VALID_USER_ID,
        new_email: 'new@example.com',
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('returns error when new email is current email', async () => {
      const user = createUser({ email: 'test@example.com' });
      userModel.findById.mockResolvedValue(user);

      const result = await service.newEmailInitiate({
        user_id: VALID_USER_ID,
        new_email: 'test@example.com',
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.EMAIL_CHANGE.EMAIL_NEW_IS_CURRENT);
    });

    it('returns error when email already exists', async () => {
      const user = createUser({ email: 'old@example.com' });
      const existingUser = createUser({ email: 'new@example.com' });
      userModel.findById.mockResolvedValue(user);
      userModel.findOne.mockResolvedValue(existingUser);

      const result = await service.newEmailInitiate({
        user_id: VALID_USER_ID,
        new_email: 'new@example.com',
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.EMAIL_CHANGE.NEW_EMAIL_ALREADY_EXISTS,
      );
    });
  });

  describe('verifyNewEmailCode', () => {
    it('verifies new email code and changes email successfully', async () => {
      const verificationValue = {
        user_id: VALID_USER_ID,
        verification_code: 'code123',
        new_email: 'new@example.com',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);
      redisInfrastructure.del.mockResolvedValue(undefined);
      userModel.findByIdAndUpdate.mockResolvedValue(undefined);

      // Mock the private changeEmail method
      jest.spyOn(service as any, 'changeEmail').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_CHANGED,
      });

      const result = await service.verifyNewEmailCode({
        user_id: VALID_USER_ID,
        code: 'code123',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_CHANGED);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.email.changed',
        1,
        { operation: 'verifyNewEmailCode', status: 'success' },
      );
    });

    it('returns error when verification code is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.verifyNewEmailCode({
        user_id: VALID_USER_ID,
        code: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.EMAIL_CHANGE.NEW_EMAIL_CHANGE_CODE_INVALID,
      );
    });

    it('returns error when user_id does not match', async () => {
      const verificationValue = {
        user_id: 'different-user-id',
        verification_code: 'code123',
        new_email: 'new@example.com',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);

      const result = await service.verifyNewEmailCode({
        user_id: VALID_USER_ID,
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe(
        MESSAGES.EMAIL_CHANGE.NEW_EMAIL_CHANGE_CODE_INVALID,
      );
    });
  });
});
