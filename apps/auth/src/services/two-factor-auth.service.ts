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

@Injectable()
export class TwoFactorAuthService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    private readonly configService: ConfigService,
  ) {
    this.logger = new Logger(TwoFactorAuthService.name);
  }

  async setUpOtp(input: { user_id: string }): Promise<Response<IOtpDoc>> {
    const { user_id } = input;
    try {
      const findUserOtpResponse = await this.findOtpByUserId({ user_id });
      if (findUserOtpResponse.success) {
        return {
          success: false,
          statusCode: HttpStatus.FORBIDDEN,
          message: MESSAGES.OTP.OTP_ALREADY_SETUP,
          data: findUserOtpResponse.data as IOtpDoc,
        };
      }
      // Generate OTP
      const generateOtpSecretResponse = await this.generateOtpSecret({
        user_id,
      });
      if (!generateOtpSecretResponse) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: MESSAGES.OTP.OTP_SECRET_GENERATION_FAILED,
        };
      }
      // Generate QR Code
    } catch (error) {
      this.logger.error(`Error setting up OTP for user ${user_id}: ${error}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.OTP.OTP_SETUP_FAILED,
        error: error as string,
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
      const otpSecret = speakeasy.generateSecret({
          name: 'decode',
          issuer: 'decode-auth-service',
          length: 32,
          encoding: 'base32',
          alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
      }));
      return otpSecret.otpauth_url;
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
        error: error as string,
      };
    }
  }
}
