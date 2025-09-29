import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Interfaces Import
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';
import { PaginationResponse } from '../interfaces/pagination-response.interface';

// Schema Import
import { User } from '../schemas/user.schema';

// Constants Import
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class SearchService {
  private readonly logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.logger = new Logger(SearchService.name);
  }

  async searchUsers(input: {
    email_or_username: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
  }): Promise<PaginationResponse<UserDoc[]>> {
    const { email_or_username, page, limit, sortBy, sortOrder } = input;
    try {
      const users = await this.userModel
        .find({
          $or: [
            { username: { $regex: email_or_username, $options: 'i' } },
            { display_name: { $regex: email_or_username, $options: 'i' } },
          ],
          is_active: true,
        })
        .skip(page * limit)
        .limit(limit)
        .sort({ [sortBy]: sortOrder as 'asc' | 'desc' | 1 | -1 })
        .select({
          email: 0,
          password_hashed: 0,
          updatedAt: 0,
          createdAt: 0,
        });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SEARCH_SUCCESSFUL,
        data: {
          users: users as UserDoc[],
          meta: {
            total: users.length,
            page: page,
            limit: limit,
            is_last_page: users.length < limit,
          },
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Error searching users: ${error as string}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
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
          statusCode: HttpStatus.OK,
          message: MESSAGES.SUCCESS.USERNAME_ALREADY_EXISTS,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USERNAME_AVAILABLE,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error searching existing username: ${error as string}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
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
          statusCode: HttpStatus.OK,
          message: MESSAGES.SUCCESS.EMAIL_ALREADY_EXISTS,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.EMAIL_AVAILABLE,
      };
    } catch (error: unknown) {
      this.logger.error(`Error searching existing email: ${error as string}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.SEARCH.SEARCH_FAILED,
      };
    }
  }
}
