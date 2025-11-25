import { Test, TestingModule } from '@nestjs/testing';
import { UsernameService } from '../username.service';
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
  last_username_change: new Date(
    Date.now() - USER_CONSTANTS.USERNAME.CHANGE_COOLDOWN - 1000,
  ), // Old enough to allow change
  last_email_change: new Date(),
  is_active: true,
  last_account_deactivation: new Date(),
  ...overrides,
});

describe('UsernameService', () => {
  let service: UsernameService;
  let userModel: any;
  let emailService: jest.Mocked<ClientProxy>;
  let neo4jdbUpdateUserService: jest.Mocked<ClientProxy>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    emailService = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    neo4jdbUpdateUserService = {
      emit: jest.fn().mockReturnThis(),
      toPromise: jest.fn().mockResolvedValue(undefined),
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
        UsernameService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: 'EMAIL_SERVICE', useValue: emailService },
        { provide: 'NEO4JDB_SYNC_SERVICE', useValue: neo4jdbUpdateUserService },
        { provide: RedisInfrastructure, useValue: redisInfrastructure },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<UsernameService>(UsernameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('changeUsernameInitiate', () => {
    it('initiates username change successfully', async () => {
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

      const result = await service.changeUsernameInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.username.changed',
        1,
        { operation: 'changeUsernameInitiate', status: 'success' },
      );
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.changeUsernameInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('returns error when cooldown is active', async () => {
      const user = createUser({
        last_username_change: new Date(), // Recent change
      });
      userModel.findById.mockResolvedValue(user);

      const result = await service.changeUsernameInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.USERNAME.USERNAME_CHANGE_COOLDOWN_ACTIVE,
      );
    });

    it('handles errors during username change initiation', async () => {
      userModel.findById.mockRejectedValue(new Error('database error'));

      const result = await service.changeUsernameInitiate({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.username.changed',
        1,
        { operation: 'changeUsernameInitiate', status: 'failed' },
      );
    });
  });

  describe('verifyUsernameCode', () => {
    it('verifies username code successfully', async () => {
      const verificationValue = {
        user_id: VALID_USER_ID,
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);

      const result = await service.verifyUsernameCode({
        user_id: VALID_USER_ID,
        code: 'code123',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(
        MESSAGES.SUCCESS.USERNAME_CHANGE_CODE_VERIFIED,
      );
    });

    it('returns error when verification code is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.verifyUsernameCode({
        user_id: VALID_USER_ID,
        code: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.USERNAME.USERNAME_CHANGE_CODE_INVALID,
      );
    });

    it('returns error when user_id does not match', async () => {
      const verificationValue = {
        user_id: 'different-user-id',
        verification_code: 'code123',
      };
      redisInfrastructure.get.mockResolvedValue(verificationValue);

      const result = await service.verifyUsernameCode({
        user_id: VALID_USER_ID,
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe(
        MESSAGES.USERNAME.USERNAME_CHANGE_CODE_INVALID,
      );
    });
  });

  describe('changeUsername', () => {
    it('changes username successfully', async () => {
      const user = createUser();
      const updatedUser = { ...user, username: 'newusername' };
      userModel.findById
        .mockResolvedValueOnce(user) // First call in changeUsername
        .mockResolvedValueOnce(updatedUser); // Second call after update
      userModel.findByIdAndUpdate.mockResolvedValue(undefined);
      redisInfrastructure.get.mockResolvedValue({
        user_id: VALID_USER_ID,
        verification_code: 'code123',
      });
      redisInfrastructure.del.mockResolvedValue(undefined);

      // Mock verifyUsernameCode
      jest.spyOn(service, 'verifyUsernameCode').mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USERNAME_CHANGE_CODE_VERIFIED,
      });

      const result = await service.changeUsername({
        user_id: VALID_USER_ID,
        new_username: 'newusername',
        code: 'code123',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USERNAME_CHANGED);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_USER_ID,
        expect.objectContaining({
          username: 'newusername',
        }),
      );
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.username.changed',
        1,
        { operation: 'changeUsername', status: 'success' },
      );
      expect(neo4jdbUpdateUserService.emit).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.changeUsername({
        user_id: VALID_USER_ID,
        new_username: 'newusername',
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('returns error when new username is same as current', async () => {
      const user = createUser({ username: 'testuser' });
      userModel.findById.mockResolvedValue(user);

      const result = await service.changeUsername({
        user_id: VALID_USER_ID,
        new_username: 'testuser',
        code: 'code123',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(MESSAGES.USERNAME.USERNAME_ALREADY_EXISTS);
    });

    it('returns error when verification code is invalid', async () => {
      const user = createUser();
      userModel.findById.mockResolvedValue(user);

      jest.spyOn(service, 'verifyUsernameCode').mockResolvedValue({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USERNAME.USERNAME_CHANGE_CODE_INVALID,
      });

      const result = await service.changeUsername({
        user_id: VALID_USER_ID,
        new_username: 'newusername',
        code: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(
        MESSAGES.USERNAME.USERNAME_CHANGE_CODE_INVALID,
      );
    });
  });
});
