import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ServicesJwtPayload } from '../interfaces/jwt-payload.interface';
import { Response } from '../interfaces/response.interface';

@Injectable()
export class ServicesJwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly service_name: string = configService.get<string>(
      'jwt.services.auth',
    ) || 'auth',
  ) {}

  validate(payload: ServicesJwtPayload) {
    // This method is called by Passport after JWT verification
    // Return the user object that will be attached to the request
    return {
      service: payload.service,
    };
  }

  createUserServicesToken(service: string): string {
    const payload: ServicesJwtPayload = { service: service };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret.servicesToken'),
      expiresIn: this.configService.get<string>('jwt.servicesToken.expiresIn'),
      issuer: this.configService.get<string>('jwt.servicesToken.issuer'),
      audience: this.configService.get<string>(
        'jwt.servicesToken.userAudience',
      ),
    });
  }

  validateWalletServicesToken(
    services_token: string,
  ): Response<ServicesJwtPayload> {
    try {
      const payload = this.jwtService.verify<ServicesJwtPayload>(
        services_token,
        {
          secret: this.configService.get<string>('jwt.secret.servicesToken'),
          issuer: this.configService.get<string>(
            'jwt.servicesToken.walletIssuer',
          ),
          audience: this.configService.get<string>(
            'jwt.servicesToken.audience',
          ),
        },
      );
      if (payload.service != this.service_name) {
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
