import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret.accessToken'),
            issuer: configService.get('jwt.accessToken.issuer'),
            audience: configService.get('jwt.accessToken.audience'),
        });
    }

    async validate(payload: any) {
        // This method is called by Passport after JWT verification
        // Return the user object that will be attached to the request
        return {
            userId: payload.user_id,
        };
    }

    async createAccessToken(user_id: string) {
        const payload = { user_id: user_id };
        
        return this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.secret.accessToken'),
            expiresIn: this.configService.get('jwt.accessToken.expiresIn'),
            issuer: this.configService.get('jwt.accessToken.issuer'),
            audience: this.configService.get('jwt.accessToken.audience'),
        });
    }

    async createRefreshToken(user_id: string) {
        const payload = { user_id: user_id };
        
        return this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.secret.refreshToken'),
            expiresIn: this.configService.get('jwt.refreshToken.expiresIn'),
            issuer: this.configService.get('jwt.refreshToken.issuer'),
            audience: this.configService.get('jwt.refreshToken.audience'),
        });
    }

    async validateAccessToken(token: string) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.secret.accessToken'),
                issuer: this.configService.get('jwt.accessToken.issuer'),
                audience: this.configService.get('jwt.accessToken.audience'),
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid access token');
        }
    }

    async validateRefreshToken(token: string) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.secret.refreshToken'),
                issuer: this.configService.get('jwt.refreshToken.issuer'),
                audience: this.configService.get('jwt.refreshToken.audience'),
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    extractAccessToken(req: any): string | null {
        // From Authorization header
        if (req.headers?.['authorization']?.startsWith('Bearer ')) {
            return req.headers['authorization'].split(' ')[1];
        }

        // From cookies (if using cookie-parser)
        if (req.cookies?.['accessToken']) {
            return req.cookies['accessToken'];
        }

        // From query parameters
        if (req.query?.['accessToken']) {
            return req.query['accessToken'];
        }

        return null;
    }

    extractRefreshToken(req: any): string | null {
        // From Authorization header
        if (req.headers?.['authorization']?.startsWith('Refresh ')) {
            return req.headers['authorization'].split(' ')[1];
        }

        // From cookies (if using cookie-parser)
        if (req.cookies?.['refreshToken']) {
            return req.cookies['refreshToken'];
        }

        // From query parameters
        if (req.query?.['refreshToken']) {
            return req.query['refreshToken'];
        }

        return null;
    }
}