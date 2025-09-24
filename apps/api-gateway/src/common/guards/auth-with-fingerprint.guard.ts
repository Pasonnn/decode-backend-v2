import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import {
  AuthenticatedUser,
  AuthGuard,
  AuthServiceResponse,
} from './auth.guard';
import { UserDoc } from 'apps/auth/src/interfaces/user-doc.interface';

@Injectable()
export class AuthGuardWithFingerprint implements CanActivate {
  private readonly logger = new Logger(AuthGuardWithFingerprint.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly authGuard: AuthGuard,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('services.auth.url') ||
      'http://localhost:4001';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // First, run JWT authentication
      const jwtResult =
        await this.authGuard.activateWithUserDataResponse(context);
      if (!jwtResult) {
        throw new UnauthorizedException({
          message: 'JWT authentication failed',
          error: 'JWT_AUTH_FAILED',
        });
      }

      const request = context.switchToHttp().getRequest<Request>();

      // Extract fingerprint hash from headers
      const fingerprintHash = this.extractFingerprintFromHeader(request);
      if (!fingerprintHash) {
        throw new UnauthorizedException({
          message: 'Fingerprint hash is required',
          error: 'MISSING_FINGERPRINT',
        });
      }

      // Validate fingerprint with auth service
      const response = await firstValueFrom(
        this.httpService.post<AuthServiceResponse>(
          `${this.authServiceUrl}/auth/info/by-fingerprint-hashed`,
          { fingerprint_hashed: fingerprintHash },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'API-Gateway/1.0',
            },
            timeout: 5000, // 5 second timeout
          },
        ),
      );
      console.log(response.data);
      if (!response.data.success || !response.data.data) {
        throw new UnauthorizedException({
          message: 'Invalid fingerprint hash',
          error: 'INVALID_FINGERPRINT',
        });
      }

      const fingerprintUsers = response.data.data as unknown as UserDoc[];

      // Get user from JWT (set by AuthGuard)
      const jwtUserData = jwtResult as unknown as AuthenticatedUser;

      // Compare users ID of JWT and fingerprint
      const isUserMatched = fingerprintUsers.some((fingerprintUser) => {
        if (jwtUserData.userId == fingerprintUser._id) {
          return true;
        }
        return false;
      });

      if (!isUserMatched) {
        throw new UnauthorizedException({
          message: 'This device is not trusted for current user',
          error: 'USER_ID_AND_FINGERPRINT_MISMATCH',
        });
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Fingerprint authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({
        message: 'Fingerprint authentication failed',
        error: 'AUTHENTICATION_ERROR',
      });
    }
  }

  private extractFingerprintFromHeader(request: Request): string | undefined {
    return (
      (request.headers['x-fingerprint-hash'] as string) ||
      (request.headers['fingerprint-hash'] as string) ||
      (request.headers['fingerprint'] as string) ||
      (request.headers['x-fingerprint-hashed'] as string) ||
      (request.headers['fingerprint-hashed'] as string)
    );
  }
}
