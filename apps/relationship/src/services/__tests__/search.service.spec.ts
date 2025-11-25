import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SearchService } from '../search.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
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

describe('SearchService', () => {
  let service: SearchService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;
  let userService: jest.Mocked<UserService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      searchFollowers: jest.fn(),
      searchFollowing: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    userService = {
      filterUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    metricsService = {
      increment: jest.fn(),
      histogram: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
        { provide: UserService, useValue: userService },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchFollowers', () => {
    it('searches followers successfully', async () => {
      const followers = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.searchFollowers.mockResolvedValue(followers);
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
      ]);

      const result = await service.searchFollowers({
        user_id: VALID_USER_ID,
        params: 'test',
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Followers fetched successfully');
      expect(result.data?.users).toHaveLength(2);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.search.executed',
        1,
        {
          operation: 'searchFollowers',
          status: 'success',
        },
      );
      expect(metricsService.histogram).toHaveBeenCalledWith(
        'relationship.search.results',
        2,
        {
          operation: 'searchFollowers',
        },
      );
    });

    it('returns not found when no followers match', async () => {
      neo4jInfrastructure.searchFollowers.mockResolvedValue([]);

      const result = await service.searchFollowers({
        user_id: VALID_USER_ID,
        params: 'nonexistent',
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe('No followers found for params: nonexistent');
    });

    it('handles errors when searching followers', async () => {
      neo4jInfrastructure.searchFollowers.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.searchFollowers({
        user_id: VALID_USER_ID,
        params: 'test',
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to search followers');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.search.executed',
        1,
        {
          operation: 'searchFollowers',
          status: 'failed',
        },
      );
    });
  });

  describe('searchFollowing', () => {
    it('searches following successfully', async () => {
      const following = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.searchFollowing.mockResolvedValue(following);
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
      ]);

      const result = await service.searchFollowing({
        user_id: VALID_USER_ID,
        params: 'test',
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Following fetched successfully');
      expect(result.data?.users).toHaveLength(2);
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.search.executed',
        1,
        {
          operation: 'searchFollowing',
          status: 'success',
        },
      );
      expect(metricsService.histogram).toHaveBeenCalledWith(
        'relationship.search.results',
        2,
        {
          operation: 'searchFollowing',
        },
      );
    });

    it('returns not found when no following match', async () => {
      neo4jInfrastructure.searchFollowing.mockResolvedValue([]);

      const result = await service.searchFollowing({
        user_id: VALID_USER_ID,
        params: 'nonexistent',
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe('No following found for params: nonexistent');
    });

    it('handles errors when searching following', async () => {
      neo4jInfrastructure.searchFollowing.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.searchFollowing({
        user_id: VALID_USER_ID,
        params: 'test',
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to search following');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.search.executed',
        1,
        {
          operation: 'searchFollowing',
          status: 'failed',
        },
      );
    });
  });
});
