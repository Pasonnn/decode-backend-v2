import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { InterestService } from '../interest.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
import { RedisInfrastructure } from '../../infrastructure/cache/redis.infrastructure';
import { UserService } from '../user.service';
import { Interest } from '../../dto/interest.dto';
import { NodeResponse } from '../../interfaces/node-response.interface';
import { UserNeo4jDoc } from '../../interfaces/user-neo4j-doc.interface';

const VALID_USER_ID = '656a35d3b7e7b4a9a9b6b6b6'; // Valid ObjectId string

const createUserNeo4jDoc = (
  overrides?: Partial<UserNeo4jDoc>,
): UserNeo4jDoc => ({
  _id: VALID_USER_ID,
  user_id: VALID_USER_ID,
  username: 'testuser',
  role: 'user',
  display_name: 'Test User',
  avatar_ipfs_hash: 'hash123',
  following_number: 0,
  followers_number: 0,
  ...overrides,
});

const createNodeResponse = (
  userDoc: UserNeo4jDoc,
): NodeResponse<UserNeo4jDoc> => ({
  identity: { low: 1, high: 0 },
  labels: ['User'],
  properties: userDoc,
  elementId: 'element-1',
});

const createInterestNodeResponse = (
  interest: Interest,
): NodeResponse<Interest> => ({
  identity: { low: 1, high: 0 },
  labels: ['Interest'],
  properties: interest,
  elementId: 'element-1',
});

describe('InterestService', () => {
  let service: InterestService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      createUserInterests: jest.fn(),
      listUserInterests: jest.fn(),
      getUsersWithSameInterests: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    userService = {
      filterFollowingUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterestService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
        { provide: RedisInfrastructure, useValue: redisInfrastructure },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<InterestService>(InterestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserInterests', () => {
    it('creates user interests successfully', async () => {
      neo4jInfrastructure.createUserInterests.mockResolvedValue(true);

      const result = await service.createUserInterests({
        user_id: VALID_USER_ID,
        interests: [Interest.NETWORKING, Interest.CREATOR_ECONOMY],
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User interests created successfully');
      expect(neo4jInfrastructure.createUserInterests).toHaveBeenCalledWith({
        user_id: VALID_USER_ID,
        interests: [Interest.NETWORKING, Interest.CREATOR_ECONOMY],
      });
    });

    it('returns error when creation fails', async () => {
      neo4jInfrastructure.createUserInterests.mockResolvedValue(false);

      const result = await service.createUserInterests({
        user_id: VALID_USER_ID,
        interests: [Interest.NETWORKING],
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to create user interests');
    });
  });

  describe('getUserInterests', () => {
    it('returns user interests successfully', async () => {
      const interests = [
        createInterestNodeResponse(Interest.NETWORKING),
        createInterestNodeResponse(Interest.CREATOR_ECONOMY),
      ];
      neo4jInfrastructure.listUserInterests.mockResolvedValue(interests);

      const result = await service.getUserInterests({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User interests fetched successfully');
      expect(result.data).toEqual([
        Interest.NETWORKING,
        Interest.CREATOR_ECONOMY,
      ]);
    });

    it('returns error when Neo4j query fails', async () => {
      neo4jInfrastructure.listUserInterests.mockResolvedValue(null);

      const result = await service.getUserInterests({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get user interests');
    });

    it('returns not found when no interests found', async () => {
      neo4jInfrastructure.listUserInterests.mockResolvedValue([]);

      const result = await service.getUserInterests({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe('User interests not found');
      expect(result.data).toEqual([]);
    });
  });

  describe('interestSuggestUser', () => {
    it('returns interest-based suggestions successfully', async () => {
      const suggestions = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.getUsersWithSameInterests.mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: {
          users: suggestions,
          meta: {
            total: 2,
            page: 0,
            limit: 10,
            is_last_page: true,
          },
        },
      });
      redisInfrastructure.get.mockResolvedValue(null);
      userService.filterFollowingUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
      ]);
      redisInfrastructure.set.mockResolvedValue(undefined);
      redisInfrastructure.del.mockResolvedValue(undefined);

      const result = await service.interestSuggestUser({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data?.users).toHaveLength(2);
      expect(result.data?.meta.total).toBe(2);
      expect(redisInfrastructure.del).toHaveBeenCalled();
    });

    it('filters out cached suggestions', async () => {
      const suggestions = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.getUsersWithSameInterests.mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: {
          users: suggestions,
          meta: {
            total: 2,
            page: 0,
            limit: 10,
            is_last_page: true,
          },
        },
      });
      // First user is cached
      redisInfrastructure.get.mockResolvedValue([VALID_USER_ID]);
      userService.filterFollowingUsers.mockResolvedValue([
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
      ]);
      redisInfrastructure.set.mockResolvedValue(undefined);
      redisInfrastructure.del.mockResolvedValue(undefined);

      const result = await service.interestSuggestUser({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.users).toHaveLength(1);
      expect(redisInfrastructure.set).toHaveBeenCalled();
    });

    it('returns error when Neo4j query fails', async () => {
      neo4jInfrastructure.getUsersWithSameInterests.mockResolvedValue({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed',
      });

      const result = await service.interestSuggestUser({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get interest-based suggestions');
    });

    it('handles errors during interest suggestion', async () => {
      neo4jInfrastructure.getUsersWithSameInterests.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.interestSuggestUser({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get interest-based suggestions');
    });
  });
});
