import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterInfoDto } from '../dto/register.dto';

jest.mock(
  'apps/auth/src/constants/auth.constants',
  () => ({
    AUTH_CONSTANTS: { STATUS_CODES: { SUCCESS: 200 } },
  }),
  { virtual: true },
);

describe('AuthController', () => {
  let authService: jest.Mocked<AuthService>;
  let controller: AuthController;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      getActiveSessions: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    controller = new AuthController(authService);
  });

  it('delegates login to AuthService', async () => {
    const dto: LoginDto = {
      email_or_username: 'user@example.com',
      password: 'secret',
      fingerprint_hashed: 'finger',
      browser: 'chrome',
      device: 'mac',
    };
    const response = { success: true };
    authService.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toEqual(response);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('delegates registration to AuthService', async () => {
    const dto: RegisterInfoDto = {
      email: 'user@example.com',
      username: 'user',
      password: 'secret',
      display_name: 'User',
    };
    const response = { success: true, data: { user_id: '123' } };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toEqual(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('resolves active sessions for current user', async () => {
    const response = { success: true };
    authService.getActiveSessions.mockResolvedValue(response);

    await expect(
      controller.getActiveSessions(
        { userId: 'user-id' } as any,
        'Bearer token',
      ),
    ).resolves.toEqual(response);
    expect(authService.getActiveSessions).toHaveBeenCalledWith(
      'user-id',
      'Bearer token',
    );
  });

  it('returns current user payload without service call', async () => {
    const user = { userId: '123', roles: ['user'] } as any;
    await expect(controller.getCurrentUser(user)).resolves.toMatchObject({
      success: true,
      data: user,
    });
    expect(authService.login).not.toHaveBeenCalled();
  });
});
