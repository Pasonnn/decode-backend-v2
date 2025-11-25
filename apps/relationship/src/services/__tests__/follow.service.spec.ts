import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { FollowService } from '../follow.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
import { BlockService } from '../block.service';
import { UserService } from '../user.service';
import { MetricsService } from '../../common/datadog/metrics.service';
import { ClientProxy } from '@nestjs/microservices';
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

describe('FollowService', () => {
  let service: FollowService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;
  let blockService: jest.Mocked<BlockService>;
  let userService: jest.Mocked<UserService>;
  let notificationService: jest.Mocked<ClientProxy>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      findUserToUserRelationship: jest.fn(),
      createUserToUserFollowingRelationship: jest.fn(),
      deleteUserToUserFollowingRelationship: jest.fn(),
      findUserFromRelationshipPaginated: jest.fn(),
      findUserToRelationshipPaginated: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    blockService = {
      checkIfUserBlocked: jest.fn(),
    } as unknown as jest.Mocked<BlockService>;

    userService = {
      userExists: jest.fn(),
      getUser: jest.fn(),
      filterUsers: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    notificationService = {
      emit: jest.fn().mockReturnThis(),
      toPromise: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ClientProxy>;

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
        FollowService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
        { provide: BlockService, useValue: blockService },
        { provide: UserService, useValue: userService },
        { provide: 'NOTIFICATION_SERVICE', useValue: notificationService },
        { provide: MetricsService, useValue: metricsService },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('followingUser', () => {
    it('follows user successfully and sends notification', async () => {
      userService.userExists.mockResolvedValue(true);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(false);
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      neo4jInfrastructure.createUserToUserFollowingRelationship.mockResolvedValue(
        true,
      );
      userService.getUser.mockResolvedValue({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'User found',
        data: createUserNeo4jDoc({ username: 'follower' }),
      });
      notificationService.emit.mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User followed successfully');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.follow',
        1,
        {
          operation: 'followingUser',
          status: 'success',
        },
      );
      expect(notificationService.emit).toHaveBeenCalledWith(
        'create_notification',
        expect.objectContaining({
          user_id: VALID_USER_ID_2,
          type: 'new_follow',
        }),
      );
    });

    it('returns error when following yourself', async () => {
      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_1,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('You cannot follow yourself');
    });

    it('returns error when user does not exist', async () => {
      userService.userExists.mockResolvedValue(false);

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('User not found');
    });

    it('returns error when already following user', async () => {
      userService.userExists.mockResolvedValue(true);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(true);

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('You are already following this user');
    });

    it('returns error when user is blocked', async () => {
      userService.userExists.mockResolvedValue(true);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(false);
      blockService.checkIfUserBlocked.mockResolvedValue(true);

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('This user is limited to you');
    });

    it('returns error when relationship creation fails', async () => {
      userService.userExists.mockResolvedValue(true);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(false);
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      neo4jInfrastructure.createUserToUserFollowingRelationship.mockResolvedValue(
        false,
      );

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to following user');
    });

    it('returns error when getting user for notification fails', async () => {
      userService.userExists.mockResolvedValue(true);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(false);
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      neo4jInfrastructure.createUserToUserFollowingRelationship.mockResolvedValue(
        true,
      );
      userService.getUser.mockResolvedValue({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'User not found',
      });

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get user from to follow');
    });

    it('handles errors during following', async () => {
      userService.userExists.mockRejectedValue(new Error('Database error'));

      const result = await service.followingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to following user');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.follow',
        1,
        {
          operation: 'followingUser',
          status: 'failed',
        },
      );
    });
  });

  describe('unfollowingUser', () => {
    it('unfollows user successfully', async () => {
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(true);
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      neo4jInfrastructure.deleteUserToUserFollowingRelationship.mockResolvedValue(
        true,
      );

      const result = await service.unfollowingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User unfollowed successfully');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.unfollow',
        1,
        {
          operation: 'unfollowingUser',
          status: 'success',
        },
      );
    });

    it('returns error when unfollowing yourself', async () => {
      const result = await service.unfollowingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_1,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('You cannot unfollow yourself');
    });

    it('returns error when not following user', async () => {
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(false);

      const result = await service.unfollowingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('You are not following this user');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.unfollow',
        1,
        {
          operation: 'unfollowingUser',
          status: 'not_following',
        },
      );
    });

    it('returns error when user is blocked', async () => {
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(true);
      blockService.checkIfUserBlocked.mockResolvedValue(true);

      const result = await service.unfollowingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('This user is limited to you');
    });

    it('returns error when relationship deletion fails', async () => {
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(true);
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      neo4jInfrastructure.deleteUserToUserFollowingRelationship.mockResolvedValue(
        false,
      );

      const result = await service.unfollowingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to unfollowing user');
      expect(metricsService.increment).toHaveBeenCalledWith(
        'relationship.unfollow',
        1,
        {
          operation: 'unfollowingUser',
          status: 'failed',
        },
      );
    });

    it('handles errors during unfollowing', async () => {
      service.checkIfUserFollowing = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await service.unfollowingUser({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to unfollowing user');
    });
  });

  describe('removeFollower', () => {
    it('removes follower successfully', async () => {
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(true);
      neo4jInfrastructure.deleteUserToUserFollowingRelationship.mockResolvedValue(
        true,
      );

      const result = await service.removeFollower({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Follower removed successfully');
    });

    it('returns error when removing yourself', async () => {
      const result = await service.removeFollower({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_1,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('You cannot remove yourself');
    });

    it('returns error when user is blocked', async () => {
      blockService.checkIfUserBlocked.mockResolvedValue(true);

      const result = await service.removeFollower({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('User blocked');
    });

    it('returns error when user is not following you', async () => {
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(false);

      const result = await service.removeFollower({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(result.message).toBe('User is not following you');
    });

    it('returns error when relationship deletion fails', async () => {
      blockService.checkIfUserBlocked.mockResolvedValue(false);
      service.checkIfUserFollowing = jest.fn().mockResolvedValue(true);
      neo4jInfrastructure.deleteUserToUserFollowingRelationship.mockResolvedValue(
        false,
      );

      const result = await service.removeFollower({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to remove follower');
    });

    it('handles errors during removing follower', async () => {
      blockService.checkIfUserBlocked.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.removeFollower({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to remove follower');
    });
  });

  describe('getFollowing', () => {
    it('returns following users successfully', async () => {
      const followingUsers = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        ),
      ];
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockResolvedValue(
        followingUsers,
      );
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
      ]);

      const result = await service.getFollowing({
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
      const followingUsers = [createNodeResponse(createUserNeo4jDoc())];
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockResolvedValue(
        followingUsers,
      );
      userService.filterUsers.mockResolvedValue([createUserNeo4jDoc()]);

      const result = await service.getFollowing({
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

      const result = await service.getFollowing({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get following users');
    });

    it('handles errors when getting following users', async () => {
      neo4jInfrastructure.findUserFromRelationshipPaginated.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getFollowing({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get following users');
    });
  });

  describe('getFollowers', () => {
    it('returns followers successfully', async () => {
      const followers = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        ),
      ];
      neo4jInfrastructure.findUserToRelationshipPaginated.mockResolvedValue(
        followers,
      );
      userService.filterUsers.mockResolvedValue([
        createUserNeo4jDoc(),
        createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
      ]);

      const result = await service.getFollowers({
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
      const followers = [createNodeResponse(createUserNeo4jDoc())];
      neo4jInfrastructure.findUserToRelationshipPaginated.mockResolvedValue(
        followers,
      );
      userService.filterUsers.mockResolvedValue([createUserNeo4jDoc()]);

      const result = await service.getFollowers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.meta.is_last_page).toBe(true);
    });

    it('returns error when Neo4j query fails', async () => {
      neo4jInfrastructure.findUserToRelationshipPaginated.mockResolvedValue(
        null,
      );

      const result = await service.getFollowers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get followers');
    });

    it('handles errors when getting followers', async () => {
      neo4jInfrastructure.findUserToRelationshipPaginated.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getFollowers({
        user_id: VALID_USER_ID_1,
        page: 0,
        limit: 10,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get followers');
    });
  });

  describe('checkIfUserFollowing', () => {
    it('returns true when user is following', async () => {
      neo4jInfrastructure.findUserToUserRelationship.mockResolvedValue(true);

      const result = await service.checkIfUserFollowing({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(true);
    });

    it('returns false when user is not following', async () => {
      neo4jInfrastructure.findUserToUserRelationship.mockResolvedValue(false);

      const result = await service.checkIfUserFollowing({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(false);
    });

    it('handles errors when checking if user following', async () => {
      neo4jInfrastructure.findUserToUserRelationship.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.checkIfUserFollowing({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result).toBe(false);
    });
  });
});
