import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { BlockService } from '../block.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
import { FollowService } from '../follow.service';
import { UserService } from '../user.service';
import { MetricsService } from '../../common/datadog/metrics.service';
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

describe('BlockService', () => {
  let service: BlockService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;
  let followService: jest.Mocked<FollowService>;
  let userService: jest.Mocked<UserService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      findUserToUserRelationship: jest.fn(),
      createUserToUserBlockedRelationship: jest.fn(),
      deleteUserToUserBlockedRelationship: jest.fn(),
      findUserFromRelationshipPaginated: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    followService = {
      checkIfUserFollowing: jest.fn(),
      unfollowingUser: jest.fn(),
      removeFollower: jest.fn(),
    } as unknown as jest.Mocked<FollowService>;

    userService = {
      userExists: jest.fn(),
      filterUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    metricsService = {
      increment: jest.fn(),
      decrement: jest.fn(),
      gauge: jest.fn(),
      histogram: jest.fn(),
      timing: jest.fn(),
      distribution: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
        { provide: FollowService, useValue: followService },
        { provide: UserService, useValue: userService },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    it('blocks user successfully', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(false);
      userService.userExists.mockResolvedValue(true);
      followService.checkIfUserFollowing
        .mockResolvedValueOnce(false) // Not following user_to
        .mockResolvedValueOnce(false); // user_to not following you
      neo4jInfrastructure.createUserToUserBlockedRelationship.mockResolvedValue(
        true,
      );

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User blocked successfully');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.block',
        1,
        {
          operation: 'blockUser',
          status: 'success',
        },
      );
    });

    it('returns error when blocking yourself', async () => {
      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_1,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('You cannot block yourself');
    });

    it('returns error when user already blocked', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(true);

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('User already blocked');
    });

    it('returns error when user does not exist', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(false);
      userService.userExists.mockResolvedValue(false);

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('User not found');
    });

    it('unfollows user when blocking someone you follow', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(false);
      userService.userExists.mockResolvedValue(true);
      followService.checkIfUserFollowing
        .mockResolvedValueOnce(true) // Following user_to
        .mockResolvedValueOnce(false); // user_to not following you
      followService.unfollowingUser.mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Unfollowed',
      });
      neo4jInfrastructure.createUserToUserBlockedRelationship.mockResolvedValue(
        true,
      );

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(followService.unfollowingUser).toHaveBeenCalledWith({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });
    });

    it('removes follower when blocking someone who follows you', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(false);
      userService.userExists.mockResolvedValue(true);
      followService.checkIfUserFollowing
        .mockResolvedValueOnce(false) // Not following user_to
        .mockResolvedValueOnce(true); // user_to following you
      followService.removeFollower.mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Removed',
      });
      neo4jInfrastructure.createUserToUserBlockedRelationship.mockResolvedValue(
        true,
      );

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(followService.removeFollower).toHaveBeenCalledWith({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });
    });

    it('returns error when block relationship creation fails', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(false);
      userService.userExists.mockResolvedValue(true);
      followService.checkIfUserFollowing
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      neo4jInfrastructure.createUserToUserBlockedRelationship.mockResolvedValue(
        false,
      );

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to block user');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.block',
        1,
        {
          operation: 'blockUser',
          status: 'failed',
        },
      );
    });

    it('handles errors during blocking', async () => {
      service.checkIfUserBlocked = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await service.blockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to block user');
    });
  });

  describe('unblockUser', () => {
    it('unblocks user successfully', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(true);
      neo4jInfrastructure.deleteUserToUserBlockedRelationship.mockResolvedValue(
        true,
      );

      const result = await service.unblockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User unblocked successfully');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.unblock',
        1,
        {
          operation: 'unblockUser',
          status: 'success',
        },
      );
    });

    it('returns error when user not blocked', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(false);

      const result = await service.unblockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('User not blocked');
    });

    it('returns error when unblock relationship deletion fails', async () => {
      service.checkIfUserBlocked = jest.fn().mockResolvedValue(true);
      neo4jInfrastructure.deleteUserToUserBlockedRelationship.mockResolvedValue(
        false,
      );

      const result = await service.unblockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to unblock user');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.unblock',
        1,
        {
          operation: 'unblockUser',
          status: 'failed',
        },
      );
    });

    it('handles errors during unblocking', async () => {
      service.checkIfUserBlocked = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await service.unblockUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to unblock user');
    });
  });

  describe('getBlockedUsers', () => {
    it('returns blocked users successfully', async () => {
      const blockedUsers = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        ),
      ];
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockResolvedValue(
        blockedUsers,
      );
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
      ]);

      const result = await service.getBlockedUsers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data?.users).toHaveLength(2);
      expect(result.data?.meta.page).toBe(0);
      expect(result.data?.meta.limit).toBe(10);
    });

    it('sets is_last_page when results are less than limit', async () => {
      const blockedUsers = [createNodeResponse(createUserNeo4jDoc())];
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockResolvedValue(
        blockedUsers,
      );
      userService.filterUsers.mockResolvedValue([createUserNeo4jDoc()]);

      const result = await service.getBlockedUsers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.meta.is_last_page).toBe(true);
    });

    it('returns error when Neo4j query fails', async () => {
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockResolvedValue(
        null,
      );

      const result = await service.getBlockedUsers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get blocked users');
    });

    it('handles errors when getting blocked users', async () => {
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getBlockedUsers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get blocked users');
    });
  });

  describe('checkIfUserBlocked', () => {
    it('returns true when user is blocked by you', async () => {
      neo4jInfrastructure.findUserToUserRelationship
        .mockResolvedValueOnce(true) // You blocked them
        .mockResolvedValueOnce(false); // They didn't block you

      const result = await service.checkIfUserBlocked({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(true);
    });

    it('returns true when user blocked you', async () => {
      neo4jInfrastructure.findUserToUserRelationship
        .mockResolvedValueOnce(false) // You didn't block them
        .mockResolvedValueOnce(true); // They blocked you

      const result = await service.checkIfUserBlocked({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(true);
    });

    it('returns false when neither user blocked the other', async () => {
      neo4jInfrastructure.findUserToUserRelationship
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const result = await service.checkIfUserBlocked({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(false);
    });

    it('handles errors when checking if user blocked', async () => {
      neo4jInfrastructure.findUserToUserRelationship.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.checkIfUserBlocked({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(false);
    });
  });
});
