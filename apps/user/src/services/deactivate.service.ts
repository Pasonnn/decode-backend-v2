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
import { USER_CONSTANTS } from '../constants/user.constants';
import { ClientProxy } from '@nestjs/microservices';
@Injectable()
export class DeactivateService {
  private readonly logger: Logger;
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('NEO4JDB_SYNC_SERVICE')
    private readonly neo4jdbUpdateUserService: ClientProxy,
  ) {
    this.logger = new Logger(DeactivateService.name);
  }

  async deactivateAccount(input: {
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
      user.is_active = false;
      user.last_account_deactivation = new Date();
      await user.save();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.ACCOUNT_DEACTIVATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(MESSAGES.DATABASE.SAVE_FAILED);
    }
  }

  async deleteDeactivatedAccounts(): Promise<Response<void>> {
    try {
      await this.userModel.deleteMany({
        is_active: false,
        last_account_deactivation: {
          $lt: new Date(
            Date.now() - USER_CONSTANTS.ACCOUNT.DEACTIVATION.AUTO_DELETE_AFTER,
          ),
        },
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.DEACTIVATED_ACCOUNTS_PERMANENTLY_DELETED,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting deactivated account: ${error as string}`,
      );
      throw new InternalServerErrorException(MESSAGES.DATABASE.DELETE_FAILED);
    }
  }

  async reactivateAccount(input: {
    user_id: string;
  }): Promise<Response<UserDoc>> {
    const { user_id } = input;
    try {
      const user = await this.userModel.findById(user_id, {
        is_active: true,
      });
      if (!user) {
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: MESSAGES.USER_INFO.USER_NOT_FOUND,
        };
      }
      user.is_active = true;

      await user.save();
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.ACCOUNT_REACTIVATED,
        data: user as UserDoc,
      };
    } catch (error) {
      this.logger.error(`Error reactivating account: ${error as string}`);
      throw new InternalServerErrorException(MESSAGES.DATABASE.SAVE_FAILED);
    }
  }
}
