import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Response } from '../interfaces/response.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret.accessToken') || '',
      issuer: configService.get<string>('jwt.accessToken.issuer') || '',
      audience: configService.get<string>('jwt.accessToken.audience') || '',
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
