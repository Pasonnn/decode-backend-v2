import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PUBLIC_KEY = 'public';

export const Roles = (...roles: ('user' | 'admin' | 'moderator')[]) =>
  SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
  sessionToken?: string;
}

interface JwtPayload {
  user_id: string;
  email: string;
  username: string;
  role?: string;
  session_token?: string;
}

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const user = this.validateToken(token);
      request.user = user;

      // Check roles if required
      this.checkRoles(context, user);

      // Check permissions if required
      this.checkPermissions(context, user);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Authentication failed: ${errorMessage}`);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private validateToken(token: string): AuthenticatedUser {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret.accessToken'),
        issuer: this.configService.get<string>('jwt.accessToken.issuer'),
        audience: this.configService.get<string>('jwt.accessToken.audience'),
      });

      return {
        userId: payload.user_id,
        email: payload.email,
        username: payload.username,
        role: payload.role || 'user',
        permissions: this.getUserPermissions(payload.role || 'user'),
        sessionToken: payload.session_token,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token validation failed: ${errorMessage}`);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private checkRoles(context: ExecutionContext, user: AuthenticatedUser): void {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return; // No role requirements
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`,
      );
    }
  }

  private checkPermissions(
    context: ExecutionContext,
    user: AuthenticatedUser,
  ): void {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return; // No permission requirements
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }
  }

  private getUserPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_system'];
      case 'moderator':
        return ['read', 'write', 'moderate_content'];
      case 'user':
        return ['read', 'write'];
      default:
        return ['read'];
    }
  }
}
