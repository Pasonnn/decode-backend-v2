import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getUserProfile(input: { user_id: string }): Promise<Response<UserDoc>> {
    try {
      // Check if user exists
      const { user_id } = input;
      const user = await this.userModel.findById(user_id);
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
      throw new InternalServerErrorException(error);
    }
  }

  async setProfilePicture(input: {
    user_id: string;
    avatar_ipfs_hash: string;
    avatar_fallback_url: string;
  }): Promise<Response<UserDoc>> {
    try {
      // Check if user exists
      const { user_id, avatar_ipfs_hash, avatar_fallback_url } = input;
      const user = await this.userModel.findById(user_id);
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
      throw new InternalServerErrorException(error);
    }
  }
}
