import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';

// Interfaces Import
import { Response } from '../interfaces/response.interface';

// Schema Import
import { User } from '../schemas/user.schema';

// Constants Import
import { USER_CONSTANTS } from '../constants/user.constants';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

@Injectable()
export class EmailService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
    private readonly redisInfrastructure: RedisInfrastructure,
  ) {
    this.logger = new Logger(EmailService.name);
  }

  async changeEmailInitiate(input: {
    user_id: string;
    new_email: string;
  }): Promise<Response<void>> {
    try {
      const { user_id, new_email } = input;
      const user = await this.userModel.findById(user_id);
      if (!user) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      if (user.email === new_email) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.BAD_REQUEST,
          message: ERROR_MESSAGES.EMAIL_CHANGE.NEW_EMAIL_ALREADY_EXISTS,
        };
      }
      // Check if new email already exists
      const existingUser = await this.userModel.findOne({ email: new_email });
      if (existingUser) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.BAD_REQUEST,
          message: ERROR_MESSAGES.EMAIL_CHANGE.NEW_EMAIL_ALREADY_EXISTS,
        };
      }

      const sendEmailVerificationResponse = await this.sendEmailVerification({
        user_id: user_id,
        current_email: user.email,
        new_email: new_email,
      });
      if (!sendEmailVerificationResponse.success) {
        return sendEmailVerificationResponse as Response<void>;
      }
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      };
    } catch (error: unknown) {
      this.logger.error(`Error changing email initiate: ${error as string}`);
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  async verifyEmailCode(input: {
    user_id: string;
    code: string;
  }): Promise<Response<void>> {
    const { code, user_id } = input;
    const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.EMAIL_CHANGE}:${code}`;
    const verification_code_value = (await this.redisInfrastructure.get(
      verification_code_key,
    )) as { user_id: string; verification_code: string; new_email: string };
    if (!verification_code_value) {
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.EMAIL_CHANGE.EMAIL_CHANGE_CODE_INVALID,
      };
    }
    if (verification_code_value.user_id !== user_id) {
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.FORBIDDEN,
        message: ERROR_MESSAGES.EMAIL_CHANGE.EMAIL_CHANGE_CODE_INVALID,
      };
    }
    return {
      success: true,
      statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.EMAIL_CHANGE_CODE_VERIFIED,
    };
  }

  async changeEmail(input: {
    user_id: string;
    new_email: string;
    code: string;
  }): Promise<Response<void>> {
    const { user_id, new_email, code } = input;
    const user = await this.userModel.findById(user_id);
    if (!user) {
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    if (user.email === new_email) {
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.EMAIL_CHANGE.NEW_EMAIL_ALREADY_EXISTS,
      };
    }
    const verifyEmailCodeResponse = await this.verifyEmailCode({
      user_id,
      code,
    });
    if (!verifyEmailCodeResponse.success) {
      return verifyEmailCodeResponse;
    }
    await this.redisInfrastructure.del(
      `${USER_CONSTANTS.REDIS.KEYS.EMAIL_CHANGE}:${code}`,
    );
    await this.userModel.findByIdAndUpdate(user_id, {
      email: new_email,
      last_email_change: new Date(),
    });
    return {
      success: true,
      statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.EMAIL_CHANGED,
    };
  }

  private async sendEmailVerification(input: {
    user_id: string;
    current_email: string;
    new_email: string;
  }): Promise<Response> {
    try {
      const { user_id, current_email, new_email } = input;
      const verification_code = uuidv4().slice(
        0,
        USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
      );
      const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.EMAIL_CHANGE}:${verification_code}`;
      const verification_code_value = {
        user_id: user_id,
        verification_code: verification_code,
        new_email: new_email,
      };
      await this.redisInfrastructure.set(
        verification_code_key,
        JSON.stringify(verification_code_value),
        USER_CONSTANTS.VERIFICATION.EXPIRES_IN,
      );
      this.emailService.emit('email_request', {
        type: USER_CONSTANTS.EMAIL.TYPES.EMAIL_CHANGE_VERIFY,
        data: {
          email: current_email,
          otpCode: verification_code,
        },
      });
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      };
    } catch (error: unknown) {
      this.logger.error(`Error sending email verification: ${error as string}`);
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }
}
