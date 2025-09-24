import { Injectable, HttpStatus, forwardRef, Inject } from '@nestjs/common';

// Interfaces
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';

// Models
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceFingerprint } from '../schemas/device-fingerprint.schema';

// Constants Import
import { MESSAGES } from '../constants/error-messages.constants';
import { SessionService } from './session.service';
import { UserServiceClient } from '../infrastructure/external-services/auth-service.client';

@Injectable()
export class InfoService {
  constructor(
    @InjectModel(DeviceFingerprint.name)
    private deviceFingerprintModel: Model<DeviceFingerprint>,
    private readonly userServiceClient: UserServiceClient,
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
  ) {}

  async getUserInfoByEmailOrUsername(
    email_or_username: string,
  ): Promise<Response<UserDoc>> {
    // Check if user exists
    const user_response = await this.userServiceClient.getInfoByEmailOrUsername(
      {
        email_or_username: email_or_username,
      },
    );
    if (!user_response.success) {
      return user_response;
    }
    const user = user_response.data as UserDoc;
    if (!user_response.success || !user) {
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
      data: user,
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
    const user_by_id_response = await this.userServiceClient.getInfoByUserId({
      user_id: user_id,
    });
    if (!user_by_id_response.success) {
      return user_by_id_response;
    }
    const user = user_by_id_response.data as UserDoc;
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
      data: user,
    };
  }

  async getUserInfoByUserId(user_id: string): Promise<Response<UserDoc>> {
    // Check if user exists
    const user_by_id_response = await this.userServiceClient.getInfoByUserId({
      user_id: user_id,
    });
    if (!user_by_id_response.success) {
      return user_by_id_response;
    }
    const user = user_by_id_response.data as UserDoc;
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
      data: user,
    };
  }

  async getUserInfoByFingerprintHashed(
    fingerprint_hashed: string,
  ): Promise<Response> {
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
      const user_by_id_response = await this.userServiceClient.getInfoByUserId({
        user_id: device_fingerprint.user_id.toString(),
      });
      if (!user_by_id_response.success) {
        continue;
      }
      const user = user_by_id_response.data as UserDoc;

      if (user) {
        users.push(user);
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
    const user_response =
      await this.userServiceClient.checkUserExistsByEmailOrUsername({
        email_or_username: email_or_username,
      });
    if (!user_response.success) {
      return user_response;
    }
    if (!user_response.data) {
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
