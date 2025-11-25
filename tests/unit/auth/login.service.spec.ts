import { HttpStatus } from '@nestjs/common';
import { LoginService } from '../../../apps/auth/src/services/login.service';
import { SessionService } from '../../../apps/auth/src/services/session.service';
import { PasswordService } from '../../../apps/auth/src/services/password.service';
import { DeviceFingerprintService } from '../../../apps/auth/src/services/device-fingerprint.service';
import { UserServiceClient } from '../../../apps/auth/src/infrastructure/external-services/auth-service.client';
import { TwoFactorAuthService } from '../../../apps/auth/src/services/two-factor-auth.service';
import { RedisInfrastructure } from '../../../apps/auth/src/infrastructure/redis.infrastructure';
import { MESSAGES } from '../../../apps/auth/src/constants/error-messages.constants';
import { Response } from '../../../apps/auth/src/interfaces/response.interface';

describe('LoginService (unit)', () => {
  const baseInput = {
    email_or_username: 'user@example.com',
    password: 'Secret123!',
    fingerprint_hashed: 'fp_hash',
    browser: 'Chrome',
    device: 'MacBook Pro',
  };

  let sessionService: jest.Mocked<SessionService>;
  let passwordService: jest.Mocked<PasswordService>;
  let deviceFingerprintService: jest.Mocked<DeviceFingerprintService>;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let twoFactorAuthService: jest.Mocked<TwoFactorAuthService>;
  let redisInfrastructure: jest.Mocked<RedisInfrastructure>;
  let service: LoginService;

  beforeEach(() => {
    sessionService = { createSession: jest.fn() } as unknown as jest.Mocked<SessionService>;
    passwordService = { checkPassword: jest.fn() } as unknown as jest.Mocked<PasswordService>;
    deviceFingerprintService = {
      checkDeviceFingerprint: jest.fn(),
      createDeviceFingerprint: jest.fn(),
      getDeviceFingerprint: jest.fn(),
      sendDeviceFingerprintEmailVerification: jest.fn(),
    } as unknown as jest.Mocked<DeviceFingerprintService>;
    userServiceClient = {
      getInfoWithPasswordByUserEmailOrUsername: jest.fn(),
      updateUserLastLogin: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;
    twoFactorAuthService = {
      checkAndInitOtpLoginSession: jest.fn(),
      checkAndInitOtpVerifyDeviceFingerprint: jest.fn(),
    } as unknown as jest.Mocked<TwoFactorAuthService>;
    redisInfrastructure = {} as jest.Mocked<RedisInfrastructure>;

    service = new LoginService(
      sessionService,
      passwordService,
      deviceFingerprintService,
      userServiceClient,
      twoFactorAuthService,
      redisInfrastructure,
    );
  });

  it('should return upstream error when user lookup fails', async () => {
    const failureResponse: Response = {
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      message: 'User not found',
    };

    userServiceClient.getInfoWithPasswordByUserEmailOrUsername.mockResolvedValue(
      failureResponse,
    );

    const result = await service.login(baseInput);

    expect(result).toEqual(failureResponse);
    expect(userServiceClient.getInfoWithPasswordByUserEmailOrUsername).toHaveBeenCalledTimes(1);
  });

  it('should create session for trusted device when all checks succeed', async () => {
    const userDoc = { _id: 'user123', password_hashed: 'hashed' } as any;

    userServiceClient.getInfoWithPasswordByUserEmailOrUsername.mockResolvedValue({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'ok',
      data: userDoc,
    });

    passwordService.checkPassword.mockReturnValue({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'password valid',
    });

    const trustedFingerprint = { _id: 'fingerprint123' } as any;
    deviceFingerprintService.checkDeviceFingerprint.mockResolvedValue({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'trusted',
      data: trustedFingerprint,
    });

    twoFactorAuthService.checkAndInitOtpLoginSession.mockResolvedValue({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'otp not required',
    });

    const sessionPayload = {
      access_token: 'access-token',
      session_token: 'session-token',
    };
    sessionService.createSession.mockResolvedValue({
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'session created',
      data: sessionPayload,
    });

    userServiceClient.updateUserLastLogin.mockResolvedValue({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'user updated',
    });

    const result = await service.login(baseInput);

    expect(result).toEqual({
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.LOGIN_SUCCESSFUL,
      data: sessionPayload,
    });
    expect(sessionService.createSession).toHaveBeenCalledWith({
      user_id: 'user123',
      device_fingerprint_id: 'fingerprint123',
      app: 'decode',
    });
    expect(userServiceClient.updateUserLastLogin).toHaveBeenCalledWith({
      user_id: 'user123',
    });
  });
});
