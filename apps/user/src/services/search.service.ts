import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Interfaces Import
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';

// Schema Import
import { User } from '../schemas/user.schema';

// Constants Import
import { USER_CONSTANTS } from '../constants/user.constants';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

@Injectable()
export class SearchService {
  private readonly logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.logger = new Logger(SearchService.name);
  }

  async searchUsers(input: {
    username_or_email: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
  }): Promise<Response<UserDoc[]>> {
    const { username_or_email, page, limit, sortBy, sortOrder } = input;
    try {
      const users = await this.userModel
        .find({
          $or: [{ username: username_or_email }, { email: username_or_email }],
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ [sortBy]: sortOrder as 'asc' | 'desc' | 1 | -1 });
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.SEARCH_SUCCESSFUL,
        data: users as UserDoc[],
      };
    } catch (error: unknown) {
      this.logger.error(`Error searching users: ${error as string}`);
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  async searchExistingUsername(input: {
    username: string;
  }): Promise<Response<void>> {
    try {
      const { username } = input;
      const user = await this.userModel.findOne(
        { username: username },
        {
          password_hashed: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      );
      if (user) {
        return {
          success: true,
          statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
          message: ERROR_MESSAGES.SUCCESS.USERNAME_ALREADY_EXISTS,
        };
      }
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.USERNAME_AVAILABLE,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error searching existing username: ${error as string}`,
      );
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }

  async searchExistingEmail(input: { email: string }): Promise<Response<void>> {
    try {
      const { email } = input;
      const user = await this.userModel.findOne(
        { email: email },
        {
          password_hashed: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      );
      if (user) {
        return {
          success: true,
          statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
          message: ERROR_MESSAGES.SUCCESS.EMAIL_ALREADY_EXISTS,
        };
      }
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.EMAIL_AVAILABLE,
      };
    } catch (error: unknown) {
      this.logger.error(`Error searching existing email: ${error as string}`);
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }
}
