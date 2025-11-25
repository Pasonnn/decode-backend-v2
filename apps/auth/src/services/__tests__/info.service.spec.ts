import { InfoService } from '../info.service';
import { Model } from 'mongoose';
import { DeviceFingerprint } from '../../schemas/device-fingerprint.schema';
import { UserServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { SessionService } from '../session.service';
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { Types } from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/error-messages.constants';
import { JwtPayload } from '../../interfaces/jwt-payload.interface';

const successResponse = <T>(data?: T): Response<T> => ({
  success: true,
  statusCode: 200,
  message: 'ok',
  data,
});

const failureResponse = <T = unknown>(
  message: string,
  data?: T,
): Response<T> => ({
  success: false,
  statusCode: 400,
  message,
  data,
});

describe('InfoService', () => {
  let service: InfoService;
  let deviceFingerprintModel: jest.Mocked<Model<DeviceFingerprint>>;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let sessionService: jest.Mocked<SessionService>;

  const VALID_USER_ID = '507f1f77bcf86cd799439011';
  const VALID_USER_ID_2 = '507f1f77bcf86cd799439012';

  const baseUser: UserDoc = {
    _id: VALID_USER_ID,
    email: 'user@example.com',
    username: 'user',
    password_hashed: 'hashed',
    role: 'user',
    display_name: 'User',
    bio: '',
    avatar_ipfs_hash: '',
    last_login: new Date(),
    is_active: true,
    last_account_deactivation: new Date(),
  };

  beforeEach(() => {
    deviceFingerprintModel = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Model<DeviceFingerprint>>;

    userServiceClient = {
      getInfoByEmailOrUsername: jest.fn(),
      getInfoByUserId: jest.fn(),
      checkUserExistsByEmailOrUsername: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;

    sessionService = {
      validateAccess: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    service = new InfoService(
      deviceFingerprintModel,
      userServiceClient,
      sessionService,
    );
  });

  describe('getUserInfoByEmailOrUsername', () => {
    it('returns user info when found', async () => {
      userServiceClient.getInfoByEmailOrUsername.mockResolvedValue(
        successResponse(baseUser),
      );

      const result =
        await service.getUserInfoByEmailOrUsername('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(baseUser);
      expect(userServiceClient.getInfoByEmailOrUsername).toHaveBeenCalledWith({
        email_or_username: 'user@example.com',
      });
    });

    it('returns error when user not found', async () => {
      userServiceClient.getInfoByEmailOrUsername.mockResolvedValue(
        failureResponse('not found'),
      );

      const result =
        await service.getUserInfoByEmailOrUsername('user@example.com');

      expect(result.success).toBe(false);
    });

    it('returns error when user data is null', async () => {
      userServiceClient.getInfoByEmailOrUsername.mockResolvedValue(
        successResponse(null as unknown as UserDoc),
      );

      const result =
        await service.getUserInfoByEmailOrUsername('user@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });
  });

  describe('getUserInfoByAccessToken', () => {
    it('returns user info when token is valid', async () => {
      const jwtPayload: JwtPayload = {
        user_id: 'user-1',
        session_token: 'session-1',
      };
      sessionService.validateAccess.mockResolvedValue(
        successResponse(jwtPayload),
      );
      userServiceClient.getInfoByUserId.mockResolvedValue(
        successResponse(baseUser),
      );

      const result = await service.getUserInfoByAccessToken('token-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(baseUser);
      expect(sessionService.validateAccess).toHaveBeenCalledWith('token-123');
      expect(userServiceClient.getInfoByUserId).toHaveBeenCalledWith({
        user_id: 'user-1',
      });
    });

    it('returns error when token is invalid', async () => {
      sessionService.validateAccess.mockResolvedValue(
        failureResponse('invalid token'),
      );

      const result = await service.getUserInfoByAccessToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.USER_INFO.INVALID_ACCESS_TOKEN);
    });

    it('returns error when user not found after token validation', async () => {
      const jwtPayload: JwtPayload = {
        user_id: 'user-1',
        session_token: 'session-1',
      };
      sessionService.validateAccess.mockResolvedValue(
        successResponse(jwtPayload),
      );
      userServiceClient.getInfoByUserId.mockResolvedValue(
        successResponse(null as unknown as UserDoc),
      );

      const result = await service.getUserInfoByAccessToken('token-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });
  });

  describe('getUserInfoByUserId', () => {
    it('returns user info when found', async () => {
      userServiceClient.getInfoByUserId.mockResolvedValue(
        successResponse(baseUser),
      );

      const result = await service.getUserInfoByUserId('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(baseUser);
      expect(userServiceClient.getInfoByUserId).toHaveBeenCalledWith({
        user_id: 'user-1',
      });
    });

    it('returns error when user service fails', async () => {
      userServiceClient.getInfoByUserId.mockResolvedValue(
        failureResponse('service error'),
      );

      const result = await service.getUserInfoByUserId('user-1');

      expect(result.success).toBe(false);
    });

    it('returns error when user data is null', async () => {
      userServiceClient.getInfoByUserId.mockResolvedValue(
        successResponse(null as unknown as UserDoc),
      );

      const result = await service.getUserInfoByUserId('user-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });
  });

  describe('getUserInfoByFingerprintHashed', () => {
    it('returns users associated with fingerprint', async () => {
      const fingerprints = [
        {
          user_id: new Types.ObjectId(VALID_USER_ID),
          fingerprint_hashed: 'hash',
        },
        {
          user_id: new Types.ObjectId(VALID_USER_ID_2),
          fingerprint_hashed: 'hash',
        },
      ];
      (deviceFingerprintModel.find as jest.Mock).mockResolvedValue(
        fingerprints,
      );

      const user2: UserDoc = {
        ...baseUser,
        _id: VALID_USER_ID_2,
        email: 'user2@example.com',
      };

      userServiceClient.getInfoByUserId
        .mockResolvedValueOnce(successResponse(baseUser))
        .mockResolvedValueOnce(successResponse(user2));

      const result = await service.getUserInfoByFingerprintHashed('hash');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('returns error when no fingerprints found', async () => {
      (deviceFingerprintModel.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserInfoByFingerprintHashed('hash');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });

    it('returns error when no users found for fingerprints', async () => {
      const fingerprints = [
        {
          user_id: new Types.ObjectId(VALID_USER_ID),
          fingerprint_hashed: 'hash',
        },
      ];
      (deviceFingerprintModel.find as jest.Mock).mockResolvedValue(
        fingerprints,
      );
      userServiceClient.getInfoByUserId.mockResolvedValue(
        failureResponse('not found'),
      );

      const result = await service.getUserInfoByFingerprintHashed('hash');

      expect(result.success).toBe(false);
    });
  });

  describe('existUserByEmailOrUsername', () => {
    it('returns success when user exists', async () => {
      userServiceClient.checkUserExistsByEmailOrUsername.mockResolvedValue(
        successResponse(true),
      );

      const result = await service.existUserByEmailOrUsername({
        email_or_username: 'user@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.USER_FOUND);
    });

    it('returns error when user service fails', async () => {
      userServiceClient.checkUserExistsByEmailOrUsername.mockResolvedValue(
        failureResponse('service error'),
      );

      const result = await service.existUserByEmailOrUsername({
        email_or_username: 'user@example.com',
      });

      expect(result.success).toBe(false);
    });

    it('returns error when user does not exist', async () => {
      userServiceClient.checkUserExistsByEmailOrUsername.mockResolvedValue(
        successResponse(null),
      );

      const result = await service.existUserByEmailOrUsername({
        email_or_username: 'user@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.USER_INFO.USER_NOT_FOUND);
    });
  });
});
