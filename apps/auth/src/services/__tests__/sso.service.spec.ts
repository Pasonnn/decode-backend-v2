import { SsoService } from '../sso.service';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { DeviceFingerprintService } from '../device-fingerprint.service';
import { SessionService } from '../session.service';
import { Response } from '../../interfaces/response.interface';
import { DeviceFingerprintDoc } from '../../interfaces/device-fingerprint-doc.interface';
import { SessionDoc } from '../../interfaces/session-doc.interface';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/error-messages.constants';
import { Types } from 'mongoose';

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

describe('SsoService', () => {
  let service: SsoService;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;
  let sessionService: jest.Mocked<SessionService>;

  const VALID_USER_ID = '507f1f77bcf86cd799439011';
  const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';

  const createDeviceFingerprint = (): DeviceFingerprintDoc => ({
    _id: VALID_FINGERPRINT_ID,
    user_id: new Types.ObjectId(VALID_USER_ID),
    fingerprint_hashed: 'hash',
    is_trusted: true,
    device: 'Mac',
    browser: 'Chrome',
  });

  const createSession = (): SessionDoc => ({
    _id: 'session-1',
    user_id: new Types.ObjectId(),
    device_fingerprint_id: new Types.ObjectId(),
    session_token: 'token-1',
    access_token: 'access-1',
    expires_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    revoked_at: new Date(),
  });

  beforeEach(() => {
    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    deviceFingerprintService = {
      getDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<DeviceFingerprintService>;

    sessionService = {
      createSession: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    service = new SsoService(
      redisInfrastructure,
      deviceFingerprintService,
      sessionService,
    );
  });

  describe('createSsoToken', () => {
    it('creates SSO token successfully', async () => {
      const fingerprint = createDeviceFingerprint();
      deviceFingerprintService.getDeviceFingerprint.mockResolvedValue(
        successResponse(fingerprint),
      );
      redisInfrastructure.set.mockResolvedValue(undefined);

      const result = await service.createSsoToken({
        user_id: VALID_USER_ID,
        app: 'decode',
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
      expect(redisInfrastructure.set).toHaveBeenCalled();
    });

    it('returns error when device fingerprint not found', async () => {
      deviceFingerprintService.getDeviceFingerprint.mockResolvedValue(
        failureResponse('fingerprint not found'),
      );

      const result = await service.createSsoToken({
        user_id: VALID_USER_ID,
        app: 'decode',
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(false);
    });

    it('handles errors during token creation', async () => {
      deviceFingerprintService.getDeviceFingerprint.mockRejectedValue(
        new Error('database error'),
      );

      const result = await service.createSsoToken({
        user_id: VALID_USER_ID,
        app: 'decode',
        fingerprint_hashed: 'hash',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SSO_TOKEN_CREATION_ERROR);
    });
  });

  describe('validateSsoToken', () => {
    it('validates SSO token and creates session', async () => {
      const ssoValue = {
        user_id: VALID_USER_ID,
        app: 'decode',
        device_fingerprint_id: VALID_FINGERPRINT_ID,
      };
      redisInfrastructure.get.mockResolvedValue(ssoValue);
      redisInfrastructure.del.mockResolvedValue(undefined);
      const session = createSession();
      sessionService.createSession.mockResolvedValue(successResponse(session));

      const result = await service.validateSsoToken({ sso_token: 'token123' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(session);
      expect(redisInfrastructure.del).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        app: 'decode',
      });
    });

    it('returns error when SSO token is invalid', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.validateSsoToken({ sso_token: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SSO_TOKEN_INVALID);
    });

    it('returns error when session creation fails', async () => {
      const ssoValue = {
        user_id: 'user-1',
        app: 'decode',
        device_fingerprint_id: 'finger-1',
      };
      redisInfrastructure.get.mockResolvedValue(ssoValue);
      redisInfrastructure.del.mockResolvedValue(undefined);
      sessionService.createSession.mockResolvedValue(
        failureResponse('session creation failed'),
      );

      const result = await service.validateSsoToken({ sso_token: 'token123' });

      expect(result.success).toBe(false);
    });

    it('handles errors during token validation', async () => {
      redisInfrastructure.get.mockRejectedValue(new Error('redis error'));

      const result = await service.validateSsoToken({ sso_token: 'token123' });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SSO_TOKEN_VALIDATION_ERROR);
    });
  });
});
