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
import { UserDoc } from '../interfaces/user-doc.interface';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class UsernameService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('EMAIL_SERVICE') private readonly emailService: ClientProxy,
    @Inject('NEO4JDB_SYNC_SERVICE')
    private readonly neo4jdbUpdateUserService: ClientProxy,
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly metricsService?: MetricsService,
  ) {
    this.logger = new Logger(UsernameService.name);
  }

  async changeUsernameInitiate(input: {
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
      if (
        user.last_username_change &&
        user.last_username_change >
          new Date(Date.now() - USER_CONSTANTS.USERNAME.CHANGE_COOLDOWN)
      ) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.USERNAME.USERNAME_CHANGE_COOLDOWN_ACTIVE,
        };
      }
      const sendEmailVerificationResponse = await this.sendEmailVerification({
        user_id: user_id,
        email: user.email,
      });
      if (!sendEmailVerificationResponse.success) {
        this.metricsService?.increment('user.username.changed', 1, {
          operation: 'changeUsernameInitiate',
          status: 'failed',
        });
        return sendEmailVerificationResponse as Response<void>;
      }

      // Record business metric
      this.metricsService?.increment('user.username.changed', 1, {
        operation: 'changeUsernameInitiate',
        status: 'success',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_VERIFICATION_SENT,
      };
    } catch (error: unknown) {
      this.metricsService?.increment('user.username.changed', 1, {
        operation: 'changeUsernameInitiate',
        status: 'failed',
      });
      this.logger.error(`Error changing username initiate: ${error as string}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  async verifyUsernameCode(input: {
    user_id: string;
    code: string;
  }): Promise<Response<void>> {
    const { code, user_id } = input;
    const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.USERNAME_CHANGE}:${code}`;
    const verification_code_value = (await this.redisInfrastructure.get(
      verification_code_key,
    )) as { user_id: string; verification_code: string };
    if (!verification_code_value) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USERNAME.USERNAME_CHANGE_CODE_INVALID,
      };
    }
    if (verification_code_value.user_id !== user_id) {
      return {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: MESSAGES.USERNAME.USERNAME_CHANGE_CODE_INVALID,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USERNAME_CHANGE_CODE_VERIFIED,
    };
  }

  async changeUsername(input: {
    user_id: string;
    new_username: string;
    code: string;
  }): Promise<Response<void>> {
    const { user_id, new_username, code } = input;
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
    if (user.username === new_username) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USERNAME.USERNAME_ALREADY_EXISTS,
      };
    }
    const verifyUsernameCodeResponse = await this.verifyUsernameCode({
      user_id,
      code,
    });
    if (!verifyUsernameCodeResponse.success) {
      return verifyUsernameCodeResponse;
    }
    await this.redisInfrastructure.del(
      `${USER_CONSTANTS.REDIS.KEYS.USERNAME_CHANGE}:${code}`,
    );
    await this.userModel.findByIdAndUpdate(user_id, {
      username: new_username,
      last_username_change: new Date(),
    });
    const updated_user = await this.userModel.findById(user_id, {
      password_hashed: 0,
      email: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    await this.neo4jdbUpdateUserService
      .emit('update_user_request', updated_user as UserDoc)
      .toPromise();

    // Record business metric
    this.metricsService?.increment('user.username.changed', 1, {
      operation: 'changeUsername',
      status: 'success',
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USERNAME_CHANGED,
    };
  }
  catch(error: unknown) {
    this.metricsService?.increment('user.username.changed', 1, {
      operation: 'changeUsername',
      status: 'failed',
    });
    this.logger.error(`Error changing username: ${error as string}`);
    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: MESSAGES.SEARCH.SEARCH_FAILED,
    };
  }

  private async sendEmailVerification(input: {
    user_id: string;
    email: string;
  }): Promise<Response> {
    try {
      const { user_id, email } = input;
      const verification_code = uuidv4().slice(
        0,
        USER_CONSTANTS.VERIFICATION.CODE_LENGTH,
      );
      const verification_code_key = `${USER_CONSTANTS.REDIS.KEYS.USERNAME_CHANGE}:${verification_code}`;
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
        type: USER_CONSTANTS.EMAIL.TYPES.USERNAME_CHANGE_VERIFY,
        data: {
          email: email,
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
}
