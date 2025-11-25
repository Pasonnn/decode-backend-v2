import { PasswordService } from '../password.service';
import { PasswordUtils } from '../../utils/password.utils';
import { UserServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { InfoService } from '../info.service';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/error-messages.constants';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';

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

describe('PasswordService', () => {
  let service: PasswordService;
  let passwordUtils: jest.Mocked<PasswordUtils>;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let infoService: jest.Mocked<InfoService>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let emailService: jest.Mocked<ClientProxy>;

  const baseUser: UserDoc = {
    _id: 'user-1',
    email: 'user@example.com',
    username: 'user',
    password_hashed: '$2b$10$hashedpassword',
    role: 'user',
    display_name: 'User',
    bio: '',
    avatar_ipfs_hash: '',
    last_login: new Date(),
    is_active: true,
    last_account_deactivation: new Date(),
  };

  beforeEach(() => {
    passwordUtils = {
      comparePassword: jest.fn(),
      validatePasswordStrength: jest.fn(),
      hashPassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordUtils>;

    userServiceClient = {
      getInfoWithPasswordByUserId: jest.fn(),
      changePassword: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;

    infoService = {
      getUserInfoByEmailOrUsername: jest.fn(),
      getUserInfoByUserId: jest.fn(),
    } as unknown as jest.Mocked<InfoService>;

    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    emailService = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    service = new PasswordService(
      passwordUtils,
      userServiceClient,
      infoService,
      redisInfrastructure,
      emailService,
    );
  });

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      userServiceClient.getInfoWithPasswordByUserId.mockResolvedValue(
        successResponse(baseUser),
      );
      passwordUtils.comparePassword.mockReturnValue(true);
      passwordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        score: 4,
        feedback: [],
        requirements: {
          minLength: true,
          hasUppercase: true,
          hasLowercase: true,
          hasNumbers: true,
          hasSpecialChars: true,
        },
      });
      passwordUtils.hashPassword.mockReturnValue('$2b$10$newhashed');
      userServiceClient.changePassword.mockResolvedValue(successResponse());

      const result = await service.changePassword(
        'user-1',
        'OldPass123!',
        'NewPass123!',
      );

      expect(result.success).toBe(true);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        'OldPass123!',
        baseUser.password_hashed,
      );
      expect(userServiceClient.changePassword).toHaveBeenCalled();
    });

    it('returns error when old password is incorrect', async () => {
      userServiceClient.getInfoWithPasswordByUserId.mockResolvedValue(
        successResponse(baseUser),
      );
      passwordUtils.comparePassword.mockReturnValue(false);

      const result = await service.changePassword(
        'user-1',
        'WrongPass123!',
        'NewPass123!',
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.PASSWORD.INVALID_PASSWORD);
    });

    it('returns error when new password is weak', async () => {
      userServiceClient.getInfoWithPasswordByUserId.mockResolvedValue(
        successResponse(baseUser),
      );
      passwordUtils.comparePassword.mockReturnValue(true);
      passwordUtils.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 1,
        feedback: ['Password too weak'],
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
        },
      });

      const result = await service.changePassword(
        'user-1',
        'OldPass123!',
        'weak',
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.PASSWORD.WEAK_PASSWORD);
    });

    it('returns error when user not found', async () => {
      userServiceClient.getInfoWithPasswordByUserId.mockResolvedValue(
        failureResponse('user not found'),
      );

      const result = await service.changePassword(
        'user-1',
        'OldPass123!',
        'NewPass123!',
      );

      expect(result.success).toBe(false);
    });
  });

  describe('emailVerificationChangePassword', () => {
    it('sends email verification for password reset', async () => {
      infoService.getUserInfoByEmailOrUsername.mockResolvedValue(
        successResponse(baseUser),
      );
      redisInfrastructure.set.mockResolvedValue(undefined);
      emailService.emit.mockReturnValue(undefined);

      const result =
        await service.emailVerificationChangePassword('user@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.PASSWORD_RESET_SENT);
      expect(redisInfrastructure.set).toHaveBeenCalled();
      expect(emailService.emit).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      infoService.getUserInfoByEmailOrUsername.mockResolvedValue(
        failureResponse('user not found'),
      );

      const result =
        await service.emailVerificationChangePassword('user@example.com');

      expect(result.success).toBe(false);
    });
  });

  describe('verifyEmailChangePassword', () => {
    it('verifies email code successfully', async () => {
      const verificationValue = {
        user_id: 'user-1',
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);
      infoService.getUserInfoByUserId.mockResolvedValue(
        successResponse(baseUser),
      );

      const result = await service.verifyEmailChangePassword('code123');

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.PASSWORD_CODE_VERIFIED);
    });

    it('returns error when verification code is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.verifyEmailChangePassword('invalid');

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        MESSAGES.PASSWORD.PASSWORD_RESET_CODE_INVALID,
      );
    });
  });

  describe('changeForgotPassword', () => {
    it('changes password after verification', async () => {
      const verificationValue = {
        user_id: 'user-1',
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);
      infoService.getUserInfoByUserId.mockResolvedValue(
        successResponse(baseUser),
      );
      redisInfrastructure.del.mockResolvedValue(undefined);
      passwordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        score: 4,
        feedback: [],
        requirements: {
          minLength: true,
          hasUppercase: true,
          hasLowercase: true,
          hasNumbers: true,
          hasSpecialChars: true,
        },
      });
      passwordUtils.hashPassword.mockReturnValue('$2b$10$newhashed');
      userServiceClient.changePassword.mockResolvedValue(successResponse());

      const result = await service.changeForgotPassword(
        'code123',
        'NewPass123!',
      );

      expect(result.success).toBe(true);
      expect(redisInfrastructure.del).toHaveBeenCalled();
      expect(userServiceClient.changePassword).toHaveBeenCalled();
    });

    it('returns error when verification code is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.changeForgotPassword(
        'invalid',
        'NewPass123!',
      );

      expect(result.success).toBe(false);
    });

    it('returns error when new password is weak', async () => {
      const verificationValue = {
        user_id: 'user-1',
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);
      infoService.getUserInfoByUserId.mockResolvedValue(
        successResponse(baseUser),
      );
      passwordUtils.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 1,
        feedback: ['Password too weak'],
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
        },
      });

      const result = await service.changeForgotPassword('code123', 'weak');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.PASSWORD.WEAK_PASSWORD);
    });
  });

  describe('checkPassword', () => {
    it('returns success when password matches', () => {
      passwordUtils.comparePassword.mockReturnValue(true);

      const result = service.checkPassword('password', '$2b$10$hashed');

      expect(result.success).toBe(true);
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(
        'password',
        '$2b$10$hashed',
      );
    });

    it('returns error when password does not match', () => {
      passwordUtils.comparePassword.mockReturnValue(false);

      const result = service.checkPassword('wrong', '$2b$10$hashed');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.PASSWORD.INVALID_PASSWORD);
    });
  });

  describe('passwordVerificationAndHashing', () => {
    it('returns hashed password when password is valid', () => {
      passwordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        score: 4,
        feedback: [],
        requirements: {
          minLength: true,
          hasUppercase: true,
          hasLowercase: true,
          hasNumbers: true,
          hasSpecialChars: true,
        },
      });
      passwordUtils.hashPassword.mockReturnValue('$2b$10$hashed');

      const result = service.passwordVerificationAndHashing('ValidPass123!');

      expect(result.success).toBe(true);
      expect(result.data?.password_hashed).toBe('$2b$10$hashed');
    });

    it('returns error when password is weak', () => {
      passwordUtils.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 1,
        feedback: ['Password too weak'],
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
        },
      });

      const result = service.passwordVerificationAndHashing('weak');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.PASSWORD.WEAK_PASSWORD);
    });
  });
});
