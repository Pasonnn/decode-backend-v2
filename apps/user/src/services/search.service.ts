import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Model, Types } from 'mongoose';
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
    user_id: string;
  }): Promise<PaginationResponse<UserDoc[]>> {
    const { email_or_username, page, limit, sortBy, sortOrder, user_id } =
      input;
    const skip = page * limit;

    try {
      const pipeline: any[] = [
        {
          $search: {
            index: 'user_search', // Atlas Search Index name
            compound: {
              should: [
                {
                  autocomplete: {
                    query: email_or_username,
                    path: 'username',
                    fuzzy: { maxEdits: 1 },
                  },
                },
                {
                  autocomplete: {
                    query: email_or_username,
                    path: 'display_name',
                    fuzzy: { maxEdits: 1 },
                  },
                },
                {
                  text: {
                    query: email_or_username,
                    path: 'email',
                    fuzzy: { maxEdits: 1 },
                  },
                },
              ],
            },
          },
        },
        // Exclude the current user's own document
        {
          $match: {
            _id: { $ne: new Types.ObjectId(user_id) },
          },
        },
        { $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            email: 0,
            password_hashed: 0,
            updatedAt: 0,
            createdAt: 0,
          },
        },
      ];

      const users = await this.userModel.aggregate(pipeline);

      // For total count, run a separate aggregation with $count after $search
      const countPipeline: any[] = [
        {
          $search: {
            index: 'user_search',
            compound: {
              should: [
                {
                  autocomplete: {
                    query: email_or_username,
                    path: 'username',
                    fuzzy: { maxEdits: 1 },
                  },
                },
                {
                  autocomplete: {
                    query: email_or_username,
                    path: 'display_name',
                    fuzzy: { maxEdits: 1 },
                  },
                },
                {
                  text: {
                    query: email_or_username,
                    path: 'email',
                    fuzzy: { maxEdits: 1 },
                  },
                },
              ],
            },
          },
        },
        // Exclude the current user's own document from count as well
        {
          $match: {
            _id: { $ne: new Types.ObjectId(user_id) },
          },
        },
        { $count: 'total' },
      ];

      const countResult = await this.userModel.aggregate(countPipeline);
      const total =
        countResult.length > 0
          ? (countResult[0] as { total: number }).total
          : 0;

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.SEARCH_SUCCESSFUL,
        data: {
          users: users as UserDoc[],
          meta: {
            total: total,
            page: page,
            limit: limit,
            is_last_page: skip + (users as UserDoc[]).length >= total,
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
