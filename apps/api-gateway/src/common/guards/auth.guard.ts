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
  import { ConfigService } from '@nestjs/config';
  import { HttpService } from '@nestjs/axios';
  import { firstValueFrom } from 'rxjs';
  import { Request } from 'express';
  
  // Interfaces
  export interface AuthenticatedUser {
    userId: string;
    email: string;
    username: string;
    role: 'user' | 'admin' | 'moderator';
  }
  
  export interface AuthServiceResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
      _id: string;
      email: string;
      username: string;
      role: string;
    };
    error?: string;
  }
  
  // Decorators for role-based access
  export const ROLES_KEY = 'roles';
  export const PERMISSIONS_KEY = 'permissions';
  export const PUBLIC_KEY = 'public';
  
  export const Roles = (...roles: ('user' | 'admin' | 'moderator')[]) => 
    SetMetadata(ROLES_KEY, roles);
  
  export const Permissions = (...permissions: string[]) => 
    SetMetadata(PERMISSIONS_KEY, permissions);
  
  export const Public = () => 
    SetMetadata(PUBLIC_KEY, true);
  
  @Injectable()
  export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);
    private readonly authServiceUrl: string;
    private readonly cache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();
    private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes
  
    constructor(
      private readonly reflector: Reflector,
      private readonly configService: ConfigService,
      private readonly httpService: HttpService,
    ) {
      this.authServiceUrl = this.configService.get<string>('services.auth.url') || 'http://localhost:4001';
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      
      // Check if route is marked as public
      const isPublic = this.reflector.get<boolean>(PUBLIC_KEY, context.getHandler());
      if (isPublic) {
        return true;
      }
  
      // Extract token from request
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }
  
      try {
        // Validate token and get user info
        const user = await this.validateToken(token);
        
        // Check role-based access
        await this.checkRoleAccess(context, user);
        
        // Attach user to request for use in controllers
        request['user'] = user;
        
        // Log successful authentication
        this.logger.log(`User ${user.userId} (${user.role}) accessed ${request.method} ${request.url}`);
        
        return true;
      } catch (error) {
        this.logger.error(`Authentication failed: ${error.message}`, error.stack);
        throw error;
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
                'User-Agent': 'API-Gateway/1.0',
              },
              timeout: 5000, // 5 second timeout
            }
          )
        );
  

        if (!response.data.success || !response.data.data) {
          throw new UnauthorizedException('Invalid access token');
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
        if (error.response?.status === 401) {
          throw new UnauthorizedException('Invalid or expired access token');
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.logger.error('Auth service is unavailable');
          throw new UnauthorizedException('Authentication service unavailable');
        }
        throw new UnauthorizedException('Token validation failed');
      }
    }
  
    private async checkRoleAccess(context: ExecutionContext, user: AuthenticatedUser): Promise<void> {
      const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
      
      if (!requiredRoles || requiredRoles.length === 0) {
        return; // No role requirements
      }
  
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`
        );
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