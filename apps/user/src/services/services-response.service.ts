import {
  Injectable,
  Logger,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Interfaces Import
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';

// Constants Import
import { AUTH_CONSTANTS } from '../constants/auth.constants';

// Schema Import
import { User } from '../schemas/user.schema';

// Constants Import
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class ServicesResponseService {
  private readonly logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.logger = new Logger(ServicesResponseService.name);
  }

  async checkUserExistsByEmailOrUsername(input: {
    email_or_username: string;
  }): Promise<Response<UserDoc>> {
    const { email_or_username } = input;
    try {
      const user = await this.userModel.findOne({
        $or: [{ email: email_or_username }, { username: email_or_username }],
      });
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.USER_INFO.USER_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error checking user exists: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async createUser(input: {
    email: string;
    username: string;
    password_hashed: string;
  }): Promise<Response<UserDoc>> {
    const { email, username, password_hashed } = input;
    try {
      const user = await this.userModel.create({
        email,
        username,
        password_hashed,
        display_name: username,
        bio: AUTH_CONSTANTS.USER.DEFAULT_BIO,
        avatar_ipfs_hash: AUTH_CONSTANTS.USER.DEFAULT_AVATAR_IPFS_HASH,
        role: AUTH_CONSTANTS.USER.DEFAULT_ROLE,
        last_login: new Date(),
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_CREATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error creating user: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async changePassword(input: {
    user_id: string;
    password_hashed: string;
  }): Promise<Response<UserDoc>> {
    const { user_id, password_hashed } = input;
    try {
      const user = await this.userModel.findById(user_id);
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.USER_INFO.USER_NOT_FOUND,
        };
      }
      user.password_hashed = password_hashed;
      await user.save();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error changing password: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getInfoByEmailOrUsername(input: {
    email_or_username: string;
  }): Promise<Response<UserDoc>> {
    const { email_or_username } = input;
    try {
      const user = await this.userModel.findOne({
        $or: [{ username: email_or_username }, { email: email_or_username }],
      });
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.USER_INFO.USER_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(
        `Error getting info by email or username: ${error as string}`,
      );
      throw new InternalServerErrorException(error);
    }
  }

  async getInfoByUserId(input: {
    user_id: string;
  }): Promise<Response<UserDoc>> {
    const { user_id } = input;
    try {
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
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error getting info by user id: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getInfoWithPasswordByUserId(input: {
    user_id: string;
  }): Promise<Response<UserDoc>> {
    const { user_id } = input;
    try {
      const user = await this.userModel.findById(user_id, {
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
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(
        `Error getting info with password by user id: ${error as string}`,
      );
      throw new InternalServerErrorException(error);
    }
  }

  async updateUserLastLogin(input: {
    user_id: string;
  }): Promise<Response<UserDoc>> {
    const { user_id } = input;
    try {
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
      user.last_login = new Date();
      await user.save();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.USER_UPDATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error updating user last login: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }
}
