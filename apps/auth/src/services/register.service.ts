/**
 * @fileoverview User Registration Service
 *
 * This service handles the complete user registration flow including email verification,
 * account creation, and welcome email notifications. It implements a secure two-step
 * registration process to prevent unauthorized account creation.
 *
 * Registration Flow:
 * 1. User submits registration information (username, email, password)
 * 2. System validates password strength and checks for existing accounts
 * 3. Registration data is temporarily stored in Redis with expiration
 * 4. Email verification code is generated and sent to user's email
 * 5. User verifies email with the provided code
 * 6. User account is created in MongoDB with hashed password
 * 7. Welcome email is sent to the new user
 *
 * Security Features:
 * - Password strength validation with configurable requirements
 * - Bcrypt password hashing with salt rounds
 * - Email verification to prevent fake account creation
 * - Temporary storage of registration data with automatic expiration
 * - Duplicate account prevention (email and username uniqueness)
 *
 * Data Storage:
 * - MongoDB: Permanent user account data
 * - Redis: Temporary registration data and verification codes
 * - Email Service: Asynchronous email delivery via RabbitMQ
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

// Core NestJS modules for dependency injection and HTTP status codes
import { Inject, Injectable, Logger, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ClientProxy } from '@nestjs/microservices';

// Schemas Import

// Infrastructure and Strategies Import
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';
import { UserServiceClient } from '../infrastructure/external-services/auth-service.client';

// Services
import { PasswordService } from './password.service';
import { Response } from '../interfaces/response.interface';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { MESSAGES } from '../constants/error-messages.constants';

// Interfaces Import
import { RegisterInfoValue } from '../interfaces/register-info-value.interface';
import { EmailVerificationValue } from '../interfaces/email-verification-value.interface';
import { UserDoc } from '../interfaces/user-doc.interface';

/**
 * User Registration Service
 *
 * This service manages the complete user registration lifecycle from initial
 * registration request to account creation and welcome email delivery.
 *
 * The service implements a secure two-step registration process:
 * 1. Email verification step - validates user's email ownership
 * 2. Account creation step - creates the actual user account
 *
 * Key responsibilities:
 * - Validate registration data and password strength
 * - Check for duplicate accounts (email/username uniqueness)
 * - Store temporary registration data in Redis
 * - Generate and send email verification codes
 * - Create user accounts after email verification
 * - Send welcome emails to new users
 *
 * @Injectable - Marks this class as a provider that can be injected into other classes
 */
@Injectable()
export class RegisterService {
  private readonly logger: Logger;

  /**
   * Constructor for dependency injection
   *
   * @param redisInfrastructure - Redis operations for temporary data storage
   * @param passwordService - Password validation and hashing utilities
   * @param emailService - RabbitMQ client for email service communication
   */
  constructor(
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly passwordService: PasswordService,
    private readonly userServiceClient: UserServiceClient,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
    @Inject('NEO4JDB_SYNC_SERVICE')
    private readonly neo4jdbCreateUserService: ClientProxy,
  ) {
    this.logger = new Logger(RegisterService.name);
  }

  /**
   * Initiates user registration process with email verification
   *
   * This method handles the first step of the registration process:
   * 1. Validates password strength and requirements
   * 2. Checks for existing accounts with the same email or username
   * 3. Stores registration data temporarily in Redis
   * 4. Sends email verification code to the user
   *
   * The registration data is stored in Redis with a 1-hour expiration to prevent
   * indefinite storage of sensitive information. The email verification code
   * expires after 5 minutes for security.
   *
   * @param register_info - User registration information
   * @param register_info.username - Unique username for the account
   * @param register_info.email - User's email address for verification
   * @param register_info.password - Plain text password (will be hashed)
   *
   * @returns Promise<Response> - Registration status and next steps
   *
   * @throws Will return error response if:
   * - Password doesn't meet strength requirements
   * - Email or username already exists
   * - Email service is unavailable
   *
   * @example
   * ```typescript
   * const result = await registerService.emailVerificationRegister({
   *   username: 'johndoe',
   *   email: 'john@example.com',
   *   password: 'SecurePass123!'
   * });
   * ```
   */
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
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_CREATED,
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
    const existing_email_or_username_response =
      await this.userServiceClient.checkUserExistsByEmailOrUsername({
        email_or_username: email,
      });
    if (existing_email_or_username_response.success) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.REGISTRATION.EMAIL_OR_USERNAME_EXISTS,
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
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.REGISTRATION_SUCCESSFUL,
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
        statusCode: HttpStatus.NOT_FOUND,
        message: MESSAGES.REGISTRATION.REGISTER_INFO_NOT_FOUND,
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
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
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
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.EMAIL_VERIFICATION.INVALID_CODE,
      };
    }

    // Delete email verification code from Redis
    await this.redisInfrastructure.del(email_verification_code_key);
    // Return success response
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SUCCESSFUL,
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
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.REGISTRATION.REGISTER_INFO_INVALID,
      };
    }

    // Check if user already exists (by email or username)
    const existing_user_response: Response =
      await this.userServiceClient.checkUserExistsByEmailOrUsername({
        email_or_username: email,
      });
    if (existing_user_response.success && existing_user_response.data) {
      return {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: MESSAGES.REGISTRATION.EXISTING_USER,
      };
    }
    // Delete register info from Redis
    await this.redisInfrastructure.del(register_info_key);

    // Create user
    const created_user_response: Response =
      await this.userServiceClient.createUser({
        username: register_info_value.username,
        email: register_info_value.email,
        password_hashed: register_info_value.password_hashed,
      });
    if (!created_user_response.success) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.REGISTRATION.USER_CREATION_FAILED,
      };
    }
    // Sync user to Neo4j
    const created_user = created_user_response.data;
    await this.neo4jdbCreateUserService
      .emit('create_user_request', created_user as UserDoc)
      .toPromise();
    // Return success response
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_CREATED,
      data: created_user as UserDoc,
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
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
    };
  }
}
