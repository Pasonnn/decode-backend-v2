import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ServicesJwtPayload } from '../interfaces/jwt-payload.interface';
import { Response } from '../interfaces/response.interface';

@Injectable()
export class ServicesJwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(ServicesJwtStrategy.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
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

  validateAuthServicesToken(
    services_token: string,
  ): Response<ServicesJwtPayload> {
    try {
      const payload = this.jwtService.verify<ServicesJwtPayload>(
        services_token,
        {
          secret: this.configService.get<string>('jwt.secret.servicesToken'),
          issuer: this.configService.get<string>(
            'jwt.servicesToken.authIssuer',
          ),
          audience: this.configService.get<string>(
            'jwt.servicesToken.audience',
          ),
        },
      );
      if (
        payload.from_service !=
          (this.configService.get<string>('jwt.servicesToken.authIssuer') ||
            'decode-auth-service') ||
        payload.to_service !=
          (this.configService.get<string>('jwt.servicesToken.audience') ||
            'decode-user-service')
      ) {
        return {
          success: false,
          statusCode: 401,
          message: 'Invalid services token',
        };
      }
      this.logger.log(`Services token validated successfully`);
      return {
        success: true,
        statusCode: 200,
        message: 'Services token validated',
        data: payload,
      };
    } catch {
      return {
        success: false,
        statusCode: 401,
        message: 'Invalid services token',
      };
    }
  }
}
