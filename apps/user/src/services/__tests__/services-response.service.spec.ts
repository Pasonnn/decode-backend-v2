import { Test, TestingModule } from '@nestjs/testing';
import { ServicesResponseService } from '../services-response.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../schemas/user.schema';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { UserDoc } from '../../interfaces/user-doc.interface';

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

describe('ServicesResponseService', () => {
  let service: ServicesResponseService;
  let userModel: any;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesResponseService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<ServicesResponseService>(ServicesResponseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserExistsByEmailOrUsername', () => {
    it('returns user when found by email', async () => {
      const user = createUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.checkUserExistsByEmailOrUsername({
        email_or_username: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_INFO_FETCHED);
      expect(result.data).toEqual(user);
    });

    it('returns user when found by username', async () => {
      const user = createUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.checkUserExistsByEmailOrUsername({
        email_or_username: 'testuser',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(user);
    });

    it('returns error when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.checkUserExistsByEmailOrUsername({
        email_or_username: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during check', async () => {
      userModel.findOne.mockRejectedValue(new Error('database error'));

      await expect(
        service.checkUserExistsByEmailOrUsername({
          email_or_username: 'test@example.com',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createUser', () => {
    it('creates user successfully', async () => {
      const newUser = createUser();
      userModel.create.mockResolvedValue(newUser);

      const result = await service.createUser({
        email: 'new@example.com',
        username: 'newuser',
        password_hashed: 'hashed',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_CREATED);
      expect(result.data).toEqual(newUser);
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          username: 'newuser',
          password_hashed: 'hashed',
        }),
      );
    });

    it('handles errors during user creation', async () => {
      userModel.create.mockRejectedValue(new Error('database error'));

      await expect(
        service.createUser({
          email: 'new@example.com',
          username: 'newuser',
          password_hashed: 'hashed',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        password_hashed: 'newhashed',
        save: jest
          .fn()
          .mockResolvedValue({ ...user, password_hashed: 'newhashed' }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.changePassword({
        user_id: VALID_USER_ID,
        password_hashed: 'newhashed',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.PASSWORD_CHANGED);
      expect(savedUser.password_hashed).toBe('newhashed');
      expect(savedUser.save).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.changePassword({
        user_id: VALID_USER_ID,
        password_hashed: 'newhashed',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during password change', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.changePassword({
          user_id: VALID_USER_ID,
          password_hashed: 'newhashed',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getInfoByEmailOrUsername', () => {
    it('returns user info when found', async () => {
      const user = createUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.getInfoByEmailOrUsername({
        email_or_username: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_INFO_FETCHED);
      expect(result.data).toEqual(user);
    });

    it('returns error when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.getInfoByEmailOrUsername({
        email_or_username: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during fetch', async () => {
      userModel.findOne.mockRejectedValue(new Error('database error'));

      await expect(
        service.getInfoByEmailOrUsername({
          email_or_username: 'test@example.com',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getInfoByUserId', () => {
    it('returns user info when found', async () => {
      const user = createUser();
      userModel.findById.mockResolvedValue(user);

      const result = await service.getInfoByUserId({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_INFO_FETCHED);
      expect(result.data).toEqual(user);
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.getInfoByUserId({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during fetch', async () => {
      userModel.findById.mockRejectedValue(new Error('database error'));

      await expect(
        service.getInfoByUserId({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getInfoWithPasswordByUserEmailOrUsername', () => {
    it('returns user info with password when found', async () => {
      const user = createUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.getInfoWithPasswordByUserEmailOrUsername({
        email_or_username: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_INFO_FETCHED);
      expect(result.data).toEqual(user);
    });

    it('returns error when user not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.getInfoWithPasswordByUserEmailOrUsername({
        email_or_username: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during fetch', async () => {
      userModel.findOne.mockRejectedValue(new Error('database error'));

      await expect(
        service.getInfoWithPasswordByUserEmailOrUsername({
          email_or_username: 'test@example.com',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getInfoWithPasswordByUserId', () => {
    it('returns user info with password when found', async () => {
      const user = createUser();
      userModel.findById.mockResolvedValue(user);

      const result = await service.getInfoWithPasswordByUserId({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_INFO_FETCHED);
      expect(result.data).toEqual(user);
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.getInfoWithPasswordByUserId({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during fetch', async () => {
      userModel.findById.mockRejectedValue(new Error('database error'));

      await expect(
        service.getInfoWithPasswordByUserId({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateUserLastLogin', () => {
    it('updates last login successfully', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        last_login: new Date(),
        save: jest.fn().mockResolvedValue({ ...user, last_login: new Date() }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.updateUserLastLogin({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_UPDATED);
      expect(savedUser.save).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.updateUserLastLogin({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during update', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.updateUserLastLogin({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
