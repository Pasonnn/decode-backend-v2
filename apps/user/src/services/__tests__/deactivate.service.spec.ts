import { Test, TestingModule } from '@nestjs/testing';
import { DeactivateService } from '../deactivate.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../schemas/user.schema';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';

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

describe('DeactivateService', () => {
  let service: DeactivateService;
  let userModel: any;
  let neo4jdbUpdateUserService: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    userModel = {
      findById: jest.fn(),
    };

    neo4jdbUpdateUserService = {
      emit: jest.fn().mockReturnThis(),
      toPromise: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ClientProxy>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivateService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: 'NEO4JDB_SYNC_SERVICE', useValue: neo4jdbUpdateUserService },
      ],
    }).compile();

    service = module.get<DeactivateService>(DeactivateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deactivateAccount', () => {
    it('deactivates account successfully', async () => {
      const user = createUser({ is_active: true });
      const savedUser = {
        ...user,
        is_active: false,
        save: jest.fn().mockResolvedValue({ ...user, is_active: false }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.deactivateAccount({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.ACCOUNT_DEACTIVATED);
      expect(result.data?.is_active).toBe(false);
      expect(savedUser.save).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.deactivateAccount({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during deactivation', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.deactivateAccount({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('reactivateAccount', () => {
    it('reactivates account successfully', async () => {
      const user = createUser({ is_active: false });
      const savedUser = {
        ...user,
        is_active: true,
        save: jest.fn().mockResolvedValue({ ...user, is_active: true }),
      };
      userModel.findById.mockResolvedValue(savedUser);

      const result = await service.reactivateAccount({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.ACCOUNT_REACTIVATED);
      expect(result.data?.is_active).toBe(true);
      expect(savedUser.save).toHaveBeenCalled();
    });

    it('returns error when user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.reactivateAccount({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('handles errors during reactivation', async () => {
      const user = createUser();
      const savedUser = {
        ...user,
        save: jest.fn().mockRejectedValue(new Error('database error')),
      };
      userModel.findById.mockResolvedValue(savedUser);

      await expect(
        service.reactivateAccount({
          user_id: VALID_USER_ID,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
