import {
  Injectable,
  InternalServerErrorException,
  Logger,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Interfaces Import
import { UserDoc } from '../interfaces/user-doc.interface';
import { Response } from '../interfaces/response.interface';

// Schema Import
import { User } from '../schemas/user.schema';

// Constants Import
import { MESSAGES } from '../constants/messages.constants';
import { ClientProxy } from '@nestjs/microservices';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class ProfileService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('NEO4JDB_SYNC_SERVICE')
    private readonly neo4jdbUpdateUserService: ClientProxy,
    private readonly metricsService?: MetricsService,
  ) {
    this.logger = new Logger(ProfileService.name);
  }

  async getUserProfile(input: { user_id: string }): Promise<Response<UserDoc>> {
    const startTime = Date.now();
    try {
      // Check if user exists
      const { user_id } = input;
      const user = await this.userModel.findOne(
        { _id: user_id },
        {
          password_hashed: 0,
          email: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      );

      const duration = Date.now() - startTime;
      this.metricsService?.timing('db.mongodb.query.duration', duration, {
        collection: 'users',
        operation: 'findOne',
      });
      this.metricsService?.increment('db.mongodb.query.count', 1, {
        collection: 'users',
        operation: 'findOne',
      });

      if (duration > 100) {
        this.metricsService?.increment('db.mongodb.query.slow', 1, {
          collection: 'users',
          operation: 'findOne',
        });
      }

      if (!user || !user.is_active) {
        this.metricsService?.increment('user.profile.viewed', 1, {
          operation: 'getUserProfile',
          status: 'not_found',
        });
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      // Record business metric
      this.metricsService?.increment('user.profile.viewed', 1, {
        operation: 'getUserProfile',
        status: 'success',
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('db.mongodb.query.duration', duration, {
        collection: 'users',
        operation: 'findOne',
        error: 'true',
      });
      this.metricsService?.increment('db.mongodb.query.errors', 1, {
        collection: 'users',
        operation: 'findOne',
      });
      this.logger.error(`Error getting user profile: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getMyProfile(input: { user_id: string }): Promise<Response<UserDoc>> {
    const startTime = Date.now();
    try {
      // Check if user exists
      const { user_id } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });

      const duration = Date.now() - startTime;
      this.metricsService?.timing('db.mongodb.query.duration', duration, {
        collection: 'users',
        operation: 'findById',
      });
      this.metricsService?.increment('db.mongodb.query.count', 1, {
        collection: 'users',
        operation: 'findById',
      });

      if (duration > 100) {
        this.metricsService?.increment('db.mongodb.query.slow', 1, {
          collection: 'users',
          operation: 'findById',
        });
      }

      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_FETCHED,
        data: user as UserDoc,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService?.timing('db.mongodb.query.duration', duration, {
        collection: 'users',
        operation: 'findById',
        error: 'true',
      });
      this.metricsService?.increment('db.mongodb.query.errors', 1, {
        collection: 'users',
        operation: 'findById',
      });
      this.logger.error(`Error getting my profile: ${error as string}`);
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
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.display_name = display_name;
      const saveStartTime = Date.now();
      await user.save();
      const saveDuration = Date.now() - saveStartTime;
      this.metricsService?.timing('db.mongodb.query.duration', saveDuration, {
        collection: 'users',
        operation: 'save',
      });
      this.metricsService?.increment('db.mongodb.query.count', 1, {
        collection: 'users',
        operation: 'save',
      });
      if (saveDuration > 100) {
        this.metricsService?.increment('db.mongodb.query.slow', 1, {
          collection: 'users',
          operation: 'save',
        });
      }
      // Record business metric
      this.metricsService?.increment('user.profile.updated', 1, {
        operation: 'updateDisplayName',
        status: 'success',
      });
      await this.neo4jdbUpdateUserService
        .emit('update_user_request', user as UserDoc)
        .toPromise();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_UPDATED,
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
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.bio = bio;
      const saveStartTime = Date.now();
      await user.save();
      const saveDuration = Date.now() - saveStartTime;
      this.metricsService?.timing('db.mongodb.query.duration', saveDuration, {
        collection: 'users',
        operation: 'save',
      });
      this.metricsService?.increment('db.mongodb.query.count', 1, {
        collection: 'users',
        operation: 'save',
      });
      if (saveDuration > 100) {
        this.metricsService?.increment('db.mongodb.query.slow', 1, {
          collection: 'users',
          operation: 'save',
        });
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_UPDATED,
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
  }): Promise<Response<UserDoc>> {
    try {
      // Check if user exists
      const { user_id, avatar_ipfs_hash } = input;
      const user = await this.userModel.findById(user_id, {
        password_hashed: 0,
        updatedAt: 0,
        createdAt: 0,
      });
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.avatar_ipfs_hash = avatar_ipfs_hash;
      const saveStartTime = Date.now();
      await user.save();
      const saveDuration = Date.now() - saveStartTime;
      this.metricsService?.timing('db.mongodb.query.duration', saveDuration, {
        collection: 'users',
        operation: 'save',
      });
      this.metricsService?.increment('db.mongodb.query.count', 1, {
        collection: 'users',
        operation: 'save',
      });
      if (saveDuration > 100) {
        this.metricsService?.increment('db.mongodb.query.slow', 1, {
          collection: 'users',
          operation: 'save',
        });
      }
      await this.neo4jdbUpdateUserService
        .emit('update_user_request', user as UserDoc)
        .toPromise();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_PICTURE_UPLOADED,
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
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.PROFILE.PROFILE_NOT_FOUND,
        };
      }
      user.role = role;
      const saveStartTime = Date.now();
      await user.save();
      const saveDuration = Date.now() - saveStartTime;
      this.metricsService?.timing('db.mongodb.query.duration', saveDuration, {
        collection: 'users',
        operation: 'save',
      });
      this.metricsService?.increment('db.mongodb.query.count', 1, {
        collection: 'users',
        operation: 'save',
      });
      if (saveDuration > 100) {
        this.metricsService?.increment('db.mongodb.query.slow', 1, {
          collection: 'users',
          operation: 'save',
        });
      }
      await this.neo4jdbUpdateUserService
        .emit('update_user_request', user as UserDoc)
        .toPromise();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error updating user role: ${error as string}`);
      throw new InternalServerErrorException(error);
    }
  }
}
