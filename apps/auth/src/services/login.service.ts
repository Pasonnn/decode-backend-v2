import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import
import { User } from '../schemas/user.schema';
import { DeviceFingerprint } from '../schemas/device-fingerprint.schema';

// Interfaces Import
import { Response } from '../interfaces/response.interface';
import { DeviceFingerprintDoc } from '../interfaces/device-fingerprint-doc.interface';
import { SessionDoc } from '../interfaces/session-doc.interface';

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

// Services Import
import { SessionService } from './session.service';
import { InfoService } from './info.service';
import { PasswordService } from './password.service';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';

@Injectable()
export class LoginService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(DeviceFingerprint.name)
    private deviceFingerprintModel: Model<DeviceFingerprint>,
    private readonly sessionService: SessionService,
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly infoService: InfoService,
    private readonly passwordService: PasswordService,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
  ) {
    this.logger = new Logger(LoginService.name);
  }

  // login/
  async login(
    email_or_username: string,
    password: string,
    fingerprint_hashed: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Login request received for ${email_or_username}`);
      const getUserInfoResponse =
        await this.infoService.getUserInfoByEmailOrUsername(email_or_username);
      if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
        return getUserInfoResponse;
      }
      const checkPasswordResponse = this.passwordService.checkPassword(
        password,
        getUserInfoResponse.data.password_hashed,
      );
      if (!checkPasswordResponse.success) {
        return checkPasswordResponse;
      }
      const checkDeviceFingerprintResponse = await this.checkDeviceFingerprint(
        getUserInfoResponse.data._id,
        fingerprint_hashed,
      );
      if (
        !checkDeviceFingerprintResponse.success ||
        !checkDeviceFingerprintResponse.data
      ) {
        // Device fingerprint not trusted
        this.logger.log(
          `Device fingerprint not trusted for ${email_or_username}`,
        );
        const createDeviceFingerprintResponse =
          await this.createDeviceFingerprint(
            getUserInfoResponse.data._id,
            fingerprint_hashed,
          );
        if (!createDeviceFingerprintResponse.success) {
          this.logger.error(
            `Cannot create device fingerprint for ${email_or_username}`,
          );
          return createDeviceFingerprintResponse;
        }
        const sendDeviceFingerprintEmailVerificationResponse =
          await this.sendDeviceFingerprintEmailVerification(
            getUserInfoResponse.data._id,
            fingerprint_hashed,
          );
        if (!sendDeviceFingerprintEmailVerificationResponse.success) {
          this.logger.error(
            `Cannot send device fingerprint email verification for ${email_or_username}`,
          );
          return sendDeviceFingerprintEmailVerificationResponse;
        }
        this.logger.log(
          `Device fingerprint email verification sent for ${email_or_username}`,
        );
        return {
          success: true,
          statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
          message: MESSAGES.AUTH.DEVICE_FINGERPRINT_NOT_TRUSTED,
        };
      } else {
        // Device fingerprint trusted
        this.logger.log(`Device fingerprint trusted for ${email_or_username}`);
        const createSessionResponse = await this.createSession(
          getUserInfoResponse.data._id,
          checkDeviceFingerprintResponse.data._id,
        );
        if (!createSessionResponse.success || !createSessionResponse.data) {
          this.logger.error(`Cannot create session for ${email_or_username}`);
          return createSessionResponse;
        }
        this.logger.log(`Session created for ${email_or_username}`);
        const updateUserLastLoginResponse = await this.updateUserLastLogin(
          getUserInfoResponse.data._id,
        );
        if (!updateUserLastLoginResponse.success) {
          this.logger.error(
            `Cannot update user last login for ${email_or_username}`,
          );
          return updateUserLastLoginResponse;
        }
        this.logger.log(`User last login updated for ${email_or_username}`);
        return {
          success: true,
          statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
          message: MESSAGES.SUCCESS.LOGIN_SUCCESSFUL,
          data: createSessionResponse.data,
        };
      }
    } catch (error) {
      this.logger.error(`Error logging in for ${email_or_username}`, error);
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: MESSAGES.AUTH.LOGIN_ERROR,
      };
    }
  }

  async verifyDeviceFingerprintEmailVerification(
    email_verification_code: string,
  ): Promise<Response> {
    try {
      this.logger.log(
        `Verify device fingerprint email verification request received for ${email_verification_code}`,
      );
      const validateDeviceFingerprintEmailVerificationResponse =
        await this.validateDeviceFingerprintEmailVerification(
          email_verification_code,
        );
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
        statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
        message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_VERIFIED,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying device fingerprint email verification for ${email_verification_code}`,
        error,
      );
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DEVICE_FINGERPRINT.VERIFICATION_FAILED,
      };
    }
  }

  async resendDeviceFingerprintEmailVerification(
    email_or_username: string,
    fingerprint_hashed: string,
  ): Promise<Response> {
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
        await this.sendDeviceFingerprintEmailVerification(
          getUserInfoResponse.data._id,
          fingerprint_hashed,
        );
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
        statusCode: AUTH_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DEVICE_FINGERPRINT.VERIFICATION_FAILED,
      };
    }
  }

  private async checkDeviceFingerprint(
    user_id: string,
    fingerprint_hashed: string,
  ): Promise<Response<DeviceFingerprintDoc>> {
    // Check if device fingerprint is correct
    const device_fingerprint = await this.deviceFingerprintModel.findOne({
      $and: [{ user_id: user_id }, { fingerprint_hashed: fingerprint_hashed }],
    });
    if (!device_fingerprint || device_fingerprint.is_trusted === false) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_VERIFIED,
      data: device_fingerprint as DeviceFingerprintDoc,
    };
  }

  private async createDeviceFingerprint(
    user_id: string,
    fingerprint_hashed: string,
  ): Promise<Response<DeviceFingerprintDoc>> {
    // Check if device fingerprint already exists
    let device_fingerprint = await this.deviceFingerprintModel.findOne({
      $and: [{ user_id: user_id }, { fingerprint_hashed: fingerprint_hashed }],
    });
    if (!device_fingerprint) {
      device_fingerprint = await this.deviceFingerprintModel.create({
        user_id: user_id,
        fingerprint_hashed: fingerprint_hashed,
        is_trusted: AUTH_CONSTANTS.DEVICE_FINGERPRINT.TRUSTED_BY_DEFAULT,
      });
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_CREATED,
      data: device_fingerprint as DeviceFingerprintDoc,
    };
  }

  private async sendDeviceFingerprintEmailVerification(
    user_id: string,
    fingerprint_hashed: string,
  ): Promise<Response> {
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
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: MESSAGES.DEVICE_FINGERPRINT.NOT_FOUND,
      };
    }
    // Get user email
    const user = await this.userModel.findById(
      device_fingerprint_email_verification.user_id,
      {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      },
    );
    if (!user) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
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
      user_id: user_id,
      fingerprint_hashed: fingerprint_hashed,
    };
    await this.redisInfrastructure.set(
      fingerprint_email_verification_code_key,
      JSON.stringify(fingerprint_email_verification_code_value),
      AUTH_CONSTANTS.REDIS.FINGERPRINT_VERIFICATION_EXPIRES_IN,
    );
    // Send email verification code to user
    this.deviceFingerprintEmailVerification(
      user.email,
      email_verification_code,
    );
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
    };
  }

  private deviceFingerprintEmailVerification(
    email: string,
    email_verification_code: string,
  ): void {
    // Send welcome email to user
    this.emailService.emit('email_request', {
      type: AUTH_CONSTANTS.EMAIL.TYPES.FINGERPRINT_VERIFY,
      data: {
        email: email,
        otpCode: email_verification_code,
      },
    });
  }

  private async validateDeviceFingerprintEmailVerification(
    email_verification_code: string,
  ): Promise<Response> {
    // Validate device fingerprint email verification
    const device_fingerprint_data = (await this.redisInfrastructure.get(
      `${AUTH_CONSTANTS.REDIS.KEYS.FINGERPRINT_VERIFICATION}:${email_verification_code}`,
    )) as {
      user_id: string;
      fingerprint_hashed: string;
    };
    if (!device_fingerprint_data) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
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
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
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
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: MESSAGES.SUCCESS.DEVICE_FINGERPRINT_VERIFIED,
      data: device_fingerprint,
    };
  }

  private async createSession(
    user_id: string,
    device_fingerprint_id: string,
  ): Promise<Response<SessionDoc>> {
    const create_session_response = await this.sessionService.createSession(
      user_id,
      device_fingerprint_id,
    );
    if (!create_session_response.success || !create_session_response.data) {
      return create_session_response;
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: MESSAGES.SUCCESS.SESSION_CREATED,
      data: create_session_response.data,
    };
  }

  private async updateUserLastLogin(user_id: string): Promise<Response> {
    const user = await this.userModel.findById(user_id, {
      password_hashed: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    if (!user) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    user.last_login = new Date();
    await user.save();
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: MESSAGES.SUCCESS.USER_UPDATED,
    };
  }
}
