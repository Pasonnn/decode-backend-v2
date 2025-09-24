/**
 * @fileoverview Service Communication Guard
 *
 * This guard provides service-to-service authentication for the Decode
 * authentication system. It validates JWT tokens specifically designed
 * for inter-service communication using the ServicesJwtStrategy.
 *
 * Authentication Features:
 * - Service JWT token validation
 * - Bearer token extraction from Authorization header
 * - Service identity verification
 * - Comprehensive error handling
 *
 * Security Measures:
 * - Token extraction from Authorization header
 * - JWT signature and expiration validation
 * - Service name verification
 * - Detailed error responses for debugging
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for guards, exceptions, and metadata
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ServicesJwtStrategy } from '../../strategies/services-jwt.strategy';

/**
 * Service Communication Guard
 *
 * This guard implements service-to-service authentication for the
 * authentication system. It validates JWT tokens using the ServicesJwtStrategy
 * to ensure only authorized services can communicate with each other.
 *
 * The guard supports:
 * - Service JWT token validation
 * - Bearer token extraction
 * - Service identity verification
 * - Comprehensive error handling
 *
 * @Injectable - Marks this class as a provider that can be injected into other classes
 */
@Injectable()
export class WalletServiceGuard implements CanActivate {
  private readonly logger = new Logger(WalletServiceGuard.name);

  /**
   * Constructor for dependency injection
   *
   * @param servicesJwtStrategy - Service JWT strategy for token validation
   */
  constructor(private readonly servicesJwtStrategy: ServicesJwtStrategy) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException({
        message: 'Service token is required',
        error: 'MISSING_SERVICE_TOKEN',
      });
    }

    try {
      const validationResult =
        this.servicesJwtStrategy.validateWalletServicesToken(token);

      if (!validationResult.success) {
        throw new UnauthorizedException({
          message: validationResult.message,
          error: 'INVALID_SERVICE_TOKEN',
        });
      }

      return true;
    } catch (error) {
      // If it's already a NestJS exception, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Service authentication failed: ${errorMessage}`);
      throw new UnauthorizedException({
        message: 'Invalid service token',
        error: 'SERVICE_AUTHENTICATION_ERROR',
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
