import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpStatus } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { FollowerSnapshotService } from '../follower-snapshot.service';
import { FollowerSnapshot } from '../../schema/follower-snapshot.schema';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
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

const createFollowerSnapshot = (overrides?: Partial<FollowerSnapshot>) => ({
  _id: new Types.ObjectId(),
  user_id: new Types.ObjectId(VALID_USER_ID),
  followers: [new Types.ObjectId('656a35d3b7e7b4a9a9b6b6b7')],
  followers_number: 1,
  snapshot_at: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('FollowerSnapshotService', () => {
  let service: FollowerSnapshotService;
  let followerSnapshotRepository: jest.Mocked<Model<FollowerSnapshot>>;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;

  beforeEach(async () => {
    followerSnapshotRepository = {
      find: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Model<FollowerSnapshot>>;

    neo4jInfrastructure = {
      getAllUsers: jest.fn(),
      getAllFollowers: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowerSnapshotService,
        {
          provide: getModelToken(FollowerSnapshot.name),
          useValue: followerSnapshotRepository,
        },
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
      ],
    }).compile();

    service = module.get<FollowerSnapshotService>(FollowerSnapshotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFollowersSnapshotDataLastMonth', () => {
    it('returns follower snapshots successfully', async () => {
      const snapshots = [
        createFollowerSnapshot(),
        createFollowerSnapshot({
          _id: new Types.ObjectId(),
          followers_number: 2,
        }),
      ];
      (followerSnapshotRepository.find as jest.Mock).mockResolvedValue(
        snapshots,
      );

      const result = await service.getFollowersSnapshotDataLastMonth({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toHaveLength(2);
    });

    it('returns empty array when no snapshots found', async () => {
      (followerSnapshotRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getFollowersSnapshotDataLastMonth({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toHaveLength(0);
    });

    it('handles errors when getting snapshots', async () => {
      (followerSnapshotRepository.find as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getFollowersSnapshotDataLastMonth({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe(
        'Failed to get followers snapshot data last month',
      );
    });
  });

  describe('triggerManualSnapshot', () => {
    it('triggers manual snapshot successfully', async () => {
      const users = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.getAllUsers.mockResolvedValue(users);
      neo4jInfrastructure.getAllFollowers
        .mockResolvedValueOnce([
          createNodeResponse(createUserNeo4jDoc({ user_id: 'follower1' })),
        ])
        .mockResolvedValueOnce([
          createNodeResponse(createUserNeo4jDoc({ user_id: 'follower2' })),
        ]);
      (followerSnapshotRepository.create as jest.Mock)
        .mockResolvedValueOnce(createFollowerSnapshot())
        .mockResolvedValueOnce(createFollowerSnapshot());

      const result = await service.triggerManualSnapshot();

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Manual follower snapshot completed successfully',
      );
      expect(neo4jInfrastructure.getAllUsers).toHaveBeenCalled();
      expect(followerSnapshotRepository.create).toHaveBeenCalledTimes(2);
    });

    it('handles errors during manual snapshot', async () => {
      // Mock snapshotAllNodesFollowers to throw an error
      // This simulates an error that occurs outside the try-catch in snapshotAllNodesFollowers
      jest
        .spyOn(service as any, 'snapshotAllNodesFollowers')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.triggerManualSnapshot();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Manual follower snapshot failed');
    });

    it('handles partial failures during snapshot', async () => {
      const users = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b7' }),
        ),
      ];
      neo4jInfrastructure.getAllUsers.mockResolvedValue(users);
      neo4jInfrastructure.getAllFollowers
        .mockResolvedValueOnce([
          createNodeResponse(createUserNeo4jDoc({ user_id: 'follower1' })),
        ])
        .mockRejectedValueOnce(new Error('Failed to get followers'));
      (followerSnapshotRepository.create as jest.Mock).mockResolvedValueOnce(
        createFollowerSnapshot(),
      );

      const result = await service.triggerManualSnapshot();

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Manual follower snapshot completed successfully',
      );
    });
  });
});
