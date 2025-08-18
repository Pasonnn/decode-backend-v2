import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret.sessionToken'),
            issuer: configService.get('jwt.sessionToken.issuer'),
            audience: configService.get('jwt.sessionToken.audience'),
        });
    }

    async createRefreshToken(user_id: string) {
        const payload = { user_id };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.secret.sessionToken'),
            expiresIn: this.configService.get('jwt.sessionToken.expiresIn'),
            issuer: this.configService.get('jwt.sessionToken.issuer'),
            audience: this.configService.get('jwt.sessionToken.audience'),
        });
    }

    async validateRefreshToken(req: any) {
        try {
            // extract token from header
            const token = this.extractRefreshToken(req);
            if (!token) {
                throw new UnauthorizedException('No refresh token provided');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.secret.sessionToken'),
                issuer: this.configService.get('jwt.sessionToken.issuer'),
                audience: this.configService.get('jwt.sessionToken.audience'),
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    extractRefreshToken(req: any): string | null {
        // From Authorization header
        if (req.headers?.['authorization']?.startsWith('Session ')) {
            return req.headers['authorization'].split(' ')[1];
        }

        // From cookies (if using cookie-parser)
        if (req.cookies?.['sessionToken']) {
            return req.cookies['sessionToken'];
        }

        // From query parameters
        if (req.query?.['sessionToken']) {
            return req.query['sessionToken'];
        }

        return null;
    }
}
