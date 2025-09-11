import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { SessionService } from './session.service';
import { DeviceFingerprintDoc } from '../interfaces/device-fingerprint-doc.interface';
import { Response } from '../interfaces/response.interface';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';
import { v4 as uuidv4 } from 'uuid';
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { DeviceFingerprintService } from './device-fingerprint.service';

@Injectable()
export class SsoService {
  private readonly logger: Logger;

  constructor(
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly sessionService: SessionService,
  ) {
    this.logger = new Logger(SsoService.name);
  }

  async createSsoToken(input: {
    user_id: string;
    app: string;
    fingerprint_hashed: string;
  }): Promise<Response> {
    const { user_id, app, fingerprint_hashed } = input;
    try {
      // Get device fingerprint
      const get_device_fingerprint_response =
        (await this.deviceFingerprintService.getDeviceFingerprint({
          fingerprint_hashed,
          user_id,
        })) as unknown as Response<DeviceFingerprintDoc>;
      if (
        !get_device_fingerprint_response.success ||
        !get_device_fingerprint_response.data
      ) {
        return get_device_fingerprint_response;
      }
      const device_fingerprint_id =
        get_device_fingerprint_response.data._id.toString();
      // Create sso token
      const sso_token = uuidv4().slice(0, 6);
      // Build sso info
      const sso_key = `sso:${sso_token}`;
      const sso_value = JSON.stringify({
        user_id,
        app,
        device_fingerprint_id,
      });
      // Store sso token in redis
      await this.redisInfrastructure.set(
        sso_key,
        sso_value,
        AUTH_CONSTANTS.REDIS.SSO_TOKEN_EXPIRES_IN,
      );
      // Return response
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SSO_TOKEN_CREATED,
        data: sso_token,
      };
    } catch (error) {
      this.logger.error(`Error creating SSO token for user ${user_id}`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SSO_TOKEN_CREATION_ERROR,
      };
    }
  }

  async validateSsoToken(input: { sso_token: string }): Promise<Response> {
    const { sso_token } = input;
    try {
      // Validate sso token
      const sso_key = `sso:${sso_token}`;
      const sso_value = (await this.redisInfrastructure.get(sso_key)) as {
        user_id: string;
        app: string;
        device_fingerprint_id: string;
      };
      if (!sso_value) {
        return {
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: MESSAGES.SESSION.SSO_TOKEN_INVALID,
        };
      }
      const user_id = sso_value.user_id;
      const app = sso_value.app;
      const device_fingerprint_id = sso_value.device_fingerprint_id;
      // Delete sso token from redis
      await this.redisInfrastructure.del(sso_key);
      // Create session
      const create_session_response = await this.sessionService.createSession({
        user_id,
        device_fingerprint_id,
        app,
      });
      if (!create_session_response.success) {
        return create_session_response;
      }
      // Return response
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SSO_TOKEN_VALIDATED,
        data: create_session_response.data,
      };
    } catch (error) {
      this.logger.error(`Error validating SSO token for ${sso_token}`, error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SESSION.SSO_TOKEN_VALIDATION_ERROR,
      };
    }
  }
}
