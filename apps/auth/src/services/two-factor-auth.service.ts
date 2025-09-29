import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as speakeasy from 'speakeasy';
// Schemas
import { Otp } from '../schemas/otp';

// Config and Constants
import { ConfigService } from '@nestjs/config';
import { MESSAGES } from '../constants/error-messages.constants';

// Interfaces
import { Response } from '../interfaces/response.interface';
import { IOtpDoc } from '../interfaces/otp-doc.interface';
import { SpeakeasyModule } from '../interfaces/speakeasy.interface';
import { SessionDoc } from '../interfaces/session-doc.interface';

// Constants
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

// Services
import { SessionService } from './session.service';
@Injectable()
export class TwoFactorAuthService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private readonly configService: ConfigService,
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly sessionService: SessionService,
  ) {
    this.logger = new Logger(TwoFactorAuthService.name);
  }

  async setUpOtp(input: { user_id: string }): Promise<Response<IOtpDoc>> {
    const { user_id } = input;
    try {
      // Check if OTP is already setup
      const findUserOtpResponse = await this.findOtpByUserId({ user_id });
      if (findUserOtpResponse.success) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: MESSAGES.OTP.OTP_ALREADY_SETUP,
          data: findUserOtpResponse.data as IOtpDoc,
        };
      }

      // Generate OTP secret and save to database
      const otpSecret = await this.generateOtpSecret({ user_id });
      if (!otpSecret) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: MESSAGES.OTP.OTP_SECRET_GENERATION_FAILED,
        };
      }

      // Generate QR code URL for Google Authenticator
      const qrCodeUrl = (speakeasy as unknown as SpeakeasyModule).otpauthURL({
        secret: otpSecret,
        label: 'Decode',
        issuer: 'Decode Portal',
      });

      // Get the created OTP document
      const createdOtp = await this.otpModel.findOne({
        user_id: new Types.ObjectId(user_id),
      });

      if (!createdOtp) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: MESSAGES.OTP.OTP_FETCH_FAILED,
        };
      }

      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: MESSAGES.SUCCESS.OTP_SETUP_SUCCESS,
        data: {
          ...createdOtp.toObject(),
          qr_code_url: qrCodeUrl,
        } as unknown as IOtpDoc & { qr_code_url: string },
      };
    } catch (error) {
      this.logger.error(`Error setting up OTP for user ${user_id}: ${error}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_SETUP_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async verifyOtp(input: {
    user_id: string;
    otp: string;
  }): Promise<Response<IOtpDoc>> {
    const { user_id, otp } = input;

    try {
      // Input validation
      if (!user_id || !otp) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.VALIDATION.REQUIRED_FIELD,
        };
      }

      // Validate OTP format (should be 6 digits)
      if (!/^\d{6}$/.test(otp)) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.OTP.OTP_INVALID,
        };
      }

      // Find OTP document
      const otpDoc = await this.otpModel.findOne({
        user_id: new Types.ObjectId(user_id),
      });

      if (!otpDoc) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.OTP.OTP_NOT_FOUND,
        };
      }

      // Check if OTP is enabled
      if (!otpDoc.otp_enable) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: MESSAGES.OTP.OTP_NOT_ENABLED,
        };
      }

      // Verify OTP using speakeasy with time window tolerance
      const verificationResult = (
        speakeasy as unknown as SpeakeasyModule
      ).totp.verify({
        secret: otpDoc.otp_secret,
        token: otp,
        window: 2, // Allow 2 time steps (60 seconds) tolerance
        encoding: 'base32',
      });

      // Handle verification result
      if (!verificationResult) {
        this.logger.warn(`Invalid OTP attempt for user ${user_id}`);
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.OTP.OTP_INVALID,
        };
      }

      // Log successful verification
      this.logger.log(`OTP successfully verified for user ${user_id}`);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.OTP_VERIFIED,
        data: otpDoc as IOtpDoc,
      };
    } catch (error) {
      this.logger.error(`Error verifying OTP for user ${user_id}: ${error}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_VERIFY_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async enableOtp(input: {
    user_id: string;
    otp: string;
  }): Promise<Response<IOtpDoc>> {
    const { user_id, otp } = input;
    try {
      const otpDoc = await this.otpModel.findOne({
        user_id: new Types.ObjectId(user_id),
      });

      if (!otpDoc) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.OTP.OTP_NOT_FOUND,
        };
      }

      if (otpDoc.otp_enable) {
        return {
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message: MESSAGES.OTP.OTP_ALREADY_SETUP,
        };
      }

      // Verify OTP
      const verificationResult = (
        speakeasy as unknown as SpeakeasyModule
      ).totp.verify({
        secret: otpDoc.otp_secret,
        token: otp,
        encoding: 'base32',
      });

      if (!verificationResult) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.OTP.OTP_INVALID,
        };
      }

      // Enable OTP
      otpDoc.otp_enable = true;
      await otpDoc.save();

      this.logger.log(`OTP enabled for user ${user_id}`);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.OTP_ENABLED,
        data: otpDoc as IOtpDoc,
      };
    } catch (error) {
      this.logger.error(`Error enabling OTP for user ${user_id}: ${error}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_VERIFY_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async disableOtp(input: { user_id: string }): Promise<Response<IOtpDoc>> {
    const { user_id } = input;
    try {
      const otpDoc = await this.otpModel.findOne({
        user_id: new Types.ObjectId(user_id),
      });

      if (!otpDoc) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.OTP.OTP_NOT_FOUND,
        };
      }

      if (!otpDoc.otp_enable) {
        return {
          success: false,
          statusCode: HttpStatus.CONFLICT,
          message: MESSAGES.OTP.OTP_NOT_ENABLED,
        };
      }

      // Disable OTP
      otpDoc.otp_enable = false;
      await otpDoc.save();

      this.logger.log(`OTP disabled for user ${user_id}`);

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.OTP_DISABLED,
        data: otpDoc as IOtpDoc,
      };
    } catch (error) {
      this.logger.error(`Error disabling OTP for user ${user_id}: ${error}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_VERIFY_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async loginCheckOtpEnable(input: {
    user_id: string;
  }): Promise<Response<IOtpDoc>> {
    const { user_id } = input;
    try {
      const findOtpByUserIdResponse = await this.findOtpByUserId({ user_id });
      if (!findOtpByUserIdResponse.success) {
        return findOtpByUserIdResponse;
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.OTP_VERIFY,
        data: findOtpByUserIdResponse.data as IOtpDoc,
      };
    } catch (error) {
      this.logger.error(
        `Error checking if OTP is enabled for user ${user_id}: ${error}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_FETCH_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async loginVerifyOtp(input: {
    login_session_token: string;
    otp: string;
  }): Promise<Response<SessionDoc>> {
    const { login_session_token, otp } = input;
    try {
      // Get login session
      const login_session_key = `${AUTH_CONSTANTS.REDIS.KEYS.LOGIN_SESSION}:${login_session_token}`;
      const login_session_value = (await this.redisInfrastructure.get(
        login_session_key,
      )) as {
        user_id: string;
        device_fingerprint_id: string;
        browser: string;
        device: string;
      };
      if (!login_session_value) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.SESSION.LOGIN_SESSION_NOT_FOUND,
        };
      }
      // Verify OTP
      const verifyOtpResponse = await this.verifyOtp({
        user_id: login_session_value.user_id,
        otp,
      });
      if (!verifyOtpResponse.success) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.OTP.OTP_INVALID,
        };
      }
      // Create session
      console.log('Creating session', login_session_value);
      const createSessionResponse = await this.sessionService.createSession({
        user_id: login_session_value.user_id,
        device_fingerprint_id: login_session_value.device_fingerprint_id,
        app: 'decode',
      });
      console.log('Create session response', createSessionResponse);
      if (!createSessionResponse.success || !createSessionResponse.data) {
        return createSessionResponse;
      }
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: MESSAGES.SUCCESS.SESSION_CREATED,
        data: createSessionResponse.data,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying OTP for login session ${login_session_token}: ${error}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_VERIFY_FAILED,
      };
    }
  }

  private async generateOtpSecret(input: { user_id: string }): Promise<string> {
    const { user_id } = input;
    try {
      const existingOtp = await this.otpModel.findOne({ user_id });
      if (existingOtp) {
        return existingOtp.otp_secret;
      }

      // Generate OTP secret using speakeasy
      const otpSecret = (
        speakeasy as unknown as SpeakeasyModule
      ).generateSecret({
        name: 'Decode',
        issuer: 'Decode Portal',
        length: 32,
      });

      // Save the OTP secret to database
      const newOtp = new this.otpModel({
        user_id: new Types.ObjectId(user_id),
        otp_secret: otpSecret.base32, // Use base32 format for TOTP
        otp_enable: false, // Initially disabled until verified
      });

      await newOtp.save();

      return otpSecret.base32;
    } catch (error) {
      this.logger.error(
        `Error generating OTP secret for user ${user_id}: ${error}`,
      );
      return '';
    }
  }

  private async findOtpByUserId(input: {
    user_id: string;
  }): Promise<Response<IOtpDoc>> {
    const { user_id } = input;
    try {
      const otp = await this.otpModel.findOne({
        user_id: new Types.ObjectId(user_id),
      });
      if (!otp) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.OTP.OTP_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.OTP_FETCHED,
        data: otp as IOtpDoc,
      };
    } catch (error) {
      this.logger.error(
        `Error checking if OTP is enabled for user ${user_id}: ${error}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_FETCH_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
