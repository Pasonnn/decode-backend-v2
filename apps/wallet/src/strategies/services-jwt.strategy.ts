import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ServicesJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class ServicesJwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.secret.servicesToken') || '',
      issuer: configService.get<string>('jwt.servicesToken.issuer') || '',
      audience: configService.get<string>('jwt.servicesToken.audience') || '',
    });
  }

  validate(payload: ServicesJwtPayload) {
    // This method is called by Passport after JWT verification
    // Return the user object that will be attached to the request
    return {
      from_service: payload.from_service,
      to_service: payload.to_service,
    };
  }

  createAuthServicesToken(): string {
    const payload: ServicesJwtPayload = {
      from_service:
        this.configService.get<string>('jwt.servicesToken.issuer') ||
        'decode-wallet-service',
      to_service:
        this.configService.get<string>('jwt.servicesToken.authAudience') ||
        'decode-auth-service',
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret.servicesToken'),
      expiresIn: this.configService.get<string>('jwt.servicesToken.expiresIn'),
      issuer: this.configService.get<string>('jwt.servicesToken.issuer'),
      audience: this.configService.get<string>(
        'jwt.servicesToken.authAudience',
      ),
    });
  }
}
