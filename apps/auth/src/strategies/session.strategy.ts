import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from '../config/jwt.config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwt.secret.refreshToken,
            issuer: jwt.refreshToken.issuer,
            audience: jwt.refreshToken.audience,
        });
    }

    async createRefreshToken(user: {id: string, username: string, email: string}) {
        const payload = { user_id: user.id, username: user.username, email: user.email };
        const refreshToken = jwt.sign(payload, jwt.secret.refreshToken, {
            expiresIn: jwt.refreshToken.expiresIn,
            algorithm: jwt.refreshToken.algorithm,
            issuer: jwt.refreshToken.issuer,
            audience: jwt.refreshToken.audience,
        });
        return refreshToken;
    }

    async validateRefreshToken(req: any) {
        try {
            const refreshToken = this.extractRefreshToken(req);
            if (!refreshToken) {
                throw new UnauthorizedException('No refresh token provided');
            }
            const payload = jwt.verify(refreshToken, jwt.secret.refreshToken, {
                issuer: jwt.refreshToken.issuer,
                audience: jwt.refreshToken.audience,
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async extractRefreshToken(req: Request) {
        if (req.headers?.['authorization']?.startsWith('Session ')) {
            return req.headers['authorization'].split(' ')[1];
        }

        if (req.cookies?.['refreshToken']) {
            return req.cookies['refreshToken'];
        }

        if (req.query?.['refreshToken']) {
            return req.query['refreshToken'];
        }

        return null;
    }
}
