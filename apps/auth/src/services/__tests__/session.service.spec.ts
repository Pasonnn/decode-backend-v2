import { SessionService } from '../session.service';
import { Model } from 'mongoose';
import { Session } from '../../schemas/session.schema';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { SessionStrategy } from '../../strategies/session.strategy';
import { DeviceFingerprintService } from '../device-fingerprint.service';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from '../../interfaces/response.interface';
import { SessionDoc } from '../../interfaces/session-doc.interface';
import { JwtPayload } from '../../interfaces/jwt-payload.interface';
import { DeviceFingerprintDoc } from '../../interfaces/device-fingerprint-doc.interface';
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

describe('SessionService', () => {
  let service: SessionService;
  let sessionModel: jest.Mocked<Model<Session>>;
  let jwtStrategy: jest.Mocked<JwtStrategy>;
  let sessionStrategy: jest.Mocked<SessionStrategy>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;
  let notificationService: jest.Mocked<ClientProxy>;

  const VALID_USER_ID = '507f1f77bcf86cd799439011';
  const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';
  const VALID_SESSION_ID = '507f1f77bcf86cd799439013';

  const createSession = (overrides: Partial<SessionDoc> = {}): SessionDoc => ({
    _id: VALID_SESSION_ID,
    user_id: new Types.ObjectId(VALID_USER_ID),
    device_fingerprint_id: new Types.ObjectId(VALID_FINGERPRINT_ID),
    session_token: 'session-token-1',
    access_token: 'access-token-1',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    revoked_at: new Date(),
    ...overrides,
  });

  const createJwtPayload = (): JwtPayload => ({
    user_id: VALID_USER_ID,
    session_token: 'session-token-1',
  });

  beforeEach(() => {
    sessionModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Model<Session>>;

    jwtStrategy = {
      createAccessToken: jest.fn(),
      validateAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtStrategy>;

    sessionStrategy = {
      createRefreshToken: jest.fn(),
      validateRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<SessionStrategy>;

    deviceFingerprintService = {
      checkDeviceFingerprint: jest.fn(),
      createTrustedDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<DeviceFingerprintService>;

    notificationService = {
      emit: jest.fn().mockReturnValue({
        toPromise: jest.fn().mockResolvedValue(undefined),
      }),
    } as unknown as jest.Mocked<ClientProxy>;

    service = new SessionService(
      jwtStrategy,
      sessionModel,
      sessionStrategy,
      deviceFingerprintService,
      notificationService,
    );
  });

  describe('createSession', () => {
    it('creates session successfully', async () => {
      const session = createSession();
      session.toObject = jest.fn().mockReturnValue(session);
      sessionStrategy.createRefreshToken.mockReturnValue('session-token-1');
      (sessionModel.create as jest.Mock).mockResolvedValue(undefined);
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);
      jwtStrategy.createAccessToken.mockReturnValue('access-token-1');

      const result = await service.createSession({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        app: 'decode',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(sessionModel.create).toHaveBeenCalled();
      expect(jwtStrategy.createAccessToken).toHaveBeenCalled();
      expect(notificationService.emit).toHaveBeenCalled();
    });

    it('returns error when session creation fails', async () => {
      sessionStrategy.createRefreshToken.mockReturnValue('session-token-1');
      (sessionModel.create as jest.Mock).mockResolvedValue(undefined);
      (sessionModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.createSession({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        app: 'decode',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SESSION_CREATION_ERROR);
    });

    it('handles errors during session creation', async () => {
      sessionStrategy.createRefreshToken.mockReturnValue('session-token-1');
      (sessionModel.create as jest.Mock).mockRejectedValue(
        new Error('database error'),
      );

      const result = await service.createSession({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        app: 'decode',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('refreshes session successfully', async () => {
      const jwtPayload = createJwtPayload();
      const session = createSession();
      session.validateSession = jest.fn();
      session.toObject = jest.fn().mockReturnValue(session);

      service.validateSession = jest
        .fn()
        .mockResolvedValue(
          successResponse(jwtPayload as unknown as JwtPayload),
        );
      sessionStrategy.createRefreshToken.mockReturnValue('new-session-token');
      jwtStrategy.createAccessToken.mockReturnValue('new-access-token');
      (sessionModel.updateOne as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);

      const result = await service.refreshSession('old-session-token');

      expect(result.success).toBe(true);
      expect(sessionModel.updateOne).toHaveBeenCalled();
    });

    it('returns error when session validation fails', async () => {
      service.validateSession = jest
        .fn()
        .mockResolvedValue(failureResponse('invalid session'));

      const result = await service.refreshSession('invalid-token');

      expect(result.success).toBe(false);
    });
  });

  describe('revokeSessionBySessionId', () => {
    it('revokes session successfully', async () => {
      (sessionModel.updateOne as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });

      const result = await service.revokeSessionBySessionId(VALID_SESSION_ID);

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.SESSION_REVOKED);
      expect(sessionModel.updateOne).toHaveBeenCalled();
    });

    it('handles errors during revocation', async () => {
      (sessionModel.updateOne as jest.Mock).mockRejectedValue(
        new Error('database error'),
      );

      const result = await service.revokeSessionBySessionId(VALID_SESSION_ID);

      expect(result.success).toBe(false);
    });
  });

  describe('revokeSessionByDeviceFingerprintId', () => {
    it('revokes all sessions for device fingerprint', async () => {
      (sessionModel.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 2,
      });

      const result =
        await service.revokeSessionByDeviceFingerprintId(VALID_FINGERPRINT_ID);

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.SESSIONS_REVOKED);
      expect(sessionModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('getUserActiveSessions', () => {
    it('returns active sessions for user', async () => {
      const session1 = createSession();
      const session2 = createSession({ _id: '507f1f77bcf86cd799439014' });
      const sessions = [
        {
          toObject: () => session1,
        },
        {
          toObject: () => session2,
        },
      ];
      (sessionModel.find as jest.Mock).mockResolvedValue(sessions);

      const result = await service.getUserActiveSessions(VALID_USER_ID);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    it('handles errors during session fetch', async () => {
      (sessionModel.find as jest.Mock).mockRejectedValue(
        new Error('database error'),
      );

      const result = await service.getUserActiveSessions(VALID_USER_ID);

      expect(result.success).toBe(false);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('cleans up expired sessions', async () => {
      (sessionModel.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 3,
      });

      const result = await service.cleanupExpiredSessions(VALID_USER_ID);

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.EXPIRED_SESSIONS_CLEANED_UP);
    });
  });

  describe('logout', () => {
    it('logs out session successfully', async () => {
      const session = createSession();
      session.revoked_at = null;
      session.toObject = jest.fn().mockReturnValue(session);

      service.validateSession = jest
        .fn()
        .mockResolvedValue(
          successResponse(createJwtPayload() as unknown as JwtPayload),
        );
      (sessionModel.updateOne as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);

      const result = await service.logout('session-token-1');

      expect(result.success).toBe(true);
    });

    it('returns error when session validation fails', async () => {
      service.validateSession = jest
        .fn()
        .mockResolvedValue(failureResponse('invalid session'));

      const result = await service.logout('invalid-token');

      expect(result.success).toBe(false);
    });
  });

  describe('validateAccess', () => {
    it('validates access token successfully', async () => {
      const jwtPayload = createJwtPayload();
      jwtStrategy.validateAccessToken.mockReturnValue(
        successResponse(jwtPayload),
      );
      const session = createSession();
      session.revoked_at = null;
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);

      const result = await service.validateAccess('access-token-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jwtPayload);
    });

    it('returns error when token validation fails', async () => {
      jwtStrategy.validateAccessToken.mockReturnValue(
        failureResponse('invalid token'),
      );

      const result = await service.validateAccess('invalid-token');

      expect(result.success).toBe(false);
    });

    it('returns error when session not found', async () => {
      const jwtPayload = createJwtPayload();
      jwtStrategy.validateAccessToken.mockReturnValue(
        successResponse(jwtPayload),
      );
      (sessionModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateAccess('access-token-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SESSION_NOT_FOUND);
    });

    it('returns error when session is expired', async () => {
      const jwtPayload = createJwtPayload();
      jwtStrategy.validateAccessToken.mockReturnValue(
        successResponse(jwtPayload),
      );
      const session = createSession({
        expires_at: new Date(Date.now() - 1000),
      });
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);

      const result = await service.validateAccess('access-token-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SESSION_EXPIRED);
    });

    it('returns error when session is revoked', async () => {
      const jwtPayload = createJwtPayload();
      jwtStrategy.validateAccessToken.mockReturnValue(
        successResponse(jwtPayload),
      );
      const session = createSession({
        is_active: false,
        revoked_at: new Date(),
      });
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);

      const result = await service.validateAccess('access-token-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.SESSION_REVOKED);
    });
  });

  describe('validateSession', () => {
    it('validates session token successfully', async () => {
      const jwtPayload = createJwtPayload();
      sessionStrategy.validateRefreshToken.mockReturnValue(
        successResponse(jwtPayload),
      );
      const session = createSession();
      session.revoked_at = null;
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);

      const result = await service.validateSession('session-token-1');

      expect(result.success).toBe(true);
    });

    it('returns error when token validation fails', async () => {
      sessionStrategy.validateRefreshToken.mockReturnValue(
        failureResponse('invalid token'),
      );

      const result = await service.validateSession('invalid-token');

      expect(result.success).toBe(false);
    });
  });

  describe('createWalletSession', () => {
    it('creates wallet session with existing trusted device', async () => {
      const fingerprint: DeviceFingerprintDoc = {
        _id: VALID_FINGERPRINT_ID,
        user_id: new Types.ObjectId(VALID_USER_ID),
        fingerprint_hashed: 'hash',
        is_trusted: true,
      };
      deviceFingerprintService.checkDeviceFingerprint.mockResolvedValue(
        successResponse(fingerprint),
      );
      const session = createSession();
      session.toObject = jest.fn().mockReturnValue(session);
      sessionStrategy.createRefreshToken.mockReturnValue('session-token-1');
      (sessionModel.create as jest.Mock).mockResolvedValue(undefined);
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);
      jwtStrategy.createAccessToken.mockReturnValue('access-token-1');

      const result = await service.createWalletSession({
        user_id: VALID_USER_ID,
        device_fingerprint_hashed: 'hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
    });

    it('creates wallet session with new trusted device', async () => {
      deviceFingerprintService.checkDeviceFingerprint.mockResolvedValue(
        failureResponse('not found'),
      );
      const newFingerprint: DeviceFingerprintDoc = {
        _id: VALID_FINGERPRINT_ID,
        user_id: new Types.ObjectId(VALID_USER_ID),
        fingerprint_hashed: 'hash',
        is_trusted: true,
      };
      deviceFingerprintService.createTrustedDeviceFingerprint.mockResolvedValue(
        successResponse(newFingerprint),
      );
      const session = createSession();
      session.toObject = jest.fn().mockReturnValue(session);
      sessionStrategy.createRefreshToken.mockReturnValue('session-token-1');
      (sessionModel.create as jest.Mock).mockResolvedValue(undefined);
      (sessionModel.findOne as jest.Mock).mockResolvedValue(session);
      jwtStrategy.createAccessToken.mockReturnValue('access-token-1');

      const result = await service.createWalletSession({
        user_id: VALID_USER_ID,
        device_fingerprint_hashed: 'hash',
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
    });
  });
});
