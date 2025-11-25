import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SuggestService } from '../suggest.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
import { RedisInfrastructure } from '../../infrastructure/cache/redis.infrastructure';
import { UserService } from '../user.service';
import { MetricsService } from '../../common/datadog/metrics.service';
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

describe('SuggestService', () => {
  let service: SuggestService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let userService: jest.Mocked<UserService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      getFriendsSuggestions: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    userService = {
      filterUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    metricsService = {
      increment: jest.fn(),
      histogram: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
        { provide: RedisInfrastructure, useValue: redisInfrastructure },
        { provide: UserService, useValue: userService },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<SuggestService>(SuggestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSuggestionsPaginated', () => {
    it('returns suggestions successfully', async () => {
      const suggestions = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.getFriendsSuggestions.mockResolvedValue({
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
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
      ]);
      redisInfrastructure.set.mockResolvedValue(undefined);

      const result = await service.getSuggestionsPaginated({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Suggestions fetched successfully');
      expect(result.data?.users).toHaveLength(2);
      expect(result.data?.meta.total).toBe(2);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.suggestions.generated',
        1,
        {
          operation: 'getSuggestionsPaginated',
          status: 'success',
        },
      );
      expect(metricsService.histogram).toHaveBeenCalledWith(
        'relationship.suggestions.results',
        2,
        {
          operation: 'getSuggestionsPaginated',
        },
      );
    });

    it('filters out cached suggestions', async () => {
      const suggestions = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.getFriendsSuggestions.mockResolvedValue({
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
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
      ]);
      redisInfrastructure.set.mockResolvedValue(undefined);

      const result = await service.getSuggestionsPaginated({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.users).toHaveLength(1);
      expect(redisInfrastructure.set).toHaveBeenCalled();
    });

    it('returns error when Neo4j query fails', async () => {
      neo4jInfrastructure.getFriendsSuggestions.mockResolvedValue({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed',
      });

      const result = await service.getSuggestionsPaginated({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get suggestions');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.suggestions.generated',
        1,
        {
          operation: 'getSuggestionsPaginated',
          status: 'failed',
        },
      );
    });

    it('handles errors during suggestion generation', async () => {
      neo4jInfrastructure.getFriendsSuggestions.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getSuggestionsPaginated({
        user_id: VALID_USER_ID,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get suggestions');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.suggestions.generated',
        1,
        {
          operation: 'getSuggestionsPaginated',
          status: 'failed',
        },
      );
    });
  });
});
