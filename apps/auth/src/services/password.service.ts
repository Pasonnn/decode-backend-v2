import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Services
import { InfoService } from './info.service';
// Interfaces
import { Response } from '../interfaces/response.interface';
import { UserDoc } from '../interfaces/user-doc.interface';

// Utils
import { PasswordUtils } from '../utils/password.utils';

// Infrastructures
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { UserServiceClient } from '../infrastructure/external-services/auth-service.client';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';
// Interfaces
import { PasswordVerificationValue } from '../interfaces/password-verification-value.interface';

@Injectable()
export class PasswordService {
  constructor(
    private readonly passwordUtils: PasswordUtils,
    private readonly userServiceClient: UserServiceClient,
    private readonly infoService: InfoService,
    private readonly redisInfrastructure: RedisInfrastructure,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
  ) {}

  // password/change
  async changePassword(
    user_id: string,
    old_password: string,
    new_password: string,
  ): Promise<Response> {
    // Check if old password is correct
    const getUserInfoResponse =
      await this.userServiceClient.getInfoWithPasswordByUserId({
        user_id: user_id,
      });
    if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
      return getUserInfoResponse;
    }
    const user = getUserInfoResponse.data;
    // Check if old password is correct
    const check_password_response = this.checkPassword(
      old_password,
      user.password_hashed,
    );
    if (!check_password_response.success) {
      return check_password_response;
    }
    // Hash new password
    const password_verification_and_hashing_response =
      this.passwordVerificationAndHashing(new_password);
    if (
      !password_verification_and_hashing_response.success ||
      !password_verification_and_hashing_response.data
    ) {
      return password_verification_and_hashing_response;
    }
    const new_password_hashed =
      password_verification_and_hashing_response.data.password_hashed;
    // Change password
    const password_change_response = await this.passwordChange(
      user_id,
      new_password_hashed,
    );

    // Return success response
    return password_change_response;
  }

  // password/forgot/email-verification
  async emailVerificationChangePassword(
    email_or_username: string,
  ): Promise<Response> {
    // Get user info
    const getUserInfoResponse =
      await this.infoService.getUserInfoByEmailOrUsername(email_or_username);
    if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
      return getUserInfoResponse;
    }
    const user_id = getUserInfoResponse.data._id.toString();
    const email = getUserInfoResponse.data.email;
    // Send email verification
    const sendEmailVerificationResponse = await this.sendEmailVerification(
      user_id,
      email,
    );
    if (!sendEmailVerificationResponse.success) {
      return sendEmailVerificationResponse;
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PASSWORD_RESET_SENT,
    };
  }

  // password/forgot/verify-email
  async verifyEmailChangePassword(
    email_verification_code: string,
  ): Promise<Response> {
    // Get verification code from Redis
    const verify_email_verification_code_response =
      await this.verifyEmailVerificationCode(email_verification_code);
    if (!verify_email_verification_code_response.success) {
      return verify_email_verification_code_response;
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PASSWORD_CODE_VERIFIED,
    };
  }

  private async verifyEmailVerificationCode(
    email_verification_code: string,
  ): Promise<Response<UserDoc>> {
    // Get verification code from Redis
    const verification_code_key = `${AUTH_CONSTANTS.REDIS.KEYS.PASSWORD_RESET}:${email_verification_code}`;
    const verification_code_value = (await this.redisInfrastructure.get(
      verification_code_key,
    )) as PasswordVerificationValue;
    if (!verification_code_value) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PASSWORD.PASSWORD_RESET_CODE_INVALID,
      };
    }

    // Get user info
    const getUserInfoResponse = await this.infoService.getUserInfoByUserId(
      verification_code_value.user_id,
    );
    if (!getUserInfoResponse.success || !getUserInfoResponse.data) {
      return getUserInfoResponse;
    }
    // Return success response
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PASSWORD_CODE_VERIFIED,
      data: getUserInfoResponse.data,
    };
  }

  // password/forgot/change
  async changeForgotPassword(
    email_verification_code: string,
    new_password: string,
  ): Promise<Response> {
    // Verify email verification code
    const verify_email_verification_code_response =
      await this.verifyEmailVerificationCode(email_verification_code);
    if (
      !verify_email_verification_code_response.success ||
      !verify_email_verification_code_response.data
    ) {
      return verify_email_verification_code_response;
    }
    const user_id = verify_email_verification_code_response.data._id.toString();
    // Delete verification code from Redis
    const verification_code_key = `${AUTH_CONSTANTS.REDIS.KEYS.PASSWORD_RESET}:${email_verification_code}`;
    await this.redisInfrastructure.del(verification_code_key);
    // Hash new password
    const password_verification_and_hashing_response =
      this.passwordVerificationAndHashing(new_password);
    if (
      !password_verification_and_hashing_response.success ||
      !password_verification_and_hashing_response.data
    ) {
      return password_verification_and_hashing_response;
    }
    const new_password_hashed =
      password_verification_and_hashing_response.data.password_hashed;
    // Change password
    const password_change_response = await this.passwordChange(
      user_id,
      new_password_hashed,
    );
    // Return success response
    return password_change_response;
  }

  checkPassword(password: string, password_hashed: string): Response {
    // Check if password is correct
    const is_password_correct = this.passwordUtils.comparePassword(
      password,
      password_hashed,
    );
    if (!is_password_correct) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PASSWORD.INVALID_PASSWORD,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
    };
  }

  passwordVerificationAndHashing(
    password: string,
  ): Response<{ password_hashed: string }> {
    // Check if password is strong enough
    const password_strength =
      this.passwordUtils.validatePasswordStrength(password);
    if (!password_strength.isValid) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PASSWORD.WEAK_PASSWORD,
      };
    }
    // Hash password
    const password_hashed = this.passwordUtils.hashPassword(password);
    // Return success response
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
      data: {
        password_hashed: password_hashed,
      },
    };
  }

  private async passwordChange(
    user_id: string,
    new_password_hashed: string,
  ): Promise<Response> {
    // Change password
    const update_password_response =
      await this.userServiceClient.changePassword({
        user_id: user_id,
        password_hashed: new_password_hashed,
      });
    if (!update_password_response.success) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PASSWORD.PASSWORD_CHANGE_FAILED,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
    };
  }

  private async sendEmailVerification(
    user_id: string,
    email: string,
  ): Promise<Response> {
    // Create and store verification code
    const verification_code = uuidv4().slice(
      0,
      AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH,
    );
    const verification_code_key = `${AUTH_CONSTANTS.REDIS.KEYS.PASSWORD_RESET}:${verification_code}`;
    const verification_code_value = {
      user_id: user_id,
      verification_code: verification_code,
    };
    await this.redisInfrastructure.set(
      verification_code_key,
      JSON.stringify(verification_code_value),
      AUTH_CONSTANTS.REDIS.PASSWORD_RESET_EXPIRES_IN,
    );
    // Send verification code to user
    this.emailService.emit('email_request', {
      type: AUTH_CONSTANTS.EMAIL.TYPES.FORGOT_PASSWORD_VERIFY,
      data: {
        email: email,
        otpCode: verification_code,
      },
    });
    // Return success response
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
    };
  }
}
