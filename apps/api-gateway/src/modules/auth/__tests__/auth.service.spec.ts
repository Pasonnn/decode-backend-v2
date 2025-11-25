import { AuthService } from '../auth.service';
import { AuthServiceClient } from '../../../infrastructure/external-services/auth-service.client';
import { MetricsService } from '../../../common/datadog/metrics.service';
import { LoginDto } from '../dto/login.dto';

describe('AuthService', () => {
  let authServiceClient: jest.Mocked<AuthServiceClient>;
  let metricsService: jest.Mocked<MetricsService>;
  let service: AuthService;

  beforeEach(() => {
    authServiceClient = {
      login: jest.fn(),
      checkHealth: jest.fn(),
    } as unknown as jest.Mocked<AuthServiceClient>;

    metricsService = {
      increment: jest.fn(),
      timing: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    service = new AuthService(authServiceClient, metricsService);
  });

  it('records success metrics on successful login', async () => {
    const dto: LoginDto = {
      email_or_username: 'user@example.com',
      password: 'secret',
      fingerprint_hashed: 'abc',
      browser: 'chrome',
      device: 'mac',
    };
    const response = { success: true, message: 'ok' };
    authServiceClient.login.mockResolvedValue(response);

    await expect(service.login(dto)).resolves.toEqual(response);

    expect(authServiceClient.login).toHaveBeenCalledWith(dto);
    expect(metricsService.increment).toHaveBeenCalledWith(
      'auth.login.attempts',
      1,
    );
    expect(metricsService.increment).toHaveBeenCalledWith(
      'auth.login.success',
      1,
    );
    expect(metricsService.timing).toHaveBeenCalledWith(
      'auth.login.duration',
      expect.any(Number),
    );
  });

  it('records failure metrics and rethrows errors', async () => {
    const dto = {
      email_or_username: 'user@example.com',
      password: 'secret',
      fingerprint_hashed: 'abc',
      browser: 'chrome',
      device: 'mac',
    } as LoginDto;

    const error = new Error('boom');
    authServiceClient.login.mockRejectedValue(error);

    await expect(service.login(dto)).rejects.toThrow('boom');

    expect(metricsService.increment).toHaveBeenCalledWith(
      'auth.login.failed',
      1,
    );
    expect(metricsService.timing).toHaveBeenCalledWith(
      'auth.login.duration',
      expect.any(Number),
      { error: 'true' },
    );
  });
});
