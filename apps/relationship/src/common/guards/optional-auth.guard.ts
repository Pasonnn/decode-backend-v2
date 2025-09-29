import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

// Interfaces Import
import { AuthenticatedUser } from '../../interfaces/authenticated-user.interface';
import { AuthServiceResponse } from '../../interfaces/auth-service-response.interface';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalAuthGuard.name);
  private readonly authServiceUrl: string;
  private readonly cache = new Map<
    string,
    { user: AuthenticatedUser; expiresAt: number }
  >();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('services.auth.url') ||
      'http://localhost:4001';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract token from request
    const token = this.extractTokenFromHeader(request);

    // If no token provided, allow access (public)
    if (!token) {
      return true;
    }

    try {
      // Validate token and get user info
      const user = await this.validateToken(token);

      // Attach user to request for use in controllers
      request['user'] = user;

      // Log successful authentication
      this.logger.log(
        `User ${user.userId} (${user.role}) accessed ${request.method} ${request.url}`,
      );

      return true;
    } catch (error) {
      // For optional auth, we don't throw errors for invalid tokens
      // Just log the error and continue without authentication
      this.logger.warn(
        `Optional authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Continue without authentication (public access)
      return true;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateToken(token: string): Promise<AuthenticatedUser> {
    // Check cache first
    const cached = this.cache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    try {
      // Call auth service to validate token
      const response = await firstValueFrom(
        this.httpService.post<AuthServiceResponse>(
          `${this.authServiceUrl}/auth/info/by-access-token`,
          { access_token: token },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Relationship-Service/1.0',
            },
            timeout: 5000, // 5 second timeout
          },
        ),
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid access token');
      }

      const userData = response.data.data;
      const user: AuthenticatedUser = {
        userId: userData._id,
        email: userData.email,
        username: userData.username,
        role: userData.role as 'user' | 'admin' | 'moderator',
      };

      // Cache the result
      this.cache.set(token, {
        user,
        expiresAt: Date.now() + this.cacheTtl,
      });

      return user;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        throw new Error('Invalid or expired access token');
      }

      if (error instanceof AxiosError) {
        this.logger.error('Auth service is unavailable');
        throw new Error('Authentication service unavailable');
      }

      throw new Error('Token validation failed');
    }
  }

  // Utility method to clear cache (useful for testing or manual cache invalidation)
  clearCache(): void {
    this.cache.clear();
  }

  // Utility method to get cache size (useful for monitoring)
  getCacheSize(): number {
    return this.cache.size;
  }
}
