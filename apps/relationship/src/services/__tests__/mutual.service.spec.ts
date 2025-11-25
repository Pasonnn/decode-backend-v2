import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { MutualService } from '../mutual.service';
import { Neo4jInfrastructure } from '../../infrastructure/neo4j.infrastructure';
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

describe('MutualService', () => {
  let service: MutualService;
  let neo4jInfrastructure: jest.Mocked<Neo4jInfrastructure>;

  beforeEach(async () => {
    neo4jInfrastructure = {
      getMutualFollowers: jest.fn(),
    } as unknown as jest.Mocked<Neo4jInfrastructure>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MutualService,
        { provide: Neo4jInfrastructure, useValue: neo4jInfrastructure },
      ],
    }).compile();

    service = module.get<MutualService>(MutualService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMutualFollowers', () => {
    it('returns mutual followers successfully', async () => {
      const mutualFollowers = [
        createNodeResponse(createUserNeo4jDoc()),
        createNodeResponse(
          createUserNeo4jDoc({ user_id: '656a35d3b7e7b4a9a9b6b6b8' }),
        ),
      ];
      neo4jInfrastructure.getMutualFollowers.mockResolvedValue(mutualFollowers);

      const result = await service.getMutualFollowers({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Mutual followers fetched successfully');
      expect(result.data?.users).toHaveLength(2);
      expect(result.data?.meta.total).toBe(2);
    });

    it('returns empty array when no mutual followers', async () => {
      neo4jInfrastructure.getMutualFollowers.mockResolvedValue([]);

      const result = await service.getMutualFollowers({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data?.users).toHaveLength(0);
      expect(result.data?.meta.total).toBe(0);
    });

    it('handles errors when getting mutual followers', async () => {
      neo4jInfrastructure.getMutualFollowers.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getMutualFollowers({
        user_id_from: VALID_USER_ID_1,
        user_id_to: VALID_USER_ID_2,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('Failed to get mutual followers');
    });
  });
});
