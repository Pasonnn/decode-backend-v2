import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../search.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../schemas/user.schema';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constants';
import { UserDoc } from '../../interfaces/user-doc.interface';
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

describe('SearchService', () => {
  let service: SearchService;
  let userModel: any;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    userModel = {
      aggregate: jest.fn(),
      findOne: jest.fn(),
    };

    metricsService = {
      increment: jest.fn(),
      histogram: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('searches users successfully', async () => {
      const users = [
        createUser(),
        createUser({ _id: '656a35d3b7e7b4a9a9b6b6b7', username: 'user2' }),
      ];
      const countResult = [{ total: 2 }];
      userModel.aggregate
        .mockResolvedValueOnce(users) // First call for search
        .mockResolvedValueOnce(countResult); // Second call for count

      const result = await service.searchUsers({
        email_or_username: 'test',
        page: 0,
        limit: 20,
        sortBy: 'username',
        sortOrder: 'asc',
        user_id: '656a35d3b7e7b4a9a9b6b6b8',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.SEARCH_SUCCESSFUL);
      expect(result.data?.users).toEqual(users);
      expect(result.data?.meta.total).toBe(2);
      expect(result.data?.meta.page).toBe(0);
      expect(result.data?.meta.limit).toBe(20);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        { operation: 'searchUsers', status: 'success' },
      );
      expect(metricsService.histogram).toHaveBeenCalledWith(
        'user.search.results',
        2,
        { operation: 'searchUsers' },
      );
    });

    it('returns empty results when no users found', async () => {
      userModel.aggregate
        .mockResolvedValueOnce([]) // First call for search
        .mockResolvedValueOnce([]); // Second call for count

      const result = await service.searchUsers({
        email_or_username: 'nonexistent',
        page: 0,
        limit: 20,
        sortBy: 'username',
        sortOrder: 'asc',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data?.users).toEqual([]);
      expect(result.data?.meta.total).toBe(0);
    });

    it('handles errors during search', async () => {
      userModel.aggregate.mockRejectedValue(new Error('database error'));

      const result = await service.searchUsers({
        email_or_username: 'test',
        page: 0,
        limit: 20,
        sortBy: 'username',
        sortOrder: 'asc',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(MESSAGES.SEARCH.SEARCH_FAILED);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        { operation: 'searchUsers', status: 'failed' },
      );
    });
  });

  describe('searchExistingUsername', () => {
    it('returns success when username exists', async () => {
      const user = createUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.searchExistingUsername({
        username: 'testuser',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USERNAME_ALREADY_EXISTS);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        {
          operation: 'searchExistingUsername',
          status: 'success',
          result: 'exists',
        },
      );
    });

    it('returns success when username is available', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.searchExistingUsername({
        username: 'newuser',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.USERNAME_AVAILABLE);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        {
          operation: 'searchExistingUsername',
          status: 'success',
          result: 'available',
        },
      );
    });

    it('handles errors during search', async () => {
      userModel.findOne.mockRejectedValue(new Error('database error'));

      const result = await service.searchExistingUsername({
        username: 'testuser',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(MESSAGES.SEARCH.SEARCH_FAILED);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        { operation: 'searchExistingUsername', status: 'failed' },
      );
    });
  });

  describe('searchExistingEmail', () => {
    it('returns success when email exists', async () => {
      const user = createUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.searchExistingEmail({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_ALREADY_EXISTS);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        {
          operation: 'searchExistingEmail',
          status: 'success',
          result: 'exists',
        },
      );
    });

    it('returns success when email is available', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.searchExistingEmail({
        email: 'new@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGES.SUCCESS.EMAIL_AVAILABLE);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        {
          operation: 'searchExistingEmail',
          status: 'success',
          result: 'available',
        },
      );
    });

    it('handles errors during search', async () => {
      userModel.findOne.mockRejectedValue(new Error('database error'));

      const result = await service.searchExistingEmail({
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(MESSAGES.SEARCH.SEARCH_FAILED);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'user.search.executed',
        1,
        { operation: 'searchExistingEmail', status: 'failed' },
      );
    });
  });
});
