import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Models
import { Wallet } from '../schemas/wallet.schema';

// Interfaces
import { Response } from '../interfaces/response.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

// Constants
import { WALLET_CONSTANTS } from '../constants/wallet.constants';
import { MESSAGES } from '../constants/messages.constants';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);
  constructor(
    private readonly cryptoUtils: CryptoUtils,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private readonly metricsService?: MetricsService,
  ) {}

  async generateLinkChallenge(input: { address: string }): Promise<Response> {
    try {
      const { address } = input;
      const address_lowercase = address.toLowerCase();
      // Check if wallet is already linked
      const existingWallet = await this.walletExists({
        address: address_lowercase,
      });
      if (existingWallet) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED,
        };
      }
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address: address_lowercase,
        message: WALLET_CONSTANTS.CHALLENGE.NONCE.MESSAGE_TEMPLATE.LINK,
      });
      if (!nonceMessage) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.CHALLENGE.CHALLENGE_GENERATION_FAILED,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.CHALLENGE_GENERATED,
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.CHALLENGE.CHALLENGE_GENERATION_FAILED,
        error: error as string,
      };
    }
  }

  async validateLinkChallenge(input: {
    address: string;
    signature: string;
    user_id: string;
  }): Promise<Response> {
    try {
      const { address, signature, user_id } = input;
      const address_lowercase = address.toLowerCase();
      // Check if amount of wallets is exceeded
      const countWallets = await this.countWallets({
        user_id: user_id,
      });
      if (countWallets >= WALLET_CONSTANTS.LIMITS.MAX_WALLETS_PER_USER) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.WALLET_LINK.MAX_WALLETS_EXCEEDED,
        };
      }
      // Check if wallet is already linked
      const existingWallet = await this.walletExists({
        address: address_lowercase,
      });
      if (existingWallet) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED,
        };
      }
      // Validate signature
      const signatureIsValid = await this.cryptoUtils.validateNonceMessage({
        address: address_lowercase,
        signature,
      });
      if (!signatureIsValid) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
        };
      }
      // Link wallet
      const linkStartTime = Date.now();
      const linkedWallet = await this.linkWallet({
        user_id,
        address: address_lowercase,
      });
      const linkDuration = Date.now() - linkStartTime;

      if (!linkedWallet.success) {
        this.metricsService?.timing('wallet.operation.duration', linkDuration, {
          operation: 'validateLinkChallenge',
          status: 'failed',
        });
        this.metricsService?.increment('wallet.linked', 1, {
          operation: 'validateLinkChallenge',
          status: 'failed',
        });
        return linkedWallet;
      }

      // Record business metrics
      this.metricsService?.timing('wallet.operation.duration', linkDuration, {
        operation: 'validateLinkChallenge',
        status: 'success',
      });
      this.metricsService?.increment('wallet.linked', 1, {
        operation: 'validateLinkChallenge',
        status: 'success',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.LINK_CHALLENGE_VALIDATED,
      };
    } catch (error) {
      this.metricsService?.increment('wallet.linked', 1, {
        operation: 'validateLinkChallenge',
        status: 'failed',
      });
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
        error: error as string,
      };
    }
  }

  async unlinkWallet(input: {
    user_id: string;
    address: string;
  }): Promise<Response> {
    try {
      const { user_id, address } = input;
      const address_lowercase = address.toLowerCase();
      const validUnlinkWallet = await this.validUnlinkWallet({
        address: address_lowercase,
        user_id,
      });
      if (!validUnlinkWallet.success) {
        return validUnlinkWallet;
      }
      const unlinkStartTime = Date.now();
      const deletedWallet = await this.walletModel.deleteOne({
        address: address_lowercase,
        user_id: new Types.ObjectId(user_id),
      });
      const unlinkDuration = Date.now() - unlinkStartTime;

      if (!deletedWallet || deletedWallet.deletedCount === 0) {
        this.metricsService?.timing(
          'wallet.operation.duration',
          unlinkDuration,
          {
            operation: 'unlinkWallet',
            status: 'failed',
          },
        );
        this.metricsService?.increment('wallet.unlinked', 1, {
          operation: 'unlinkWallet',
          status: 'failed',
        });
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.WALLET_LINK.WALLET_UNLINKING_FAILED,
        };
      }

      // Record business metrics
      this.metricsService?.timing('wallet.operation.duration', unlinkDuration, {
        operation: 'unlinkWallet',
        status: 'success',
      });
      this.metricsService?.increment('wallet.unlinked', 1, {
        operation: 'unlinkWallet',
        status: 'success',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.WALLET_UNLINKED,
      };
    } catch (error) {
      this.metricsService?.increment('wallet.unlinked', 1, {
        operation: 'unlinkWallet',
        status: 'failed',
      });
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.WALLET_LINK.WALLET_UNLINKING_FAILED,
        error: error as string,
      };
    }
  }

  async getWallets(input: { user_id: string }): Promise<Response> {
    try {
      const { user_id } = input;
      const wallets = await this.walletModel.find({
        user_id: new Types.ObjectId(user_id),
      });
      if (!wallets) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.DATABASE.WALLET_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.WALLETS_FETCHED,
        data: wallets,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.DATABASE.QUERY_FAILED,
        error: error as string,
      };
    }
  }

  private async linkWallet(input: {
    user_id: string;
    address: string;
  }): Promise<Response> {
    try {
      const { user_id, address } = input;
      const address_lowercase = address.toLowerCase();
      const existingWallet = await this.walletExists({
        address: address_lowercase,
      });
      if (existingWallet) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED,
        };
      }
      const newWallet = await this.walletModel.create({
        user_id: new Types.ObjectId(user_id),
        address: address_lowercase,
      });
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.WALLET_LINKED,
        data: newWallet,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.WALLET_LINK.WALLET_LINKING_FAILED,
        error: error as string,
      };
    }
  }

  private async isPrimaryWallet(input: { address: string }): Promise<boolean> {
    try {
      const { address } = input;
      const address_lowercase = address.toLowerCase();
      const primaryWallet = await this.walletModel.findOne({
        address: address_lowercase,
        is_primary: true,
      });
      if (primaryWallet) {
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(error as string);
      return false;
    }
  }

  private async validUnlinkWallet(input: {
    address: string;
    user_id: string;
  }): Promise<Response> {
    const { address, user_id } = input;
    const address_lowercase = address.toLowerCase();
    const wallet = await this.walletModel.findOne({
      address: address_lowercase,
      user_id: new Types.ObjectId(user_id),
    });
    if (!wallet) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.WALLET_LINK.WALLET_NOT_LINKED,
      };
    }
    if (wallet.is_primary) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_CANNOT_UNLINK,
      };
    }
    if (wallet.user_id.toString() !== user_id) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.WALLET_LINK.WALLET_NOT_LINKED,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.WALLET_VERIFIED,
    };
  }

  private async walletExists(input: { address: string }): Promise<boolean> {
    const { address } = input;
    const address_lowercase = address.toLowerCase();
    const wallet = await this.walletModel.findOne({
      address: address_lowercase,
    });
    return wallet ? true : false;
  }

  private async countWallets(input: { user_id: string }): Promise<number> {
    const { user_id } = input;
    const count = await this.walletModel.countDocuments({
      user_id: new Types.ObjectId(user_id),
    });
    return count;
  }
}
