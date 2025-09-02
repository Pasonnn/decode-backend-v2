import { Injectable } from '@nestjs/common';

// Interfaces
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';

// Models
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';
import { SessionService } from './session.service';

@Injectable()
export class InfoService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly sessionService: SessionService,
  ) {}

  async getUserInfoByEmailOrUsername(
    email_or_username: string,
  ): Promise<Response<UserDoc>> {
    // Check if user exists
    const user = await this.userModel.findOne(
      {
        $or: [{ email: email_or_username }, { username: email_or_username }],
      },
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
        message: ERROR_MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.USER_INFO_FETCHED,
      data: user as UserDoc,
    };
  }

  async getUserInfoByAccessToken(
    access_token: string,
  ): Promise<Response<UserDoc>> {
    // Validate access token
    const validate_access_token_response =
      await this.sessionService.validateAccess(access_token);
    if (
      !validate_access_token_response.success ||
      !validate_access_token_response.data
    ) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.USER_INFO.INVALID_ACCESS_TOKEN,
      };
    }
    const user_id = validate_access_token_response.data.user_id;
    // Get user info
    const user = await this.userModel.findById(user_id, {
      password_hashed: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    if (!user) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.USER_INFO_FETCHED,
      data: user as UserDoc,
    };
  }

  async getUserInfoByUserId(user_id: string): Promise<Response<UserDoc>> {
    // Check if user exists
    const user = await this.userModel.findById(user_id, {
      password_hashed: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    if (!user) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.USER_INFO_FETCHED,
      data: user as UserDoc,
    };
  }

  async existUserByEmailOrUsername(
    email_or_username: string,
  ): Promise<Response> {
    const user = await this.userModel.findOne({
      $or: [{ email: email_or_username }, { username: email_or_username }],
      password_hashed: 0,
      updatedAt: 0,
      createdAt: 0,
    });
    if (!user) {
      return {
        success: false,
        statusCode: AUTH_CONSTANTS.STATUS_CODES.BAD_REQUEST,
        message: ERROR_MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: AUTH_CONSTANTS.STATUS_CODES.SUCCESS,
      message: ERROR_MESSAGES.SUCCESS.USER_FOUND,
    };
  }
}
