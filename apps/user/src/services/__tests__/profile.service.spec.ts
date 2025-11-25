import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../profile.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../schemas/user.schema';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { UserDoc } from '../../interfaces/user-doc.interface';
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

describe('ProfileService', () => {
  let service: ProfileService;
  let userModel: any;
  let neo4jdbUpdateUserService: jest.Mocked<ClientProxy>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    neo4jdbUpdateUserService = {
      emit: jest.fn().mockReturnThis(),
      toPromise: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ClientProxy>;

    metricsService = {
      increment: jest.fn(),
      timing: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: 'NEO4JDB_SYNC_SERVICE', useValue: neo4jdbUpdateUserService },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('returns user profile successfully', async () => {
      const user = createUser({ is_active: true });
      userModel.findOne.mockResolvedValue(user);

      const result = await service.getUserProfile({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PROFILE_FETCHED);
      expect(result.data).toEqual(user);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.viewed',
        1,
        { operation: 'getUserProfile', status: 'success' },
      );
    });

    it('returns error when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.getUserProfile({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.viewed',
        1,
        { operation: 'getUserProfile', status: 'not_found' },
      );
    });

    it('returns error when user is inactive', async () => {
      const user = createUser({ is_active: false });
      userModel.findOne.mockResolvedValue(user);

      const result = await service.getUserProfile({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during profile fetch', async () => {
      userModel.findOne.mockRejectedValue(new Error('database error'));

      await expect(
        service.getUserProfile({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getMyProfile', () => {
    it('returns my profile successfully', async () => {
      const user = createUser();
      userModel.findById.mockResolvedValue(user);

      const result = await service.getMyProfile({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PROFILE_FETCHED);
      expect(result.data).toEqual(user);
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.getMyProfile({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during profile fetch', async () => {
      userModel.findById.mockRejectedValue(new Error('database error'));

      await expect(
        service.getMyProfile({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateUserDisplayName', () => {
    it('updates display name successfully', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        display_name: 'New Display Name',
        save: jest
          .fn()
          .mockResolvedValue({ ...user, display_name: 'New Display Name' }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.updateUserDisplayName({
        user_id: VALID_USER_ID,
        display_name: 'New Display Name',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
      expect(result.data?.display_name).toBe('New Display Name');
      expect(savedUser.save).toHaveBeenCalled();
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateDisplayName', status: 'success' },
      );
      expect(neo4jdbUpdateUserService.emit).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.updateUserDisplayName({
        user_id: VALID_USER_ID,
        display_name: 'New Display Name',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during update', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.updateUserDisplayName({
          user_id: VALID_USER_ID,
          display_name: 'New Display Name',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateUserBio', () => {
    it('updates bio successfully', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        bio: 'New bio',
        save: jest.fn().mockResolvedValue({ ...user, bio: 'New bio' }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.updateUserBio({
        user_id: VALID_USER_ID,
        bio: 'New bio',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
      expect(result.data?.bio).toBe('New bio');
      expect(savedUser.save).toHaveBeenCalled();
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateBio', status: 'success' },
      );
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.updateUserBio({
        user_id: VALID_USER_ID,
        bio: 'New bio',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during update', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.updateUserBio({
          user_id: VALID_USER_ID,
          bio: 'New bio',
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateBio', status: 'failed' },
      );
    });
  });

  describe('updateUserAvatar', () => {
    it('updates avatar successfully', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        avatar_ipfs_hash: 'new-hash',
        save: jest
          .fn()
          .mockResolvedValue({ ...user, avatar_ipfs_hash: 'new-hash' }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.updateUserAvatar({
        user_id: VALID_USER_ID,
        avatar_ipfs_hash: 'new-hash',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PROFILE_PICTURE_UPLOADED);
      expect(result.data?.avatar_ipfs_hash).toBe('new-hash');
      expect(savedUser.save).toHaveBeenCalled();
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateAvatar', status: 'success' },
      );
      expect(neo4jdbUpdateUserService.emit).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.updateUserAvatar({
        user_id: VALID_USER_ID,
        avatar_ipfs_hash: 'new-hash',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during update', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.updateUserAvatar({
          user_id: VALID_USER_ID,
          avatar_ipfs_hash: 'new-hash',
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateAvatar', status: 'failed' },
      );
    });
  });

  describe('updateUserRole', () => {
    it('updates role successfully', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        role: 'admin',
        save: jest.fn().mockResolvedValue({ ...user, role: 'admin' }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.updateUserRole({
        user_id: VALID_USER_ID,
        role: 'admin',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
      expect(result.data?.role).toBe('admin');
      expect(savedUser.save).toHaveBeenCalled();
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateRole', status: 'success' },
      );
      expect(neo4jdbUpdateUserService.emit).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.updateUserRole({
        user_id: VALID_USER_ID,
        role: 'admin',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.PROFILE.PROFILE_NOT_FOUND);
    });

    it('handles errors during update', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.updateUserRole({
          user_id: VALID_USER_ID,
          role: 'admin',
        }),
      ).rejects.toThrow(InternalServerErrorException);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.profile.updated',
        1,
        { operation: 'updateRole', status: 'failed' },
      );
    });
  });
});
