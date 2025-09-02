import { Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import
import { User } from '../schemas/user.schema';

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

// Services
import { PasswordService } from './password.service';
import { Response } from '../interfaces/response.interface';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

// Interfaces Import
import { RegisterInfoValue } from '../interfaces/register-info-value.interface';
import { EmailVerificationValue } from '../interfaces/email-verification-value.interface';

@Injectable()
export class RegisterService {
  private readonly logger: Logger;
  constructor(
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly passwordService: PasswordService,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
  ) {
    this.logger = new Logger(RegisterService.name);
  }

  // register/email-verification
  async emailVerificationRegister(register_info: {
    username: string;
    email: string;
    password: string;
  }): Promise<Response> {
    // Get register info from request
    const { username, email, password } = register_info;
    // Check if password is strong enough
    const password_verification_and_hashing_response =
      this.passwordService.passwordVerificationAndHashing(password);
    if (
      !password_verification_and_hashing_response.success ||
      !password_verification_and_hashing_response.data
    ) {
      return password_verification_and_hashing_response;
    }
    const password_hashed =
      password_verification_and_hashing_response.data.password_hashed;
    // Check if register info is valid and store in Redis
    const register_info_response = await this.registerInfo({
      username: username,
      email: email,
      password_hashed: password_hashed,
    });
    if (!register_info_response.success) {
      return register_info_response;
    }
    // Send email verification code to user
    const send_email_verification_response =
      await this.sendEmailVerification(email);
    // Return success response
    return send_email_verification_response;
  }

  // register/verify-email
  async verifyEmailRegister(
    email_verification_code: string,
  ): Promise<Response> {
    const check_email_verification_code_response =
      await this.checkEmailVerificationCode(email_verification_code);
    if (
      !check_email_verification_code_response.success ||
      !check_email_verification_code_response.data
    ) {
      return check_email_verification_code_response;
    }
    const email = check_email_verification_code_response.data.email;
    // Create user
    const create_user_response = await this.createUser(email);
    if (!create_user_response.success) {
      return create_user_response;
    }
    // Send welcome email to user
    const welcome_email_response = this.welcomeEmail(email);
    if (!welcome_email_response.success) {
      this.logger.error(welcome_email_response.message);
    }
    // Return success response
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.USER_CREATED,
    };
  }

  private async registerInfo(register_info: {
    username: string;
    email: string;
    password_hashed: string;
  }): Promise<Response> {
    // Get register info from request
    const { username, email, password_hashed } = register_info;
    // Check if user email already exists
    const existing_email = await this.userModel.findOne(
      { email: email },
      {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      },
    );
    if (existing_email) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.REGISTRATION.EMAIL_EXISTS,
      };
    }
    // Check if user username already exists
    const existing_username = await this.userModel.findOne(
      {
        username: username,
      },
      {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      },
    );
    if (existing_username) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.REGISTRATION.USERNAME_EXISTS,
      };
    }
    // Store register info in Redis
    const register_info_key = `${AUTH_CONSTANTS.REDIS.KEYS.REGISTER_INFO}:${email}`;
    const register_info_value: RegisterInfoValue = {
      username: username,
      email: email,
      password_hashed: password_hashed,
    };
    // Store register info in Redis
    await this.redisInfrastructure.set(
      register_info_key,
      JSON.stringify(register_info_value),
      AUTH_CONSTANTS.REDIS.REGISTER_INFO_EXPIRES_IN,
    );
    // Return success response
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.REGISTRATION_SUCCESSFUL,
    };
  }

  async sendEmailVerification(email: string): Promise<Response> {
    const emailVerificationCode = uuidv4().slice(
      0,
      AUTH_CONSTANTS.EMAIL.VERIFICATION_CODE_LENGTH,
    );
    // Check if user data in still in Redis
    const register_info_key = `${AUTH_CONSTANTS.REDIS.KEYS.REGISTER_INFO}:${email}`;
    const register_info_value = (await this.redisInfrastructure.get(
      register_info_key,
    )) as RegisterInfoValue;
    if (!register_info_value) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.REGISTRATION.REGISTER_INFO_NOT_FOUND,
      };
    }
    // Store email verification code with email in Redis
    const email_verification_code_key = `${AUTH_CONSTANTS.REDIS.KEYS.EMAIL_VERIFICATION}:${emailVerificationCode}`;
    const email_verification_code_value: EmailVerificationValue = {
      email: email,
      code: emailVerificationCode,
    };
    await this.redisInfrastructure.set(
      email_verification_code_key,
      JSON.stringify(email_verification_code_value),
      AUTH_CONSTANTS.REDIS.EMAIL_VERIFICATION_EXPIRES_IN,
    );
    // Send email verification code to user
    this.emailService.emit('email_request', {
      type: AUTH_CONSTANTS.EMAIL.TYPES.CREATE_ACCOUNT,
      data: {
        email: email,
        otpCode: emailVerificationCode,
      },
    });
    // Return success response
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
    };
  }

  private async checkEmailVerificationCode(
    email_verification_code: string,
  ): Promise<Response<{ email: string }>> {
    // Get email verification code from Redis
    const email_verification_code_key = `${AUTH_CONSTANTS.REDIS.KEYS.EMAIL_VERIFICATION}:${email_verification_code}`;
    const email_verification_code_value = (await this.redisInfrastructure.get(
      email_verification_code_key,
    )) as EmailVerificationValue;
    if (!email_verification_code_value) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.EMAIL_VERIFICATION.INVALID_CODE,
      };
    }

    // Delete email verification code from Redis
    await this.redisInfrastructure.del(email_verification_code_key);
    // Return success response
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.EMAIL_VERIFICATION_SUCCESSFUL,
      data: {
        email: email_verification_code_value.email,
      },
    };
  }

  private async createUser(email: string): Promise<Response> {
    // Get user data from Redis
    const register_info_key = `${AUTH_CONSTANTS.REDIS.KEYS.REGISTER_INFO}:${email}`;
    const register_info_value = (await this.redisInfrastructure.get(
      register_info_key,
    )) as RegisterInfoValue;
    if (!register_info_value) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.REGISTRATION.REGISTER_INFO_INVALID,
      };
    }

    // Check if user already exists (by email or username)
    const existing_user = await this.userModel.findOne({
      $or: [{ email: email }, { username: register_info_value.username }],
      password_hashed: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    if (existing_user) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.CONFLICT,
        message: ERROR_MESSAGES.REGISTRATION.EMAIL_EXISTS,
      };
    }
    // Delete register info from Redis
    await this.redisInfrastructure.del(register_info_key);
    // Create user
    const user = await this.userModel.create({
      username: register_info_value.username,
      email: register_info_value.email,
      display_name: register_info_value.username,
      password_hashed: register_info_value.password_hashed,
      role: AUTH_CONSTANTS.USER.DEFAULT_ROLE,
      bio: AUTH_CONSTANTS.USER.DEFAULT_BIOGRAPHY,
      avatar_ipfs_hash: AUTH_CONSTANTS.USER.DEFAULT_AVATAR_IPFS_HASH,
      avatar_fallback_url: AUTH_CONSTANTS.USER.DEFAULT_AVATAR_FALLBACK_URL,
    });
    // Return success response
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.USER_CREATED,
      data: user,
    };
  }

  private welcomeEmail(email: string): Response {
    // Send welcome email to user
    this.emailService.emit('email_request', {
      type: AUTH_CONSTANTS.EMAIL.TYPES.WELCOME_MESSAGE,
      data: {
        email: email,
      },
    });
    // Return success response
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
    };
  }
}
