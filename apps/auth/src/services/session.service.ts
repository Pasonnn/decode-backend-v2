// Modules Import
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas Import
import { Session } from '../schemas/session.schema';

// Interfaces Import
import { SessionDoc } from '../interfaces/session-doc.interface';

// Interfaces Import
import { Response } from '../interfaces/response.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Infrastructure and Strategies Import
import { JwtStrategy } from '../strategies/jwt.strategy';
import { SessionStrategy } from '../strategies/session.strategy';

// Logger Import
import { Logger } from '@nestjs/common';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';

@Injectable()
export class SessionService {
  private readonly logger: Logger;
  constructor(
    private readonly jwtStrategy: JwtStrategy,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly sessionStrategy: SessionStrategy,
  ) {
    this.logger = new Logger(SessionService.name);
  }

  async createSession(input: {
    user_id: string;
    device_fingerprint_id: string;
    app: string;
  }): Promise<Response<SessionDoc>> {
    const { user_id, device_fingerprint_id, app } = input;
    try {
      // Generate session token
      const session_token = this.sessionStrategy.createRefreshToken(user_id);
      // Create session
      const session = await this.sessionModel.create({
        user_id: new Types.ObjectId(user_id),
        device_fingerprint_id: new Types.ObjectId(device_fingerprint_id),
        session_token: session_token,
        app,
        expires_at: new Date(
          Date.now() + AUTH_CONSTANTS.SESSION.EXPIRES_IN_HOURS * 60 * 60 * 1000,
        ),
        is_active: true,
      });

      this.logger.log(
        `Session created for user ${user_id} with device fingerprint ${device_fingerprint_id}`,
      );
      // Generate access token
      const access_token = this.jwtStrategy.createAccessToken(
        user_id,
        session.session_token,
      );
      // Return session
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SESSION_CREATED,
        data: {
          ...session.toObject(),
          access_token,
        } as unknown as SessionDoc,
      };
    } catch (error) {
      this.logger.error(
        `Error creating session for user ${user_id} with device fingerprint ${device_fingerprint_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SESSION_CREATION_ERROR,
      };
    }
  }

  async refreshSession(session_token: string): Promise<Response> {
    try {
      // Validate session token
      const validate_session_response =
        await this.validateSession(session_token);
      if (
        !validate_session_response.success ||
        !validate_session_response.data
      ) {
        return validate_session_response;
      }
      // Generate new session token
      const new_session_token = this.sessionStrategy.createRefreshToken(
        validate_session_response.data.user_id.toString(),
      );
      // Generate new access token
      const access_token = this.jwtStrategy.createAccessToken(
        validate_session_response.data.user_id.toString(),
        new_session_token,
      );
      // Update session on database
      await this.sessionModel.updateOne(
        { session_token: session_token },
        {
          $set: {
            session_token: new_session_token,
            last_used_at: new Date(),
          },
        },
      );
      this.logger.log(
        `Session refreshed for user ${validate_session_response.data.user_id.toString()}`,
      );
      // Find the session data again
      const session = await this.sessionModel.findOne({
        session_token: new_session_token,
      });
      // Return session
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SESSION_REFRESHED,
        data: {
          session: session as unknown as SessionDoc,
          access_token,
        } as unknown as SessionDoc,
      };
    } catch (error) {
      this.logger.error(`Error refreshing session for token`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SESSION_REFRESH_ERROR,
      };
    }
  }

  async revokeSessionBySessionId(session_id: string): Promise<Response> {
    try {
      await this.sessionModel.updateOne(
        { _id: new Types.ObjectId(session_id) },
        { $set: { revoked_at: new Date(), is_active: false } },
      );
      this.logger.log(`Session revoked for session ${session_id}`);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SESSION_REVOKED,
      };
    } catch (error) {
      this.logger.error(
        `Error revoking session for session ${session_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SESSION_REVOKING_ERROR,
      };
    }
  }

  async revokeSessionByDeviceFingerprintId(
    device_fingerprint_id: string,
  ): Promise<Response> {
    try {
      await this.sessionModel.updateMany(
        { device_fingerprint_id: new Types.ObjectId(device_fingerprint_id) },
        { $set: { revoked_at: new Date(), is_active: false } },
      );
      this.logger.log(
        `Sessions revoked by device fingerprint ${device_fingerprint_id}`,
      );
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SESSIONS_REVOKED,
      };
    } catch (error) {
      this.logger.error(
        `Error revoking sessions for device fingerprint ${device_fingerprint_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SESSION_REVOKING_ERROR,
      };
    }
  }

  async getUserActiveSessions(
    user_id: string,
  ): Promise<Response<SessionDoc[]>> {
    try {
      // Get user sessions
      const sessions = await this.sessionModel.find({
        $and: [
          { user_id: new Types.ObjectId(user_id) },
          { is_active: true },
          { revoked_at: null },
        ],
      });
      // Return sessions
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_ACTIVE_SESSIONS_FETCHED,
        data: sessions.map((session) =>
          session.toObject(),
        ) as unknown as SessionDoc[],
      };
    } catch (error) {
      this.logger.error(
        `Error getting user active sessions for user ${user_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.USER_ACTIVE_SESSIONS_FETCHING_ERROR,
      };
    }
  }

  async cleanupExpiredSessions(user_id: string): Promise<Response> {
    try {
      // Cleanup expired sessions
      await this.sessionModel.updateMany(
        {
          expires_at: { $lt: new Date() },
          is_active: true,
          revoked_at: null,
          user_id: user_id,
        },
        { $set: { revoked_at: new Date(), is_active: false } },
      );
      this.logger.log(`Expired sessions cleaned up for user ${user_id}`);
      // Return response
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EXPIRED_SESSIONS_CLEANED_UP,
      };
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired sessions for user ${user_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.EXPIRED_SESSIONS_CLEANING_ERROR,
      };
    }
  }

  async logout(session_token: string): Promise<Response> {
    try {
      const revoke_session_response = await this.revokeSession({
        session_token: session_token,
      });
      if (!revoke_session_response.success) {
        return revoke_session_response;
      }
      return {
        success: revoke_session_response.success,
        statusCode: revoke_session_response.statusCode,
        message: revoke_session_response.message,
      };
    } catch (error) {
      this.logger.error(`Error logging out session`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.LOGOUT_ERROR,
      };
    }
  }

  async validateAccess(access_token: string): Promise<Response<JwtPayload>> {
    try {
      // Validate access token
      const validate_access_token_response =
        this.jwtStrategy.validateAccessToken(access_token);
      if (
        !validate_access_token_response.success ||
        !validate_access_token_response.data
      ) {
        return validate_access_token_response;
      }
      // Check if session is active
      const session = await this.sessionModel.findOne({
        $and: [
          { session_token: validate_access_token_response.data.session_token },
          { is_active: true },
        ],
      });
      if (!session) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SESSION_NOT_FOUND,
        };
      }
      // Check if session is expired
      if (session.expires_at < new Date()) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SESSION_EXPIRED,
        };
      }
      // Check if session is revoked
      if (session.revoked_at || !session.is_active) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SESSION_REVOKED,
        };
      }
      // Check if session is valid
      if (session.expires_at < new Date()) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SESSION_EXPIRED,
        };
      }
      // Return response
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.ACCESS_TOKEN_VALIDATED,
        data: validate_access_token_response.data,
      };
    } catch (error) {
      this.logger.error(`Error validating access token`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.ACCESS_TOKEN_VALIDATION_ERROR,
      };
    }
  }

  async validateSession(session_token: string): Promise<Response<JwtPayload>> {
    try {
      // Validate session token
      const validate_session_token_response =
        this.sessionStrategy.validateRefreshToken(session_token);
      if (!validate_session_token_response.success) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.INVALID_SESSION_TOKEN,
        };
      }
      // Validate session token
      const session = await this.sessionModel.findOne({
        $and: [{ session_token: session_token }, { is_active: true }],
      });
      if (!session) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.INVALID_SESSION_TOKEN,
        };
      }
      // Check if session is expired
      if (session.expires_at < new Date()) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SESSION_EXPIRED,
        };
      }
      // Check if session is revoked
      if (session.revoked_at || !session.is_active) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SESSION_REVOKED,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SESSION_VALID,
        data: session as unknown as JwtPayload,
      };
    } catch (error) {
      this.logger.error(`Error validating session for token`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SESSION_VALIDATION_ERROR,
      };
    }
  }

  private async revokeSession(input: {
    session_token: string;
  }): Promise<Response> {
    const { session_token } = input;
    try {
      // Validate session token
      const validate_session_response =
        await this.validateSession(session_token);
      if (!validate_session_response.success) {
        return validate_session_response;
      }
      // Revoke session
      await this.sessionModel.updateOne(
        { session_token: session_token },
        { $set: { revoked_at: new Date(), is_active: false } },
      );
      // Find revoked session
      const revoked_session = await this.sessionModel.findOne({
        session_token: session_token,
      });
      if (!revoked_session) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: MESSAGES.SESSION.SESSION_NOT_FOUND,
        };
      }
      this.logger.log(
        `Session revoked for session ${revoked_session.session_token}`,
      );
      // Return response
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SESSION_REVOKED,
        data: revoked_session as unknown as SessionDoc,
      };
    } catch (error) {
      this.logger.error(`Error revoking session`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SESSION_REVOKING_ERROR,
      };
    }
  }
}
