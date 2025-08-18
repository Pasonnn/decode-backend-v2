// Modules Import
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

// Schemas Import
import { Session } from "../schemas/session.schema";

// Interfaces Import
import { SessionDoc } from "../interfaces/session.interface";

// Interfaces Import
import { Response } from "../interfaces/response.interface";

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { JwtStrategy } from '../strategies/jwt.strategy';

// Logger Import
import { Logger } from "@nestjs/common";

export class SessionService {
    private readonly logger: Logger;
    constructor(
        private readonly jwtStrategy: JwtStrategy,
        @InjectModel(Session.name) private sessionModel: Model<Session>,
        private readonly redisInfrastructure: RedisInfrastructure,
    ) {
        this.logger = new Logger(SessionService.name);
    }

    async createSession(user_id: string, device_fingerprint_id: string): Promise<Response<SessionDoc>> {
        try {
            // Generate session token
            const session_token = await this.jwtStrategy.createRefreshToken(user_id);
            // Create session
            const session = await this.sessionModel.create({
                user_id: user_id,
                device_fingerprint_id: device_fingerprint_id,
                session_token: session_token,
            });
            this.logger.log(`Session created for user ${user_id} with device fingerprint ${device_fingerprint_id}`);
            // Generate access token
            const access_token = await this.jwtStrategy.createAccessToken(user_id);
            // Return session
            return {
                success: true,
                statusCode: 200,
                message: 'Session created',
                data: { 
                    ...session.toObject(),
                    access_token,
                } as unknown as SessionDoc,
            };
        } catch (error) {
            this.logger.error(`Error creating session for user ${user_id} with device fingerprint ${device_fingerprint_id}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error creating session',
            };
        }
        
    }

    async refreshSession(session_token: string): Promise<Response<SessionDoc>> {
        try {
            // Validate session token
            const validate_session_response = await this.validateSession(session_token);
            if (!validate_session_response.success || !validate_session_response.data) {
            return validate_session_response;
            }
            // Generate new session token
            const new_session_token = await this.jwtStrategy.createRefreshToken(validate_session_response.data.user_id.toString());
            // Generate new access token
            const access_token = await this.jwtStrategy.createAccessToken(validate_session_response.data.user_id.toString());
            // Update session on database
            await this.sessionModel.updateOne({ _id: validate_session_response.data._id }, { $set: { session_token: new_session_token } });
            this.logger.log(`Session refreshed for user ${validate_session_response.data.user_id}`);
            // Return session
            return {
                success: true,
                statusCode: 200,
                message: 'Session refreshed',
                data: {
                    ...validate_session_response.data,
                    session_token: new_session_token,
                    access_token,
                } as unknown as SessionDoc,
            };
        } catch (error) {
            this.logger.error(`Error refreshing session for user ${session_token}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error refreshing session',
            };
        }
    }

    async revokeAllSessions(user_id: string): Promise<Response> {
        try {
            // Revoke all sessions
            await this.sessionModel.updateMany({ user_id: new Types.ObjectId(user_id) }, { $set: { revoked_at: new Date(), is_active: false } });
            this.logger.log(`All sessions revoked for user ${user_id}`);
            // Return response
            return {
                success: true,
                statusCode: 200,
                message: 'All sessions revoked',
            };
        } catch (error) {
            this.logger.error(`Error revoking all sessions for user ${user_id}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error revoking all sessions',
            };
        }
        
    }

    async getUserActiveSessions(user_id: string): Promise<Response<SessionDoc[]>> {
        try {
            // Get user sessions
            const sessions = await this.sessionModel.find({$and: [{ user_id: new Types.ObjectId(user_id) }, { is_active: true }, { revoked_at: null }]});
            // Return sessions
            return {
                success: true,
                statusCode: 200,
                message: 'User active sessions fetched',
                data: sessions.map(session => session.toObject()) as unknown as SessionDoc[],
            };
        } catch (error) {
            this.logger.error(`Error getting user active sessions for user ${user_id}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error getting user active sessions',
            };
        }
    }

    async cleanupExpiredSessions(user_id: string): Promise<Response> {
        try {
            // Cleanup expired sessions
            await this.sessionModel.updateMany(
                { expires_at: { $lt: new Date() }, is_active: true, revoked_at: null, user_id: user_id },
                { $set: { revoked_at: new Date(), is_active: false } }
            );
            this.logger.log(`Expired sessions cleaned up for user ${user_id}`);
            // Return response
            return {
                success: true,
                statusCode: 200,
                message: 'Expired sessions cleaned up',
            };
        } catch (error) {
            this.logger.error(`Error cleaning up expired sessions for user ${user_id}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error cleaning up expired sessions',
            };
        }
    }

    async logout(session_token: string): Promise<Response> {
        try {
            const revoke_session_response = await this.revokeSession(session_token);
            if (!revoke_session_response.success || !revoke_session_response.data) {
                return revoke_session_response;
            }
            return {
                success: revoke_session_response.success,
                statusCode: revoke_session_response.statusCode,
                message: revoke_session_response.message,
            };   
        } catch (error) {
            this.logger.error(`Error logging out for ${session_token}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error logging out',
            };
        }
    }

    async validateAccess(access_token: string): Promise<Response> {
        try {
            // Validate access token
            const validate_access_token_response = await this.jwtStrategy.validateAccessToken(access_token);
            if (!validate_access_token_response.success) {
                return validate_access_token_response;
            }
            // Return response
            return {
                success: true,
                statusCode: 200,
                message: 'Access token validated',
                data: validate_access_token_response.data,
            };
        } catch (error) {
            this.logger.error(`Error validating access token for ${access_token}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error validating access token',
            };
        }
    }

    async createSsoToken(user_id: string): Promise<Response> {
        try {
            // Create sso token
            const sso_token = uuidv4().slice(0, 6);
            // Store sso token in redis
            await this.redisInfrastructure.set(`sso:${sso_token}`, user_id, 60);
            // Return response
            return {
                success: true,
                statusCode: 200,
                message: 'SSO token created',
                data: sso_token,
            };
        } catch (error) {
            this.logger.error(`Error creating SSO token for user ${user_id}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error creating SSO token',
            };
        }
    }

    async validateSsoToken(sso_token: string): Promise<Response> {
        try {
            // Validate sso token
            const sso_token_response = await this.redisInfrastructure.get(`sso:${sso_token}`);
            if (!sso_token_response) {
                return {
                    success: false,
                    statusCode: 401,
                    message: 'SSO token expired',
                };
            }
            const user_id = sso_token_response;
            // Generate session token
            const session_token = await this.jwtStrategy.createRefreshToken(user_id);
            // Delete sso token from redis
            await this.redisInfrastructure.del(`sso:${sso_token}`);
            // Return response
            return {
                success: true,
                statusCode: 200,
                message: 'SSO token validated',
                data: {
                    session_token,
                    user_id,
                },
            };
        } catch (error) {
            this.logger.error(`Error validating SSO token for ${sso_token}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error validating SSO token',
            };
        }
    }

    private async validateSession(session_token: string): Promise<Response<SessionDoc>> {
        try {
            // Validate session token
            const validate_session_token_response = await this.jwtStrategy.validateRefreshToken(session_token);
            if (!validate_session_token_response.success) {
                return validate_session_token_response;
            }
            // Validate session token
            const session = await this.sessionModel.findOne({ $and: [{ session_token: session_token }, { is_active: true }] });
            if (!session) {
                return {
                    success: false,
                    statusCode: 401,
                    message: 'Invalid session token',
                };
            }
            // Check if session is expired
            if (session.expires_at < new Date()) {
                return {
                    success: false,
                    statusCode: 401,
                    message: 'Session expired',
                };
            }
            // Check if session is revoked
            if (session.revoked_at || !session.is_active) {
                return {
                    success: false,
                    statusCode: 401,
                    message: 'Session revoked',
                };
            }
            // Get user id from session
            const user_id = session.user_id.toString();
            return {
                success: true,
                statusCode: 200,
                message: 'Session valid',
                data: {
                    ...session.toObject(),
                } as unknown as SessionDoc,
            };
        } catch (error) {
            this.logger.error(`Error validating session for token ${session_token}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error validating session',
            };
        }
    }

    private async revokeSession(session_token: string): Promise<Response> {
        try {
            // Validate session token
            const validate_session_response = await this.validateSession(session_token);
            if (!validate_session_response.success || !validate_session_response.data) {
                return validate_session_response;
            }
            // Revoke session
            await this.sessionModel.updateOne({ _id: validate_session_response.data._id }, { $set: { revoked_at: new Date(), is_active: false } });
            this.logger.log(`Session revoked for user ${validate_session_response.data.user_id}`);
            // Return response
            return {
                success: true,
                statusCode: 200,
                message: 'Session revoked',
            };
        } catch (error) {
            this.logger.error(`Error revoking session for user ${session_token}`, error);
            return {
                success: false,
                statusCode: 500,
                message: 'Error revoking session',
            };
        }
        
    }
}