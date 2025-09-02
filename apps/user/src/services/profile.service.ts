import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
export class ProfileService {
  private readonly logger: Logger;
  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    this.logger = new Logger(ProfileService.name);
  }

  async getUserProfile(input: { user_id: string }): Promise<Response<UserDoc>> {
    try {
      // Check if user exists
      const { user_id } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error getting user profile: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async updateUserDisplayName(input: {
    user_id: string;
    display_name: string;
  }): Promise<Response<UserDoc>> {
    try {
      const { user_id, display_name } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.display_name = display_name;
      await user.save();
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error updating user display name: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async updateUserBio(input: {
    user_id: string;
    bio: string;
  }): Promise<Response<UserDoc>> {
    try {
      const { user_id, bio } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.bio = bio;
      await user.save();
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error updating user bio: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async updateUserAvatar(input: {
    user_id: string;
    avatar_ipfs_hash: string;
    avatar_fallback_url: string;
  }): Promise<Response<UserDoc>> {
    try {
      // Check if user exists
      const { user_id, avatar_ipfs_hash, avatar_fallback_url } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.avatar_ipfs_hash = avatar_ipfs_hash;
      user.avatar_fallback_url = avatar_fallback_url;
      await user.save();
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.PROFILE_PICTURE_UPLOADED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error updating user avatar: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async updateUserRole(input: {
    user_id: string;
    role: string;
  }): Promise<Response<UserDoc>> {
    try {
      const { user_id, role } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: USER_CONSTANTS.STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.role = role;
      await user.save();
      return {
        success: true,
        statusCode: USER_CONSTANTS.STATUS_CODES.SUCCESS,
        message: ERROR_MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error updating user role: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }
}
