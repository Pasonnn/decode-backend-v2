import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserService } from '../user.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
import { MutualService } from '../mutual.service';
import { NodeResponse } from '../../interfaces/node-response.interface';
import { UserNeo4jDoc } from '../../interfaces/user-neo4j-doc.interface';

const VALID_USER_ID_1 = '656a35d3b7e7b4a9a9b6b6b6'; // Valid ObjectId string
const VALID_USER_ID_2 = '656a35d3b7e7b4a9a9b6b6b7'; // Valid ObjectId string

const createUserNeo4jDoc = (
  overrides?: Partial<UserNeo4jDoc>,
): UserNeo4jDoc => ({
  _id: VALID_USER_ID_2,
  user_id: VALID_USER_ID_2,
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

describe('UserService', () => {
  let service: UserService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;
  let mutualService: jest.Mocked<MutualService>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      findUserNode: jest.fn(),
      findUserToUserRelationship: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    mutualService = {
      getMutualFollowers: jest.fn(),
    } as unknown as jest.Mocked<MutualService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
        { provide: MutualService, useValue: mutualService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns user successfully', async () => {
      const userNode = createNodeResponse(createUserNeo4jDoc());
      neo4jInfrastructure.findUserNode.mockResolvedValue(userNode);
      service.filterUser = jest.fn().mockResolvedValue(createUserNeo4jDoc());

      const result = await service.getUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User fetched successfully');
      expect(result.data).toBeDefined();
    });

    it('returns error when user not found', async () => {
      neo4jInfrastructure.findUserNode.mockResolvedValue(null);

      const result = await service.getUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get user');
    });

    it('returns error when filterUser fails', async () => {
      const userNode = createNodeResponse(createUserNeo4jDoc());
      neo4jInfrastructure.findUserNode.mockResolvedValue(userNode);
      service.filterUser = jest.fn().mockResolvedValue(null);

      const result = await service.getUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to filter user');
    });

    it('handles errors when getting user', async () => {
      neo4jInfrastructure.findUserNode.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get user');
    });
  });

  describe('userExists', () => {
    it('returns true when user exists', async () => {
      const userNode = createNodeResponse(createUserNeo4jDoc());
      neo4jInfrastructure.findUserNode.mockResolvedValue(userNode);

      const result = await service.userExists({
        user_id: VALID_USER_ID_2,
      });

      expect(result).toBe(true);
    });

    it('returns false when user does not exist', async () => {
      neo4jInfrastructure.findUserNode.mockResolvedValue(null);

      const result = await service.userExists({
        user_id: VALID_USER_ID_2,
      });

      expect(result).toBe(false);
    });

    it('handles errors when checking if user exists', async () => {
      neo4jInfrastructure.findUserNode.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.userExists({
        user_id: VALID_USER_ID_2,
      });

      expect(result).toBe(false);
    });
  });

  describe('filterUsers', () => {
    it('filters users successfully', async () => {
      const users = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        ),
      ];
      service.filterUser = jest
        .fn()
        .mockResolvedValueOnce(createUserNeo4jDoc())
        .mockResolvedValueOnce(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        );

      const result = await service.filterUsers({
        users: users,
        from_user_id: VALID_USER_ID_1,
      });

      expect(result).toHaveLength(2);
      expect(service.filterUser).toHaveBeenCalledTimes(2);
    });

    it('filters out null users', async () => {
      const users = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createNodeResponse(
            createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
          ).properties,
        ),
      ];
      service.filterUser = jest
        .fn()
        .mockResolvedValueOnce(createUserNeo4jDoc())
        .mockResolvedValueOnce(null);

      const result = await service.filterUsers({
        users: users,
        from_user_id: VALID_USER_ID_1,
      });

      expect(result).toHaveLength(1);
    });

    it('handles errors when filtering users', async () => {
      const users = [createNodeResponse(createUserNeo4jDoc())];
      service.filterUser = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await service.filterUsers({
        users: users,
        from_user_id: VALID_USER_ID_1,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('filterFollowingUsers', () => {
    it('filters following users successfully', async () => {
      const users = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        ),
      ];
      service.filterUser = jest
        .fn()
        .mockResolvedValueOnce(createUserNeo4jDoc())
        .mockResolvedValueOnce(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        );
      service.filterFollowingUser = jest
        .fn()
        .mockResolvedValueOnce(createUserNeo4jDoc())
        .mockResolvedValueOnce(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        );

      const result = await service.filterFollowingUsers({
        users: users,
        from_user_id: VALID_USER_ID_1,
      });

      expect(result).toHaveLength(2);
    });

    it('filters out users that are already being followed', async () => {
      const users = [createNodeResponse(createUserNeo4jDoc())];
      service.filterUser = jest.fn().mockResolvedValue(createUserNeo4jDoc());
      service.filterFollowingUser = jest.fn().mockResolvedValue(null);

      const result = await service.filterFollowingUsers({
        users: users,
        from_user_id: VALID_USER_ID_1,
      });

      expect(result).toHaveLength(0);
    });

    it('handles errors when filtering following users', async () => {
      const users = [createNodeResponse(createUserNeo4jDoc())];
      service.filterUser = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await service.filterFollowingUsers({
        users: users,
        from_user_id: VALID_USER_ID_1,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('filterUser', () => {
    it('filters user with all relationship data', async () => {
      const userNode = createNodeResponse(createUserNeo4jDoc());
      neo4jInfrastructure.findUserToUserRelationship
        .mockResolvedValueOnce(true) // is_following
        .mockResolvedValueOnce(false) // is_follower
        .mockResolvedValueOnce(false) // is_blocked
        .mockResolvedValueOnce(false); // is_blocked_by
      mutualService.getMutualFollowers.mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: {
          users: [createUserNeo4jDoc()],
          meta: { total: 1 },
        },
      });

      const result = await service.filterUser({
        user: userNode,
        user_id_from: VALID_USER_ID_1,
      });

      expect(result).toBeDefined();
      expect(result?.is_following).toBe(true);
      expect(result?.is_follower).toBe(false);
      expect(result?.is_blocked).toBe(false);
      expect(result?.is_blocked_by).toBe(false);
      expect(result?.mutual_followers_number).toBe(1);
    });

    it('returns null when mutual followers fetch fails', async () => {
      const userNode = createNodeResponse(createUserNeo4jDoc());
      neo4jInfrastructure.findUserToUserRelationship
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      mutualService.getMutualFollowers.mockResolvedValue({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed',
      });

      const result = await service.filterUser({
        user: userNode,
        user_id_from: VALID_USER_ID_1,
      });

      expect(result).toBeNull();
    });

    it('handles errors when filtering user', async () => {
      const userNode = createNodeResponse(createUserNeo4jDoc());
      neo4jInfrastructure.findUserToUserRelationship.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.filterUser({
        user: userNode,
        user_id_from: VALID_USER_ID_1,
      });

      expect(result).toBeNull();
    });
  });
});
