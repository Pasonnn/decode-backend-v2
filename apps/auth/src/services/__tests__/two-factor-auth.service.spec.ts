import { TwoFactorAuthService } from '../two-factor-auth.service';
import { Model } from 'mongoose';
import { Otp } from '../../schemas/otp';
import { ConfigService } from '@nestjs/config';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { SessionService } from '../session.service';
import { DeviceFingerprintService } from '../device-fingerprint.service';
import { Response } from '../../interfaces/response.interface';
import { IOtpDoc } from '../../interfaces/otp-doc.interface';
import { SessionDoc } from '../../interfaces/session-doc.interface';
import { DeviceFingerprintDoc } from '../../interfaces/device-fingerprint-doc.interface';
import { Types } from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { MESSAGES } from '../../constants/error-messages.constants';
import { AUTH_CONSTANTS } from '../../constants/auth.constants';
import * as speakeasy from 'speakeasy';

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

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;
  let otpModel: jest.Mocked<Model<Otp>>;
  let configService: jest.Mocked<ConfigService>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let sessionService: jest.Mocked<SessionService>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;

  const VALID_USER_ID = '507f1f77bcf86cd799439011';

  const createOtpDoc = (overrides: Partial<IOtpDoc> = {}): IOtpDoc =>
    ({
      _id: '507f1f77bcf86cd799439014',
      user_id: new Types.ObjectId(VALID_USER_ID),
      otp_secret: 'JBSWY3DPEHPK3PXP',
      otp_enable: false,
      ...overrides,
    }) as IOtpDoc;

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
    jest.clearAllMocks();
    const MockedOtpModel = jest.fn().mockImplementation(function (data: any) {
      const instance = {
        ...data,
        save: jest.fn().mockResolvedValue(data),
        toObject: () => data,
      };
      return instance;
    });
    MockedOtpModel.findOne = jest.fn();
    MockedOtpModel.create = jest.fn();
    otpModel = MockedOtpModel as unknown as jest.Mocked<Model<Otp>>;

    configService = {} as jest.Mocked<ConfigService>;

    redisInfrastructure = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<RedisInfrastructure>;

    sessionService = {
      createSession: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    deviceFingerprintService = {
      trustDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<DeviceFingerprintService>;

    service = new TwoFactorAuthService(
      otpModel,
      configService,
      redisInfrastructure,
      sessionService,
      deviceFingerprintService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('statusOtp', () => {
    it('returns OTP status when enabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.statusOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_ENABLED);
    });

    it('returns OTP status when disabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: false });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.statusOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.OTP.OTP_NOT_ENABLED);
    });

    it('returns error when OTP not found', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.statusOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(false);
    });
  });

  describe('setUpOtp', () => {
    it('sets up OTP successfully', async () => {
      const otpSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        ascii: 'test',
        hex: 'test',
      };
      // Mock the findOne calls - setUpOtp calls findOne, then generateOtpSecret calls findOne, then setUpOtp calls findOne again after save
      (otpModel.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // First call in setUpOtp - check if exists
        .mockResolvedValueOnce(null) // Second call in generateOtpSecret - check if exists
        .mockResolvedValueOnce(createOtpDoc()); // Third call after save - return created OTP
      const generateSecretSpy = jest
        .spyOn(speakeasy, 'generateSecret')
        .mockReturnValue(otpSecret as any);
      const otpauthURLSpy = jest
        .spyOn(speakeasy, 'otpauthURL')
        .mockReturnValue('otpauth://totp/Decode?secret=JBSWY3DPEHPK3PXP');

      const result = await service.setUpOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(generateSecretSpy).toHaveBeenCalled();
      expect(otpauthURLSpy).toHaveBeenCalled();
    });

    it('returns error when OTP already setup', async () => {
      const otpDoc = createOtpDoc();
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.setUpOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_ALREADY_SETUP);
    });
  });

  describe('verifyOtp', () => {
    it('verifies OTP successfully', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.verifyOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_VERIFIED);
    });

    it('returns error when OTP format is invalid', async () => {
      const result = await service.verifyOtp({
        user_id: 'user-1',
        otp: '12345',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_INVALID);
    });

    it('returns error when OTP not found', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.verifyOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_NOT_FOUND);
    });

    it('returns error when OTP is not enabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: false });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.verifyOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_NOT_ENABLED);
    });

    it('returns error when OTP verification fails', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      const result = await service.verifyOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_INVALID);
    });
  });

  describe('enableOtp', () => {
    it('enables OTP successfully', async () => {
      const otpDoc = createOtpDoc({ otp_enable: false });
      otpDoc.save = jest.fn().mockResolvedValue(otpDoc);
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.enableOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_ENABLED);
      expect(otpDoc.save).toHaveBeenCalled();
    });

    it('returns error when OTP not found', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.enableOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(false);
    });

    it('returns error when OTP already enabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.enableOtp({
        user_id: VALID_USER_ID,
        otp: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_ALREADY_SETUP);
    });
  });

  describe('disableOtp', () => {
    it('disables OTP successfully', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      otpDoc.save = jest.fn().mockResolvedValue(otpDoc);
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.disableOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_DISABLED);
      expect(otpDoc.save).toHaveBeenCalled();
    });

    it('returns error when OTP not found', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.disableOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(false);
    });

    it('returns error when OTP already disabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: false });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.disableOtp({ user_id: VALID_USER_ID });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_NOT_ENABLED);
    });
  });

  describe('checkOtpEnable', () => {
    it('returns success when OTP is enabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);

      const result = await service.checkOtpEnable({ user_id: VALID_USER_ID });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_IS_ENABLED);
    });

    it('returns error when OTP not enabled', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.checkOtpEnable({ user_id: VALID_USER_ID });

      expect(result.success).toBe(false);
    });
  });

  describe('loginVerifyOtp', () => {
    it('verifies OTP and creates session', async () => {
      const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';
      const loginSessionValue = {
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        browser: 'Chrome',
        device: 'Mac',
      };
      redisInfrastructure.get.mockResolvedValue(loginSessionValue);
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      const session = createSession();
      sessionService.createSession.mockResolvedValue(successResponse(session));

      const result = await service.loginVerifyOtp({
        login_session_token: 'token123',
        otp: '123456',
      });

      expect(result.success).toBe(true);
      expect(sessionService.createSession).toHaveBeenCalled();
    });

    it('returns error when login session not found', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.loginVerifyOtp({
        login_session_token: 'invalid',
        otp: '123456',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.SESSION.LOGIN_SESSION_NOT_FOUND);
    });
  });

  describe('checkAndInitOtpLoginSession', () => {
    it('creates login session token when OTP enabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      redisInfrastructure.set.mockResolvedValue(undefined);

      const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';
      const result = await service.checkAndInitOtpLoginSession({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_VERIFY_LOGIN);
      expect(redisInfrastructure.set).toHaveBeenCalled();
    });

    it('creates normal session when OTP not enabled', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);
      const session = createSession();
      sessionService.createSession.mockResolvedValue(successResponse(session));

      const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';
      const result = await service.checkAndInitOtpLoginSession({
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
        browser: 'Chrome',
        device: 'Mac',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.LOGIN_SUCCESSFUL);
      expect(sessionService.createSession).toHaveBeenCalled();
    });
  });

  describe('fingerprintTrustVerifyOtp', () => {
    it('verifies OTP and trusts device fingerprint', async () => {
      const VALID_FINGERPRINT_ID = '507f1f77bcf86cd799439012';
      const verifySessionValue = {
        user_id: VALID_USER_ID,
        device_fingerprint_id: VALID_FINGERPRINT_ID,
      };
      redisInfrastructure.get.mockResolvedValue(verifySessionValue);
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      const fingerprint: DeviceFingerprintDoc = {
        _id: VALID_FINGERPRINT_ID,
        user_id: new Types.ObjectId(VALID_USER_ID),
        fingerprint_hashed: 'hash',
        is_trusted: true,
      };
      deviceFingerprintService.trustDeviceFingerprint.mockResolvedValue(
        successResponse(fingerprint),
      );
      const session = createSession();
      sessionService.createSession.mockResolvedValue(successResponse(session));

      const result = await service.fingerprintTrustVerifyOtp({
        verify_device_fingerprint_session_token: 'token123',
        otp: '123456',
      });

      expect(result.success).toBe(true);
      expect(
        deviceFingerprintService.trustDeviceFingerprint,
      ).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalled();
    });

    it('returns error when verify session not found', async () => {
      redisInfrastructure.get.mockResolvedValue(null);

      const result = await service.fingerprintTrustVerifyOtp({
        verify_device_fingerprint_session_token: 'invalid',
        otp: '123456',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('checkAndInitOtpVerifyDeviceFingerprint', () => {
    it('creates verify session token when OTP enabled', async () => {
      const otpDoc = createOtpDoc({ otp_enable: true });
      (otpModel.findOne as jest.Mock).mockResolvedValue(otpDoc);
      redisInfrastructure.set.mockResolvedValue(undefined);

      const result = await service.checkAndInitOtpVerifyDeviceFingerprint({
        user_id: VALID_USER_ID,
        device_fingerprint_id: '507f1f77bcf86cd799439012',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(MESSAGES.SUCCESS.OTP_VERIFY_FINGERPRINT);
      expect(redisInfrastructure.set).toHaveBeenCalled();
    });

    it('returns error when OTP not enabled', async () => {
      (otpModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.checkAndInitOtpVerifyDeviceFingerprint({
        user_id: VALID_USER_ID,
        device_fingerprint_id: '507f1f77bcf86cd799439012',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(MESSAGES.OTP.OTP_NOT_ENABLED);
    });
  });
});
