import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Schemas Import
import { User } from '../schemas/user.schema';

// Interfaces Import
import { Response } from '../interfaces/response.interface';

// Services Import
import { SessionService } from './session.service';
import { InfoService } from './info.service';
import { PasswordService } from './password.service';
import { DeviceFingerprintService } from './device-fingerprint.service';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';

@Injectable()
export class LoginService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly sessionService: SessionService,
    private readonly infoService: InfoService,
    private readonly passwordService: PasswordService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
  ) {
    this.logger = new Logger(LoginService.name);
  }

  // login/
  async login(input: {
    email_or_username: string;
    password: string;
    fingerprint_hashed: string;
    browser: string;
    device: string;
  }): Promise<Response> {
    const { email_or_username, password, fingerprint_hashed, browser, device } =
      input;
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
      const checkDeviceFingerprintResponse =
        await this.deviceFingerprintService.checkDeviceFingerprint({
          user_id: getUserInfoResponse.data._id,
          fingerprint_hashed,
        });
      if (
        !checkDeviceFingerprintResponse.success ||
        !checkDeviceFingerprintResponse.data
      ) {
        // Device fingerprint not trusted
        this.logger.log(
          `Device fingerprint not trusted for ${email_or_username}`,
        );
        const createDeviceFingerprintResponse =
          await this.deviceFingerprintService.createDeviceFingerprint({
            user_id: getUserInfoResponse.data._id,
            fingerprint_hashed,
            browser,
            device,
          });
        if (!createDeviceFingerprintResponse.success) {
          this.logger.error(
            `Cannot create device fingerprint for ${email_or_username}`,
          );
          return createDeviceFingerprintResponse;
        }
        const sendDeviceFingerprintEmailVerificationResponse =
          await this.deviceFingerprintService.sendDeviceFingerprintEmailVerification(
            {
              user_id: getUserInfoResponse.data._id,
              fingerprint_hashed,
            },
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
        const createSessionResponse = await this.sessionService.createSession(
          getUserInfoResponse.data._id,
          checkDeviceFingerprintResponse.data._id,
        );
        if (!createSessionResponse.success || !createSessionResponse.data) {
          this.logger.error(`Cannot create session for ${email_or_username}`);
          return createSessionResponse;
        }
        this.logger.log(`Session created for ${email_or_username}`);
        const updateUserLastLoginResponse = await this.updateUserLastLogin({
          user_id: getUserInfoResponse.data._id,
        });
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

  private async updateUserLastLogin(input: {
    user_id: string;
  }): Promise<Response> {
    const { user_id } = input;
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
