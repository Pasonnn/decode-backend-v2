/**
 * @fileoverview JWT Authentication Strategy
 *
 * This strategy handles JWT access token validation and generation for the
 * Decode authentication system. It implements Passport.js JWT strategy
 * for secure token-based authentication.
 *
 * JWT Strategy Features:
 * - Access token validation with secure secrets
 * - Token generation with configurable expiration
 * - Issuer and audience validation for security
 * - Bearer token extraction from Authorization header
 * - Comprehensive token validation and error handling
 *
 * Security Measures:
 * - Secure secret keys from environment variables
 * - Token expiration validation
 * - Issuer and audience verification
 * - Proper error handling for invalid tokens
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for dependency injection
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Response } from '../interfaces/response.interface';

/**
 * JWT Authentication Strategy
 *
 * This strategy implements JWT token validation and generation using Passport.js.
 * It handles access token validation for API authentication and provides
 * methods for creating new access tokens.
 *
 * The strategy extracts JWT tokens from the Authorization header and validates
 * them against configured secrets, issuer, and audience values.
 *
 * @Injectable - Marks this class as a provider that can be injected into other classes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Constructor for dependency injection and strategy configuration
   *
   * @param configService - Configuration service for accessing environment variables
   * @param jwtService - JWT service for token operations
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract token from Authorization header
      ignoreExpiration: false, // Validate token expiration
      secretOrKey: configService.get<string>('jwt.secret.accessToken') || '', // Secret key for validation
      issuer: configService.get<string>('jwt.accessToken.issuer') || '', // Token issuer validation
      audience: configService.get<string>('jwt.accessToken.audience') || '', // Token audience validation
    });
  }

  validate(payload: JwtPayload) {
    // This method is called by Passport after JWT verification
    // Return the user object that will be attached to the request
    return {
      userId: payload.user_id,
    };
  }

  createAccessToken(user_id: string, session_token: string) {
    const payload = { user_id: user_id, session_token: session_token };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret.accessToken'),
      expiresIn: this.configService.get<string>('jwt.accessToken.expiresIn'),
      issuer: this.configService.get<string>('jwt.accessToken.issuer'),
      audience: this.configService.get<string>('jwt.accessToken.audience'),
    });
  }

  validateAccessToken(token: string): Response<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret.accessToken'),
        issuer: this.configService.get<string>('jwt.accessToken.issuer'),
        audience: this.configService.get<string>('jwt.accessToken.audience'),
      });
      if (!payload.exp) {
        return {
          success: false,
          statusCode: 401,
          message: 'Access token expired',
        };
      }
      if (payload.exp < Date.now() / 1000) {
        return {
          success: false,
          statusCode: 401,
          message: 'Access token expired',
        };
      }
      // Return response
      return {
        success: true,
        statusCode: 200,
        message: 'Access token validated',
        data: payload,
      };
    } catch {
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid access token',
      };
    }
  }
}
