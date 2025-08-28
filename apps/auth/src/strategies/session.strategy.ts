import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// Define interfaces for JWT payload and request types
interface JwtPayload {
  user_id: string;
  iat?: number;
  exp?: number;
}

interface RequestWithAuth extends Request {
  headers: Request['headers'] & {
    authorization?: string;
  };
  cookies?: Record<string, string>;
  query: Request['query'] & {
    sessionToken?: string;
  };
}

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret.sessionToken'),
      issuer: configService.get<string>('jwt.sessionToken.issuer'),
      audience: configService.get<string>('jwt.sessionToken.audience'),
    });
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

  validateRefreshToken(req: RequestWithAuth): JwtPayload {
    try {
      // extract token from header
      const token = this.extractRefreshToken(req);
      if (!token) {
        throw new UnauthorizedException('No refresh token provided');
      }
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret.sessionToken'),
        issuer: this.configService.get<string>('jwt.sessionToken.issuer'),
        audience: this.configService.get<string>('jwt.sessionToken.audience'),
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  extractRefreshToken(req: RequestWithAuth): string | null {
    // From Authorization header
    if (req.headers?.authorization?.startsWith('Session ')) {
      const token = req.headers.authorization.split(' ')[1];
      return token || null;
    }

    // From cookies (if using cookie-parser)
    if (req.cookies?.sessionToken) {
      return req.cookies.sessionToken;
    }

    // From query parameters
    if (req.query?.sessionToken && typeof req.query.sessionToken === 'string') {
      return req.query.sessionToken;
    }

    return null;
  }
}
