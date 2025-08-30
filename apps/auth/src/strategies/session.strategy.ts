import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Response } from '../interfaces/response.interface';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret.sessionToken') || '',
      issuer: configService.get<string>('jwt.sessionToken.issuer') || '',
      audience: configService.get<string>('jwt.sessionToken.audience') || '',
    });
  }

  validate(payload: JwtPayload) {
    // This method is called by Passport after JWT verification
    // Return the user object that will be attached to the request
    return {
      userId: payload.user_id,
    };
  }

  createRefreshToken(user_id: string): string {
    const payload: JwtPayload = { user_id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret.sessionToken'),
      expiresIn: this.configService.get<string>('jwt.sessionToken.expiresIn'),
      issuer: this.configService.get<string>('jwt.sessionToken.issuer'),
      audience: this.configService.get<string>('jwt.sessionToken.audience'),
    });
  }

  validateRefreshToken(refresh_token: string): Response<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refresh_token, {
        secret: this.configService.get<string>('jwt.secret.sessionToken'),
        issuer: this.configService.get<string>('jwt.sessionToken.issuer'),
        audience: this.configService.get<string>('jwt.sessionToken.audience'),
      });
      return {
        success: true,
        statusCode: 200,
        message: 'Refresh token validated',
        data: payload,
      };
    } catch {
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid refresh token',
      };
    }
  }
}
