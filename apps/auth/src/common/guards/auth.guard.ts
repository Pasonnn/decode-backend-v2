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

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const PUBLIC_KEY = 'public';

export const Roles = (...roles: ('user' | 'admin' | 'moderator')[]) =>
    SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
export const Public = () =>
    SetMetadata(PUBLIC_KEY, true);

export interface AuthenticatedUser {
    userId: string;
    email: string;
    username: string;
    role: string;
    permissions: string[];
    sessionToken?: string;
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
        const isPublic = this.reflector.get<boolean>(PUBLIC_KEY, context.getHandler());
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Access token is required');
        }

        try {
            const user = await this.validateToken(token);
            request.user = user;

            // Check roles if required
            await this.checkRoles(context, user);

            // Check permissions if required
            await this.checkPermissions(context, user);

            return true;
        } catch (error) {
            this.logger.error(`Authentication failed: ${error.message}`);
            throw new UnauthorizedException('Invalid access token');
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private async validateToken(token: string): Promise<AuthenticatedUser> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.secret.accessToken'),
                issuer: this.configService.get('jwt.accessToken.issuer'),
                audience: this.configService.get('jwt.accessToken.audience'),
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
            this.logger.error(`Token validation failed: ${error.message}`);
            throw new UnauthorizedException('Invalid access token');
        }
    }

    private async checkRoles(context: ExecutionContext, user: AuthenticatedUser): Promise<void> {
        const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

        if (!requiredRoles || requiredRoles.length === 0) {
            return; // No role requirements
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`
            );
        }
    }

    private async checkPermissions(context: ExecutionContext, user: AuthenticatedUser): Promise<void> {
        const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return; // No permission requirements
        }

        const userPermissions = this.getUserPermissions(user.role);
        const missingPermissions = requiredPermissions.filter(
            permission => !userPermissions.includes(permission)
        );

        if (missingPermissions.length > 0) {
            throw new ForbiddenException(
                `Access denied. Missing permissions: ${missingPermissions.join(', ')}`
            );
        }
    }

    private getUserPermissions(role: string): string[] {
        const rolePermissions: Record<string, string[]> = {
            admin: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
            moderator: ['read', 'write', 'moderate_content'],
            user: ['read', 'write_own'],
        };
        return rolePermissions[role] || [];
    }
}