import { Injectable, HttpStatus } from '@nestjs/common';

// Interfaces
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';

// Models
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { DeviceFingerprint } from '../schemas/device-fingerprint.schema';

// Constants Import
import { MESSAGES } from '../constants/error-messages.constants';
import { SessionService } from './session.service';

@Injectable()
export class InfoService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(DeviceFingerprint.name)
    private deviceFingerprintModel: Model<DeviceFingerprint>,
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
        updatedAt: 0,
        createdAt: 0,
      },
    );
    if (!user) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
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
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.INVALID_ACCESS_TOKEN,
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
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
      data: user as UserDoc,
    };
  }

  async getUserInfoByUserId(user_id: string): Promise<Response<UserDoc>> {
    // Check if user exists
    const user = await this.userModel.findById(user_id, {
      updatedAt: 0,
      createdAt: 0,
    });
    if (!user) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
      data: user as UserDoc,
    };
  }

  async getUserInfoByFingerprintHashed(
    fingerprint_hashed: string,
  ): Promise<Response<UserDoc[]>> {
    const device_fingerprints = await this.deviceFingerprintModel.find({
      fingerprint_hashed: fingerprint_hashed,
    });
    if (device_fingerprints.length === 0) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }

    const users: UserDoc[] = [];
    for (const device_fingerprint of device_fingerprints) {
      const user = await this.userModel.findById(device_fingerprint.user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (user) {
        users.push(user as UserDoc);
      }
    }

    if (users.length === 0) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_INFO_FETCHED,
      data: users as unknown as UserDoc[],
    };
  }

  async existUserByEmailOrUsername(input: {
    email_or_username: string;
  }): Promise<Response> {
    const { email_or_username } = input;
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
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.USER_INFO.USER_NOT_FOUND,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.USER_FOUND,
    };
  }
}
