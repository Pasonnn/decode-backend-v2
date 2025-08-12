import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { jwt } from '../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwt.secret.accessToken,
            issuer: jwt.accessToken.issuer,
            audience: jwt.accessToken.audience,
        });
    }

    async createAccessToken(user: {id: string, username: string, email: string}) {
        const payload = { user_id: user.id, username: user.username, email: user.email };
        const accessToken = jwt.sign(payload, jwt.secret.accessToken, {
            expiresIn: jwt.accessToken.expiresIn,
            algorithm: jwt.accessToken.algorithm,
            issuer: jwt.accessToken.issuer,
            audience: jwt.accessToken.audience,
        });
        return accessToken;
    }

    async validateAccessToken(req: any) {
        try {
            const accessToken = this.extractAccessToken(req);
            if (!accessToken) {
                throw new UnauthorizedException('No access token provided');
            }
            const payload = jwt.verify(accessToken, jwt.secret.accessToken, {
                issuer: jwt.accessToken.issuer,
                audience: jwt.accessToken.audience,
            });
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid access token');
        }
    }

    async extractAccessToken(req: any) {
        if (req.headers?.['authorization']?.startsWith('Bearer ')) {
            return req.headers['authorization'].split(' ')[1];
        }

        if (req.cookies?.['accessToken']) {
            return req.cookies['accessToken'];
        }

        if (req.query?.['accessToken']) {
            return req.query['accessToken'];
        }

        return null;
    }
}