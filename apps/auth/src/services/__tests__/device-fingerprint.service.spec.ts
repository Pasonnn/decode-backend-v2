import { DeviceFingerprintService } from '../device-fingerprint.service';
import { Model } from 'mongoose';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { InfoService } from '../info.service';
import { SessionService } from '../session.service';
import { UserServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { TwoFactorAuthService } from '../two-factor-auth.service';
import { ClientProxy } from '@nestjs/microservices';
import { DeviceFingerprint } from '../../schemas/device-fingerprint.schema';
import { Response } from '../../interfaces/response.interface';
import { DeviceFingerprintDoc } from '../../interfaces/device-fingerprint-doc.interface';
import { SessionDoc } from '../../interfaces/session-doc.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { Types } from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/error-messages.constants';

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

describe('DeviceFingerprintService', () => {
  let service: DeviceFingerprintService;
  let deviceFingerprintModel: jest.Mocked<Model<DeviceFingerprint>>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let infoService: jest.Mocked<InfoService>;
  let sessionService: jest.Mocked<SessionService>;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let emailService: jest.Mocked<ClientProxy>;
  let twoFactorAuthService: jest.Mocked<TwoFactorAuthService>;

  const VALID_USER_ID = '507f1f77bcf86cd799439011';
  const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';

  const createDeviceFingerprint = (
    overrides: Partial<DeviceFingerprintDoc> = {},
  ): DeviceFingerprintDoc => ({
    _id: VALID_FINGERPRINT_ID,
    user_id: new Types.ObjectId(VALID_USER_ID),
    fingerprint_hashed: 'fingerprint-hash',
    is_trusted: true,
    device: 'Mac',
    browser: 'Chrome',
    ...overrides,
  });

  const baseUser: UserDoc = {
    _id: 'user-1',
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
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    } as unknown as jest.Mocked<Model<DeviceFingerprint>>;

    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    infoService = {
      getUserInfoByEmailOrUsername: jest.fn(),
    } as unknown as jest.Mocked<InfoService>;

    sessionService = {
      getUserActiveSessions: jest.fn(),
      revokeSessionByDeviceFingerprintId: jest.fn(),
      createSession: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    userServiceClient = {
      getInfoByUserId: jest.fn(),
      updateUserLastLogin: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;

    emailService = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    twoFactorAuthService = {
      checkAndInitOtpLoginSession: jest.fn(),
      checkAndInitOtpVerifyDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<TwoFactorAuthService>;

    service = new DeviceFingerprintService(
      deviceFingerprintModel,
      redisInfrastructure,
      infoService,
      sessionService,
      userServiceClient,
      emailService,
      twoFactorAuthService,
    );
  });

  describe('getDeviceFingerprints', () => {
    it('returns device fingerprints with sessions', async () => {
      const fingerprints = [
        {
          toObject: () => createDeviceFingerprint({ _id: 'finger-1' }),
        },
      ];
      (deviceFingerprintModel.find as jest.Mock).mockResolvedValue(
        fingerprints,
      );

      const sessions: SessionDoc[] = [
        {
          _id: '507f1f77bcf86cd799439013',
          user_id: new Types.ObjectId(VALID_USER_ID),
          device_fingerprint_id: new Types.ObjectId(VALID_FINGERPRINT_ID),
          session_token: 'token-1',
          access_token: 'access-1',
          expires_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          revoked_at: new Date(),
        },
      ];
      sessionService.getUserActiveSessions.mockResolvedValue(
        successResponse(sessions),
      );

      const result = await service.getDeviceFingerprints({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(deviceFingerprintModel.find).toHaveBeenCalled();
    });

    it('returns error when fingerprints not found', async () => {
      (deviceFingerprintModel.find as jest.Mock).mockResolvedValue(null);

      const result = await service.getDeviceFingerprints({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND);
    });

    it('returns error when sessions fetch fails', async () => {
      const fingerprints = [
        {
          toObject: () => createDeviceFingerprint(),
        },
      ];
      (deviceFingerprintModel.find as jest.Mock).mockResolvedValue(
        fingerprints,
      );
      sessionService.getUserActiveSessions.mockResolvedValue(
        failureResponse('sessions error'),
      );

      const result = await service.getDeviceFingerprints({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getDeviceFingerprint', () => {
    it('returns device fingerprint when found', async () => {
      const fingerprint = createDeviceFingerprint();
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(
        fingerprint,
      );

      const result = await service.getDeviceFingerprint({
        fingerprint_hashed: 'hash',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(fingerprint);
    });

    it('returns error when fingerprint not found', async () => {
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getDeviceFingerprint({
        fingerprint_hashed: 'hash',
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND);
    });
  });

  describe('revokeDeviceFingerprint', () => {
    it('revokes device fingerprint and sessions', async () => {
      const fingerprint = createDeviceFingerprint();
      // Ensure _id is properly set
      fingerprint._id = VALID_FINGERPRINT_ID;
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(
        fingerprint,
      );
      (deviceFingerprintModel.updateOne as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });
      sessionService.revokeSessionByDeviceFingerprintId.mockResolvedValue(
        successResponse(),
      );

      const result = await service.revokeDeviceFingerprint({
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(true);
      expect(deviceFingerprintModel.updateOne).toHaveBeenCalled();
      expect(
        sessionService.revokeSessionByDeviceFingerprintId,
      ).toHaveBeenCalledWith(VALID_FINGERPRINT_ID);
    });

    it('returns error when fingerprint not found', async () => {
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.revokeDeviceFingerprint({
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('checkDeviceFingerprint', () => {
    it('returns fingerprint when trusted', async () => {
      const fingerprint = createDeviceFingerprint({ is_trusted: true });
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(
        fingerprint,
      );

      const result = await service.checkDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(fingerprint);
    });

    it('returns error when fingerprint not trusted', async () => {
      const fingerprint = createDeviceFingerprint({ is_trusted: false });
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(
        fingerprint,
      );

      const result = await service.checkDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(false);
    });

    it('returns error when fingerprint not found', async () => {
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.checkDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('createDeviceFingerprint', () => {
    it('creates new device fingerprint', async () => {
      const fingerprint = createDeviceFingerprint();
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(null);
      (deviceFingerprintModel.create as jest.Mock).mockResolvedValue(
        fingerprint,
      );

      const result = await service.createDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(deviceFingerprintModel.create).toHaveBeenCalled();
    });

    it('returns existing fingerprint if already exists', async () => {
      const fingerprint = createDeviceFingerprint();
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(
        fingerprint,
      );

      const result = await service.createDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(deviceFingerprintModel.create).not.toHaveBeenCalled();
    });
  });

  describe('createTrustedDeviceFingerprint', () => {
    it('creates new trusted fingerprint', async () => {
      const fingerprint = createDeviceFingerprint({ is_trusted: true });
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(null);
      (deviceFingerprintModel.create as jest.Mock).mockResolvedValue(
        fingerprint,
      );
      // Mock toObject for the created fingerprint
      Object.defineProperty(fingerprint, 'toObject', {
        value: () => fingerprint,
        writable: true,
      });

      const result = await service.createTrustedDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(result.data?.is_trusted).toBe(true);
    });

    it('updates existing untrusted fingerprint to trusted', async () => {
      const existingFingerprint = createDeviceFingerprint({
        is_trusted: false,
      });
      existingFingerprint.is_trusted = true;
      existingFingerprint.save = jest
        .fn()
        .mockResolvedValue(existingFingerprint);
      (deviceFingerprintModel.findOne as jest.Mock)
        .mockResolvedValueOnce(existingFingerprint)
        .mockResolvedValueOnce(existingFingerprint);
      // Mock toObject
      Object.defineProperty(existingFingerprint, 'toObject', {
        value: () => existingFingerprint,
        writable: true,
      });

      const result = await service.createTrustedDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(existingFingerprint.save).toHaveBeenCalled();
    });
  });

  describe('sendDeviceFingerprintEmailVerification', () => {
    it('sends email verification for device fingerprint', async () => {
      const fingerprint = createDeviceFingerprint();
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(
        fingerprint,
      );
      userServiceClient.getInfoByUserId.mockResolvedValue(
        successResponse(baseUser),
      );
      redisInfrastructure.set.mockResolvedValue(undefined);
      emailService.emit.mockReturnValue(undefined);

      const result = await service.sendDeviceFingerprintEmailVerification({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(true);
      expect(redisInfrastructure.set).toHaveBeenCalled();
      expect(emailService.emit).toHaveBeenCalled();
    });

    it('returns error when fingerprint not found', async () => {
      (deviceFingerprintModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.sendDeviceFingerprintEmailVerification({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('verifyDeviceFingerprintEmailVerification', () => {
    it('verifies email code and trusts device', async () => {
      const verificationData = {
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      };
      redisInfrastructure.get.mockResolvedValue(verificationData);

      // Mock trustDeviceFingerprint - it calls findOne multiple times
      const untrustedFingerprint = createDeviceFingerprint({
        is_trusted: false,
      });
      untrustedFingerprint.is_trusted = true;
      untrustedFingerprint.save = jest
        .fn()
        .mockResolvedValue(untrustedFingerprint);
      const trustedFingerprint = createDeviceFingerprint({
        is_trusted: true,
      });
      // trustDeviceFingerprint calls findOne 2 times: first to find untrusted, then to find trusted
      (deviceFingerprintModel.findOne as jest.Mock)
        .mockResolvedValueOnce(untrustedFingerprint) // First find in trustDeviceFingerprint (untrusted)
        .mockResolvedValueOnce(trustedFingerprint); // Final find to return trusted fingerprint
      Object.defineProperty(untrustedFingerprint, 'toObject', {
        value: () => untrustedFingerprint,
        writable: true,
      });
      Object.defineProperty(trustedFingerprint, 'toObject', {
        value: () => trustedFingerprint,
        writable: true,
      });

      // Mock session creation
      const session = {
        _id: '507f1f77bcf86cd799439013',
        user_id: new Types.ObjectId(VALID_USER_ID),
        device_fingerprint_id: new Types.ObjectId(VALID_FINGERPRINT_ID),
        session_token: 'token-1',
        access_token: 'access-1',
        expires_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        revoked_at: new Date(),
      };
      sessionService.createSession.mockResolvedValue(successResponse(session));
      twoFactorAuthService.checkAndInitOtpLoginSession.mockResolvedValue(
        failureResponse('otp not enabled'),
      );
      userServiceClient.updateUserLastLogin.mockResolvedValue(
        successResponse(),
      );

      const result = await service.verifyDeviceFingerprintEmailVerification({
        email_verification_code: 'code123',
        app: 'decode',
      });

      expect(result.success).toBe(true);
    });

    it('returns error when verification code invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.verifyDeviceFingerprintEmailVerification({
        email_verification_code: 'invalid',
        app: 'decode',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.EMAIL_VERIFICATION.INVALID_CODE);
    });
  });

  describe('trustDeviceFingerprint', () => {
    it('trusts device fingerprint by fingerprint hash', async () => {
      const fingerprint = createDeviceFingerprint({ is_trusted: false });
      fingerprint.is_trusted = true;
      fingerprint.save = jest.fn().mockResolvedValue(fingerprint);
      (deviceFingerprintModel.findOne as jest.Mock)
        .mockResolvedValueOnce(fingerprint)
        .mockResolvedValueOnce(fingerprint);
      // Mock toObject
      Object.defineProperty(fingerprint, 'toObject', {
        value: () => fingerprint,
        writable: true,
      });

      const result = await service.trustDeviceFingerprint({
        user_id: VALID_USER_ID,
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(true);
      expect(fingerprint.save).toHaveBeenCalled();
    });

    it('trusts device fingerprint by device fingerprint id', async () => {
      const fingerprint = createDeviceFingerprint({ is_trusted: false });
      fingerprint.is_trusted = true;
      fingerprint.save = jest.fn().mockResolvedValue(fingerprint);
      (deviceFingerprintModel.findOne as jest.Mock)
        .mockResolvedValueOnce(fingerprint)
        .mockResolvedValueOnce(fingerprint);
      // Mock toObject
      Object.defineProperty(fingerprint, 'toObject', {
        value: () => fingerprint,
        writable: true,
      });

      const result = await service.trustDeviceFingerprint({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
      });

      expect(result.success).toBe(true);
    });

    it('returns error when neither hash nor id provided', async () => {
      const result = await service.trustDeviceFingerprint({
        user_id: VALID_USER_ID,
      });

      expect(result.success).toBe(false);
    });
  });
});
