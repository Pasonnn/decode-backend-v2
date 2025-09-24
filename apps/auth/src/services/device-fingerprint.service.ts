import {
  Inject,
  Injectable,
  Logger,
  HttpStatus,
  forwardRef,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import
import { DeviceFingerprint } from '../schemas/device-fingerprint.schema';

// Interfaces Import
import { Response } from '../interfaces/response.interface';
import { DeviceFingerprintDoc } from '../interfaces/device-fingerprint-doc.interface';
import { SessionDoc } from '../interfaces/session-doc.interface';

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { UserServiceClient } from '../infrastructure/external-services/auth-service.client';

// Services Import
import { InfoService } from './info.service';
import { SessionService } from './session.service';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';
import { UserDoc } from '../interfaces/user-doc.interface';

@Injectable()
export class DeviceFingerprintService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(DeviceFingerprint.name)
    private deviceFingerprintModel: Model<DeviceFingerprint>,
    private readonly redisInfrastructure: RedisInfrastructure,
    @Inject(forwardRef(() => InfoService))
    private readonly infoService: InfoService,
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
    private readonly userServiceClient: UserServiceClient,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
  ) {
    this.logger = new Logger(DeviceFingerprintService.name);
  }

  async getDeviceFingerprints(input: {
    user_id: string;
  }): Promise<Response<DeviceFingerprintDoc<SessionDoc>[]>> {
    const { user_id } = input;
    const device_fingerprints = await this.deviceFingerprintModel.find({
      $and: [{ user_id: new Types.ObjectId(user_id) }, { is_trusted: true }],
    });
    if (!device_fingerprints) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    const get_user_active_sessions_response =
      await this.sessionService.getUserActiveSessions(user_id);
    const sessions = get_user_active_sessions_response.data;
    if (!sessions) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.SESSION.USER_ACTIVE_SESSIONS_FETCHING_ERROR,
      };
    }
    // Get all fingerprints and sessions, try to match them (fingerprint._id = session.device_fingerprint_id)
    const device_fingerprints_with_sessions = device_fingerprints.map(
      (fingerprint) => ({
        ...fingerprint.toObject(),
        sessions: [] as SessionDoc[],
      }),
    );
    for (const fingerprint of device_fingerprints_with_sessions) {
      const session = sessions.filter(
        (session) =>
          session.device_fingerprint_id.toString() == fingerprint._id,
      );
      if (session) {
        fingerprint.sessions = session;
      }
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_FETCHED,
      data: device_fingerprints_with_sessions as unknown as DeviceFingerprintDoc<SessionDoc>[],
    } as Response<DeviceFingerprintDoc<SessionDoc>[]>;
  }

  async getDeviceFingerprint(input: {
    fingerprint_hashed: string;
    user_id: string;
  }): Promise<Response<DeviceFingerprintDoc>> {
    const { fingerprint_hashed, user_id } = input;
    const device_fingerprint = await this.deviceFingerprintModel.findOne({
      $and: [{ fingerprint_hashed }, { user_id: new Types.ObjectId(user_id) }],
    });
    if (!device_fingerprint) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_FETCHED,
      data: device_fingerprint as unknown as DeviceFingerprintDoc,
    };
  }

  async revokeDeviceFingerprint(input: {
    device_fingerprint_id: string;
    user_id: string;
  }): Promise<Response> {
    const { device_fingerprint_id, user_id } = input;
    try {
      const device_fingerprint = (await this.deviceFingerprintModel.findOne({
        $and: [
          { _id: new Types.ObjectId(device_fingerprint_id) },
          { user_id: new Types.ObjectId(user_id) },
          { is_trusted: true },
        ],
      })) as DeviceFingerprintDoc;
      if (!device_fingerprint) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
        };
      }
      await this.deviceFingerprintModel.updateOne(
        { _id: device_fingerprint._id },
        { $set: { is_trusted: false } },
      );
      const revoke_session_response =
        await this.sessionService.revokeSessionByDeviceFingerprintId(
          device_fingerprint._id.toString(),
        );
      if (!revoke_session_response.success) {
        return revoke_session_response;
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_REVOKED,
      };
    } catch (error) {
      this.logger.error(
        `Error revoking device fingerprint for ${device_fingerprint_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DEVICE_FINGERPRINT.REVOKING_FAILED,
      };
    }
  }

  async verifyDeviceFingerprintEmailVerification(input: {
    email_verification_code: string;
  }): Promise<Response> {
    const { email_verification_code } = input;
    try {
      this.logger.log(
        `Verify device fingerprint email verification request received for ${email_verification_code}`,
      );
      const validateDeviceFingerprintEmailVerificationResponse =
        await this.validateDeviceFingerprintEmailVerification({
          email_verification_code,
        });
      if (
        !validateDeviceFingerprintEmailVerificationResponse.success ||
        !validateDeviceFingerprintEmailVerificationResponse.data
      ) {
        return validateDeviceFingerprintEmailVerificationResponse;
      }
      this.logger.log(
        `Device fingerprint verification successful for ${email_verification_code}`,
      );
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_VERIFIED,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying device fingerprint email verification for ${email_verification_code}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DEVICE_FINGERPRINT.VERIFICATION_FAILED,
      };
    }
  }

  async resendDeviceFingerprintEmailVerification(input: {
    email_or_username: string;
    fingerprint_hashed: string;
  }): Promise<Response> {
    const { email_or_username, fingerprint_hashed } = input;
    try {
      this.logger.log(
        `Resend device fingerprint email verification request received for ${email_or_username}`,
      );
      // Get User Data
      const getUserInfoResponse =
        await this.infoService.getUserInfoByEmailOrUsername(email_or_username);
      if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
        return getUserInfoResponse;
      }
      // Send Device Fingerprint Email Verification
      const sendDeviceFingerprintEmailVerificationResponse =
        await this.sendDeviceFingerprintEmailVerification({
          user_id: getUserInfoResponse.data._id,
          fingerprint_hashed,
        });
      if (!sendDeviceFingerprintEmailVerificationResponse.success) {
        return sendDeviceFingerprintEmailVerificationResponse;
      }
      return sendDeviceFingerprintEmailVerificationResponse;
    } catch (error) {
      this.logger.error(
        `Error resending device fingerprint email verification for ${email_or_username}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DEVICE_FINGERPRINT.VERIFICATION_FAILED,
      };
    }
  }

  async checkDeviceFingerprint(input: {
    user_id: string;
    fingerprint_hashed: string;
  }): Promise<Response<DeviceFingerprintDoc>> {
    const { user_id, fingerprint_hashed } = input;
    // Check if device fingerprint is correct
    const user_id_object = new Types.ObjectId(user_id);
    const device_fingerprint = await this.deviceFingerprintModel.findOne({
      $and: [
        { user_id: user_id_object },
        { fingerprint_hashed: fingerprint_hashed },
      ],
    });
    if (!device_fingerprint || device_fingerprint.is_trusted === false) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_VERIFIED,
      data: device_fingerprint as unknown as DeviceFingerprintDoc,
    };
  }

  async createDeviceFingerprint(input: {
    user_id: string;
    fingerprint_hashed: string;
    browser: string;
    device: string;
  }): Promise<Response<DeviceFingerprintDoc>> {
    const { user_id, fingerprint_hashed, browser, device } = input;
    const user_id_object = new Types.ObjectId(user_id);
    // Check if device fingerprint already exists
    let device_fingerprint = await this.deviceFingerprintModel.findOne({
      $and: [
        { user_id: user_id_object },
        { fingerprint_hashed: fingerprint_hashed },
      ],
    });
    if (!device_fingerprint) {
      device_fingerprint = await this.deviceFingerprintModel.create({
        user_id: user_id_object,
        fingerprint_hashed: fingerprint_hashed,
        browser: browser,
        device: device,
        is_trusted: AUTH_CONSTANTS.DEVICE_FINGERPRINT.TRUSTED_BY_DEFAULT,
      });
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_CREATED,
      data: device_fingerprint as unknown as DeviceFingerprintDoc,
    };
  }

  async createTrustedDeviceFingerprint(input: {
    user_id: string;
    fingerprint_hashed: string;
    browser: string;
    device: string;
  }): Promise<Response<DeviceFingerprintDoc>> {
    const { user_id, fingerprint_hashed, browser, device } = input;
    try {
      // Find any existing device fingerprint
      const existing_untrusted_device_fingerprint =
        await this.deviceFingerprintModel.findOne({
          $and: [
            { user_id: new Types.ObjectId(user_id) },
            { fingerprint_hashed: fingerprint_hashed },
            { is_trusted: false },
          ],
        });
      if (existing_untrusted_device_fingerprint) {
        // Edit the is_trusted to true
        existing_untrusted_device_fingerprint.is_trusted = true;
        await existing_untrusted_device_fingerprint.save();
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_CREATED,
          data: existing_untrusted_device_fingerprint as DeviceFingerprintDoc,
        };
      }
      const device_fingerprint = await this.deviceFingerprintModel.create({
        user_id: new Types.ObjectId(user_id),
        fingerprint_hashed: fingerprint_hashed,
        browser: browser,
        device: device,
        is_trusted: true,
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_CREATED,
        data: device_fingerprint as DeviceFingerprintDoc,
      };
    } catch (error) {
      this.logger.error(
        `Error creating trusted device fingerprint for ${user_id}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DEVICE_FINGERPRINT.CREATION_FAILED,
      };
    }
  }

  async sendDeviceFingerprintEmailVerification(input: {
    user_id: string;
    fingerprint_hashed: string;
  }): Promise<Response> {
    const { user_id, fingerprint_hashed } = input;
    // Send device fingerprint email verification
    const device_fingerprint_email_verification =
      await this.deviceFingerprintModel.findOne({
        $and: [
          { user_id: user_id },
          { fingerprint_hashed: fingerprint_hashed },
        ],
      });
    if (!device_fingerprint_email_verification) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    // Get user email
    const fingerprint_user_id =
      device_fingerprint_email_verification.user_id.toString();
    const user_info_response = await this.userServiceClient.getInfoByUserId({
      user_id: fingerprint_user_id,
    });
    if (!user_info_response.success) {
      return user_info_response;
    }
    const user = user_info_response.data as UserDoc;
    if (!user) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    // Send email verification code to user
    const email_verification_code = uuidv4().slice(
      0,
      AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH,
    );
    // Store email verification code with email in Redis
    const fingerprint_email_verification_code_key = `${AUTH_CONSTANTS.REDIS.KEYS.FINGERPRINT_VERIFICATION}:${email_verification_code}`;
    const fingerprint_email_verification_code_value = {
      user_id: fingerprint_user_id,
      fingerprint_hashed: fingerprint_hashed,
    };
    await this.redisInfrastructure.set(
      fingerprint_email_verification_code_key,
      JSON.stringify(fingerprint_email_verification_code_value),
      AUTH_CONSTANTS.REDIS.FINGERPRINT_VERIFICATION_EXPIRES_IN,
    );
    // Send email verification code to user
    this.deviceFingerprintEmailVerification({
      email: user.email,
      email_verification_code,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
    };
  }

  deviceFingerprintEmailVerification(input: {
    email: string;
    email_verification_code: string;
  }): void {
    const { email, email_verification_code } = input;
    // Send welcome email to user
    this.emailService.emit('email_request', {
      type: AUTH_CONSTANTS.EMAIL.TYPES.FINGERPRINT_VERIFY,
      data: {
        email: email,
        otpCode: email_verification_code,
      },
    });
  }

  async validateDeviceFingerprintEmailVerification(input: {
    email_verification_code: string;
  }): Promise<Response> {
    const { email_verification_code } = input;
    // Validate device fingerprint email verification
    const device_fingerprint_data = (await this.redisInfrastructure.get(
      `${AUTH_CONSTANTS.REDIS.KEYS.FINGERPRINT_VERIFICATION}:${email_verification_code}`,
    )) as {
      user_id: string;
      fingerprint_hashed: string;
    };
    console.log(device_fingerprint_data);
    if (!device_fingerprint_data) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.EMAIL_VERIFICATION.INVALID_CODE,
      };
    }

    // Find device fingerprint in database
    const user_id = new Types.ObjectId(device_fingerprint_data.user_id);
    const device_fingerprint = await this.deviceFingerprintModel.findOne({
      $and: [
        { user_id: user_id },
        { fingerprint_hashed: device_fingerprint_data.fingerprint_hashed },
      ],
    });
    if (!device_fingerprint) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    // Update device fingerprint to trusted
    device_fingerprint.is_trusted = true;
    await device_fingerprint.save();
    // Delete email verification code from Redis
    await this.redisInfrastructure.del(
      `${AUTH_CONSTANTS.REDIS.KEYS.FINGERPRINT_VERIFICATION}:${email_verification_code}`,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_VERIFIED,
      data: device_fingerprint as unknown as DeviceFingerprintDoc,
    };
  }
}
