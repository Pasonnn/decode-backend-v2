import { RegisterService } from '../register.service';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { PasswordService } from '../password.service';
import { UserServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/error-messages.constants';
import { RegisterInfoValue } from '../../interfaces/register-info-value.interface';
import { EmailVerificationValue } from '../../interfaces/email-verification-value.interface';

const successResponse = <T>(data?: T): Response<T> => ({
  success: true,
  statusCode: 200,
  message: 'ok',
  data,
});

const failureResponse = <T = unknown>(
  message: string,
  data?: T,
): Response<T> => ({
  success: false,
  statusCode: 400,
  message,
  data,
});

describe('RegisterService', () => {
  let service: RegisterService;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let passwordService: jest.Mocked<PasswordService>;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let emailService: jest.Mocked<ClientProxy>;
  let neo4jdbCreateUserService: jest.Mocked<ClientProxy>;

  const baseUser: UserDoc = {
    _id: 'user-1',
    email: 'user@example.com',
    username: 'user',
    password_hashed: '$2b$10$hashed',
    role: 'user',
    display_name: 'User',
    bio: '',
    avatar_ipfs_hash: '',
    last_login: new Date(),
    is_active: true,
    last_account_deactivation: new Date(),
  };

  beforeEach(() => {
    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    passwordService = {
      passwordVerificationAndHashing: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    userServiceClient = {
      checkUserExistsByEmailOrUsername: jest.fn(),
      createUser: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;

    emailService = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    neo4jdbCreateUserService = {
      emit: jest.fn().mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(undefined),
      }),
    } as unknown as jest.Mocked<ClientProxy>;

    service = new RegisterService(
      redisInfrastructure,
      passwordService,
      userServiceClient,
      emailService,
      neo4jdbCreateUserService,
    );
  });

  describe('emailVerificationRegister', () => {
    it('initiates registration successfully', async () => {
      passwordService.passwordVerificationAndHashing.mockReturnValue(
        successResponse({ password_hashed: '$2b$10$hashed' }),
      );
      userServiceClient.checkUserExistsByEmailOrUsername
        .mockResolvedValueOnce(failureResponse('not found'))
        .mockResolvedValueOnce(failureResponse('not found'));
      redisInfrastructure.set.mockResolvedValue(undefined);
      redisInfrastructure.get.mockResolvedValue({
        username: 'user',
        email: 'user@example.com',
        password_hashed: '$2b$10$hashed',
      } as RegisterInfoValue);
      emailService.emit.mockReturnValue(undefined);

      const result = await service.emailVerificationRegister({
        username: 'user',
        email: 'user@example.com',
        password: 'ValidPass123!',
      });

      expect(result.success).toBe(true);
      expect(
        passwordService.passwordVerificationAndHashing,
      ).toHaveBeenCalledWith('ValidPass123!');
      expect(redisInfrastructure.set).toHaveBeenCalled();
      expect(emailService.emit).toHaveBeenCalled();
    });

    it('returns error when password is weak', async () => {
      passwordService.passwordVerificationAndHashing.mockReturnValue(
        failureResponse(MESSAGES.PASSWORD.WEAK_PASSWORD),
      );

      const result = await service.emailVerificationRegister({
        username: 'user',
        email: 'user@example.com',
        password: 'weak',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.PASSWORD.WEAK_PASSWORD);
    });

    it('returns error when email already exists', async () => {
      passwordService.passwordVerificationAndHashing.mockReturnValue(
        successResponse({ password_hashed: '$2b$10$hashed' }),
      );
      userServiceClient.checkUserExistsByEmailOrUsername.mockResolvedValue(
        successResponse(true),
      );

      const result = await service.emailVerificationRegister({
        username: 'user',
        email: 'existing@example.com',
        password: 'ValidPass123!',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        MESSAGES.REGISTRATION.EMAIL_OR_USERNAME_EXISTS,
      );
    });

    it('returns error when username already exists', async () => {
      passwordService.passwordVerificationAndHashing.mockReturnValue(
        successResponse({ password_hashed: '$2b$10$hashed' }),
      );
      userServiceClient.checkUserExistsByEmailOrUsername
        .mockResolvedValueOnce(failureResponse('not found'))
        .mockResolvedValueOnce(successResponse(true));

      const result = await service.emailVerificationRegister({
        username: 'existing',
        email: 'user@example.com',
        password: 'ValidPass123!',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        MESSAGES.REGISTRATION.EMAIL_OR_USERNAME_EXISTS,
      );
    });
  });

  describe('verifyEmailRegister', () => {
    it('creates user after email verification', async () => {
      const emailVerificationValue: EmailVerificationValue = {
        email: 'user@example.com',
        code: 'code123',
      };
      redisInfrastructure.get
        .mockResolvedValueOnce(emailVerificationValue)
        .mockResolvedValueOnce({
          username: 'user',
          email: 'user@example.com',
          password_hashed: '$2b$10$hashed',
        } as RegisterInfoValue);
      redisInfrastructure.del.mockResolvedValue(undefined);
      userServiceClient.checkUserExistsByEmailOrUsername.mockResolvedValue(
        failureResponse('not found'),
      );
      userServiceClient.createUser.mockResolvedValue(successResponse(baseUser));
      emailService.emit.mockReturnValue(undefined);

      const result = await service.verifyEmailRegister('code123');

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_CREATED);
      expect(userServiceClient.createUser).toHaveBeenCalled();
      expect(neo4jdbCreateUserService.emit).toHaveBeenCalled();
      expect(emailService.emit).toHaveBeenCalled();
    });

    it('returns error when verification code is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.verifyEmailRegister('invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.EMAIL_VERIFICATION.INVALID_CODE);
    });

    it('returns error when user already exists', async () => {
      const emailVerificationValue: EmailVerificationValue = {
        email: 'user@example.com',
        code: 'code123',
      };
      redisInfrastructure.get
        .mockResolvedValueOnce(emailVerificationValue)
        .mockResolvedValueOnce({
          username: 'user',
          email: 'user@example.com',
          password_hashed: '$2b$10$hashed',
        } as RegisterInfoValue);
      userServiceClient.checkUserExistsByEmailOrUsername.mockResolvedValue(
        successResponse(true),
      );

      const result = await service.verifyEmailRegister('code123');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.REGISTRATION.EXISTING_USER);
    });

    it('returns error when register info not found in Redis', async () => {
      const emailVerificationValue: EmailVerificationValue = {
        email: 'user@example.com',
        code: 'code123',
      };
      redisInfrastructure.get
        .mockResolvedValueOnce(emailVerificationValue)
        .mockResolvedValueOnce(null);

      const result = await service.verifyEmailRegister('code123');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.REGISTRATION.REGISTER_INFO_INVALID);
    });
  });

  describe('sendEmailVerification', () => {
    it('sends email verification code', async () => {
      const registerInfo: RegisterInfoValue = {
        username: 'user',
        email: 'user@example.com',
        password_hashed: '$2b$10$hashed',
      };
      redisInfrastructure.get.mockResolvedValue(registerInfo);
      redisInfrastructure.set.mockResolvedValue(undefined);
      emailService.emit.mockReturnValue(undefined);

      const result = await service.sendEmailVerification('user@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT);
      expect(redisInfrastructure.set).toHaveBeenCalled();
      expect(emailService.emit).toHaveBeenCalled();
    });

    it('returns error when register info not found', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.sendEmailVerification('user@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        MESSAGES.REGISTRATION.REGISTER_INFO_NOT_FOUND,
      );
    });
  });
});
