import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '../rate-limit.guard';
import { RateLimitService } from '../../../infrastructure/cache/rate-limit.service';
import { RateLimitOptions } from '../../decorators/rate-limit.decorator';

const createExecutionContext = (
  handler: () => void,
  request: Record<string, any>,
  response: Record<string, any>,
) =>
  ({
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as any;

describe('RateLimitGuard', () => {
  const handler = () => undefined;
  const reflector = {
    get: jest.fn(),
  } as unknown as Reflector;
  const configService = {} as ConfigService;
  const rateLimitService = {
    isAllowed: jest.fn(),
  } as unknown as RateLimitService;

  const guard = new RateLimitGuard(reflector, configService, rateLimitService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows execution when no metadata is set', async () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);

    const context = createExecutionContext(handler, {}, {});
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rateLimitService.isAllowed).not.toHaveBeenCalled();
  });

  it('applies rate limiting and sets headers when allowed', async () => {
    const options: RateLimitOptions = { windowMs: 1000, max: 5 };
    (reflector.get as jest.Mock).mockReturnValue(options);

    const request = {
      headers: { 'x-forwarded-for': '10.0.0.1' },
      ip: '127.0.0.1',
    };
    const setHeader = jest.fn();
    const response = { setHeader };

    (rateLimitService.isAllowed as jest.Mock).mockResolvedValue({
      allowed: true,
      info: { limit: 5, remaining: 4 },
    });

    const context = createExecutionContext(handler, request, response);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(rateLimitService.isAllowed).toHaveBeenCalledWith(
      'rate_limit:ip:10.0.0.1',
      1000,
      5,
    );
    expect(setHeader).toHaveBeenCalledWith('RateLimit-Limit', '5');
    expect(setHeader).toHaveBeenCalledWith('RateLimit-Remaining', '1');
  });

  it('throws HttpException when rate limit is exceeded', async () => {
    const options: RateLimitOptions = {
      windowMs: 1000,
      max: 1,
      message: 'Too many requests',
    };
    (reflector.get as jest.Mock).mockReturnValue(options);

    const context = createExecutionContext(
      handler,
      { headers: {}, ip: '1.1.1.1' },
      { setHeader: jest.fn() },
    );

    (rateLimitService.isAllowed as jest.Mock).mockResolvedValue({
      allowed: false,
      info: { limit: 1, remaining: 0 },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: expect.objectContaining({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
      }),
    });
  });

  it('fails open when rate limit storage errors', async () => {
    const options: RateLimitOptions = { windowMs: 1000, max: 5 };
    (reflector.get as jest.Mock).mockReturnValue(options);

    (rateLimitService.isAllowed as jest.Mock).mockRejectedValue(
      new Error('redis down'),
    );

    const context = createExecutionContext(
      handler,
      { headers: {}, ip: '1.1.1.1' },
      { setHeader: jest.fn() },
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
