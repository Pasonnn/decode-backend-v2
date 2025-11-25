import { LoginService } from '../login.service';
import { SessionService } from '../session.service';
import { PasswordService } from '../password.service';
import { DeviceFingerprintService } from '../device-fingerprint.service';
import { UserServiceClient } from '../../infrastructure/external-services/auth-service.client';
import { TwoFactorAuthService } from '../two-factor-auth.service';
import { RedisInfrastructure } from '../../infrastructure/redis.infrastructure';
import { Response } from '../../interfaces/response.interface';
import { UserDoc } from '../../interfaces/user-doc.interface';
import { DeviceFingerprintDoc } from '../../interfaces/device-fingerprint-doc.interface';
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

describe('LoginService', () => {
  let service: LoginService;
  let sessionService: jest.Mocked<SessionService>;
  let passwordService: jest.Mocked<PasswordService>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let twoFactorAuthService: jest.Mocked<TwoFactorAuthService>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;

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

  const createDeviceFingerprint = (
    overrides: Partial<DeviceFingerprintDoc> = {},
  ): DeviceFingerprintDoc => ({
    _id: 'finger-1',
    user_id: new Types.ObjectId(),
    fingerprint_hashed: 'fingerprint',
    is_trusted: true,
    ...overrides,
  });

  beforeEach(() => {
    sessionService = {
      createSession: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    passwordService = {
      checkPassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    deviceFingerprintService = {
      checkDeviceFingerprint: jest.fn(),
      createDeviceFingerprint: jest.fn(),
      getDeviceFingerprint: jest.fn(),
      sendDeviceFingerprintEmailVerification: jest.fn(),
      trustDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<DeviceFingerprintService>;

    userServiceClient = {
      getInfoWithPasswordByUserEmailOrUsername: jest.fn(),
      updateUserLastLogin: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;

    twoFactorAuthService = {
      checkAndInitOtpLoginSession: jest.fn(),
      checkAndInitOtpVerifyDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<TwoFactorAuthService>;

    redisInfrastructure =
      {} as RedisInfrastructure as jest.Mocked<RedisInfrastructure>;

    service = new LoginService(
      sessionService,
      passwordService,
      deviceFingerprintService,
      userServiceClient,
      twoFactorAuthService,
      redisInfrastructure,
    );

    userServiceClient.getInfoWithPasswordByUserEmailOrUsername.mockResolvedValue(
      successResponse(baseUser),
    );
    passwordService.checkPassword.mockReturnValue(successResponse());
  });

  it('returns OTP challenge response when 2FA is enabled', async () => {
    deviceFingerprintService.checkDeviceFingerprint.mockResolvedValue(
      successResponse(createDeviceFingerprint()),
    );
    const otpResponse = {
      success: true,
      statusCode: 200,
      message: 'OTP required',
      data: { login_session_token: 'otp123' },
    };
    twoFactorAuthService.checkAndInitOtpLoginSession.mockResolvedValue(
      otpResponse,
    );

    const result = await service.login({
      email_or_username: 'user@example.com',
      password: 'Pass123!',
      fingerprint_hashed: 'fingerprint',
      browser: 'Chrome',
      device: 'Mac',
    });

    expect(result).toEqual(otpResponse);
    expect(sessionService.createSession).not.toHaveBeenCalled();
  });

  it('creates session for trusted devices without OTP', async () => {
    deviceFingerprintService.checkDeviceFingerprint.mockResolvedValue(
      successResponse(createDeviceFingerprint()),
    );
    twoFactorAuthService.checkAndInitOtpLoginSession.mockResolvedValue(
      failureResponse('OTP disabled'),
    );
    sessionService.createSession.mockResolvedValue(
      successResponse({ session_token: 'session-1' } as any),
    );
    userServiceClient.updateUserLastLogin.mockResolvedValue(successResponse());

    const result = await service.login({
      email_or_username: 'user@example.com',
      password: 'Pass123!',
      fingerprint_hashed: 'fingerprint',
      browser: 'Chrome',
      device: 'Mac',
    });

    expect(sessionService.createSession).toHaveBeenCalledWith({
      user_id: 'user-1',
      device_fingerprint_id: 'finger-1',
      app: 'decode',
    });
    expect(userServiceClient.updateUserLastLogin).toHaveBeenCalledWith({
      user_id: 'user-1',
    });
    expect(result.success).toBe(true);
  });

  it('initiates device verification flow for untrusted devices', async () => {
    deviceFingerprintService.checkDeviceFingerprint.mockResolvedValue(
      failureResponse('not trusted'),
    );
    deviceFingerprintService.createDeviceFingerprint.mockResolvedValue(
      successResponse(),
    );
    deviceFingerprintService.getDeviceFingerprint.mockResolvedValue(
      successResponse(createDeviceFingerprint({ _id: 'finger-2' })),
    );
    deviceFingerprintService.sendDeviceFingerprintEmailVerification.mockResolvedValue(
      successResponse(),
    );
    twoFactorAuthService.checkAndInitOtpVerifyDeviceFingerprint.mockResolvedValue(
      failureResponse('otp disabled', 'verify-token-1'),
    );

    const result = await service.login({
      email_or_username: 'user@example.com',
      password: 'Pass123!',
      fingerprint_hashed: 'new-fingerprint',
      browser: 'Chrome',
      device: 'Mac',
    });

    expect(
      deviceFingerprintService.sendDeviceFingerprintEmailVerification,
    ).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      verify_device_fingerprint_session_token: 'verify-token-1',
    });
  });
});
