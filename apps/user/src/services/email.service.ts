import { Inject, Injectable, Logger, HttpStatus } from '@nestjs/common';
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
import { MESSAGES } from '../constants/messages.constants';

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
  }): Promise<Response<void>> {
    try {
      const { user_id } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }

      const sendEmailVerificationResponse = await this.sendEmailVerification({
        user_id: user_id,
        current_email: user.email,
      });
      if (!sendEmailVerificationResponse.success) {
        return sendEmailVerificationResponse as Response<void>;
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      };
    } catch (error: unknown) {
      this.logger.error(`Error changing email initiate: ${error as string}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
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
    )) as { user_id: string; verification_code: string };
    if (!verification_code_value) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.EMAIL_CHANGE.EMAIL_CHANGE_CODE_INVALID,
      };
    }
    if (verification_code_value.user_id !== user_id) {
      return {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: MESSAGES.EMAIL_CHANGE.EMAIL_CHANGE_CODE_INVALID,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_CHANGE_CODE_VERIFIED,
    };
  }

  async newEmailInitiate(input: {
    user_id: string;
    new_email: string;
    code: string;
  }): Promise<Response<void>> {
    // Validate input
    const { user_id, new_email, code } = input;
    // Check if user exists
    const user = await this.userModel.findById(user_id, {
      password_hashed: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    if (!user) {
      return {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    // Check if new email already exists
    if (user.email === new_email) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.EMAIL_CHANGE.NEW_EMAIL_ALREADY_EXISTS,
      };
    }
    // Initiate new email verification and check code
    const newEmailVerifyInitiateResponse = await this.sendNewEmailVerify({
      user_id,
      new_email,
      code,
    });
    // Return Response
    if (!newEmailVerifyInitiateResponse.success) {
      return newEmailVerifyInitiateResponse;
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.NEW_EMAIL_CHANGE_INITIATED,
    };
  }

  // Call this alone for resend new email verification
  private async sendNewEmailVerify(input: {
    user_id: string;
    new_email: string;
    code: string;
  }): Promise<Response<void>> {
    try {
      const { user_id, new_email, code } = input;
      // Check if user exists
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.USER_INFO.USER_NOT_FOUND,
        };
      }
      // Verify email code
      const verifyEmailCodeResponse = await this.verifyEmailCode({
        user_id,
        code,
      });
      if (!verifyEmailCodeResponse.success) {
        return verifyEmailCodeResponse;
      }
      await this.redisInfrastructure.del(
        `${USER_CONSTANTS.REDIS.KEYS.NEW_EMAIL_CHANGE}:${code}`,
      );
      // Send new email verification
      const sendNewEmailVerificationResponse =
        await this.sendNewEmailVerification({
          user_id,
          new_email,
        });
      if (!sendNewEmailVerificationResponse.success) {
        return sendNewEmailVerificationResponse as Response<void>;
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.NEW_EMAIL_CHANGE_INITIATED,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error initiating new email verification: ${error as string}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  async verifyNewEmailCode(input: {
    user_id: string;
    code: string;
  }): Promise<Response<void>> {
    const { code, user_id } = input;
    const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.NEW_EMAIL_CHANGE}:${code}`;
    const verification_code_value = (await this.redisInfrastructure.get(
      verification_code_key,
    )) as { user_id: string; verification_code: string; new_email: string };
    if (!verification_code_value) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.EMAIL_CHANGE.NEW_EMAIL_CHANGE_CODE_INVALID,
      };
    }
    if (verification_code_value.user_id !== user_id) {
      return {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: MESSAGES.EMAIL_CHANGE.NEW_EMAIL_CHANGE_CODE_INVALID,
      };
    }
    await this.redisInfrastructure.del(verification_code_key);
    await this.changeEmail({
      user_id,
      new_email: verification_code_value.new_email,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_CHANGED,
    };
  }

  private async sendEmailVerification(input: {
    user_id: string;
    current_email: string;
  }): Promise<Response> {
    try {
      const { user_id, current_email } = input;
      const verification_code = uuidv4().slice(
        0,
        USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
      );
      const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.EMAIL_CHANGE}:${verification_code}`;
      const verification_code_value = {
        user_id: user_id,
        verification_code: verification_code,
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
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      };
    } catch (error: unknown) {
      this.logger.error(`Error sending email verification: ${error as string}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  private async sendNewEmailVerification(input: {
    user_id: string;
    new_email: string;
  }): Promise<Response> {
    try {
      const { user_id, new_email } = input;
      const verification_code = uuidv4().slice(
        0,
        USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
      );
      const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.NEW_EMAIL_CHANGE}:${verification_code}`;
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
        type: USER_CONSTANTS.EMAIL.TYPES.NEW_EMAIL_CHANGE_VERIFY,
        data: {
          email: new_email,
          otpCode: verification_code,
        },
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error sending new email verification: ${error as string}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  private async changeEmail(input: {
    user_id: string;
    new_email: string;
  }): Promise<Response> {
    try {
      const { user_id, new_email } = input;
      await this.userModel.findByIdAndUpdate(user_id, {
        email: new_email,
        last_email_change: new Date(),
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_CHANGED,
      };
    } catch (error: unknown) {
      this.logger.error(`Error changing email: ${error as string}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }
}
