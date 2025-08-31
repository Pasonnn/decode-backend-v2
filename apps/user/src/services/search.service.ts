import { Injectable } from '@nestjs/common';
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
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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
      console.error(`Error searching users: ${error as string}`);
      return {
        success: false,
        statusCode: USER_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }
}
