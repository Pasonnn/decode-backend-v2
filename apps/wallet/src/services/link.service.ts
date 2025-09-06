import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);
  constructor(
    private readonly cryptoUtils: CryptoUtils,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
  ) {}

  async generateLinkChallenge(input: { address: string }): Promise<Response> {
    try {
      const { address } = input;
      // Check if wallet is already linked
      const existingWallet = await this.walletModel.findOne({ address });
      if (existingWallet) {
        return {
          success: false,
          statusCode: 400,
          message: MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED,
        };
      }
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address,
        message: WALLET_CONSTANTS.CHALLENGE.NONCE.MESSAGE_TEMPLATE.LINK,
      });
      if (!nonceMessage) {
        return {
          success: false,
          statusCode: 400,
          message: 'Failed to generate link challenge',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Link challenge generated successfully',
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
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
      const signatureIsValid = await this.cryptoUtils.validateNonceMessage({
        address,
        signature,
      });
      if (!signatureIsValid) {
        return {
          success: false,
          statusCode: 400,
          message: 'Invalid link challenge',
        };
      }
      // Link wallet
      const linkedWallet = await this.linkWallet({ user_id, address });
      if (!linkedWallet.success) {
        return linkedWallet;
      }
      return {
        success: true,
        statusCode: 200,
        message: MESSAGES.SUCCESS.LINK_CHALLENGE_VALIDATED,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
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
      const isPrimaryWallet = await this.isPrimaryWallet({ address });
      if (isPrimaryWallet) {
        return {
          success: false,
          statusCode: 400,
          message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_CANNOT_UNLINK,
        };
      }
      await this.walletModel.deleteOne({
        address,
        user_id: new Types.ObjectId(user_id),
      });
      return {
        success: true,
        statusCode: 200,
        message: MESSAGES.SUCCESS.WALLET_UNLINKED,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
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
          statusCode: 400,
          message: MESSAGES.DATABASE.WALLET_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: MESSAGES.SUCCESS.WALLETS_FETCHED,
        data: wallets,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
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
      const existingWallet = await this.walletModel.findOne({ address });
      if (existingWallet) {
        return {
          success: false,
          statusCode: 400,
          message: MESSAGES.WALLET_LINK.WALLET_ALREADY_LINKED,
        };
      }
      const newWallet = await this.walletModel.create({
        user_id: new Types.ObjectId(user_id),
        address,
      });
      return {
        success: true,
        statusCode: 200,
        message: MESSAGES.SUCCESS.WALLET_LINKED,
        data: newWallet,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: MESSAGES.WALLET_LINK.WALLET_LINKING_FAILED,
        error: error as string,
      };
    }
  }

  private async isPrimaryWallet(input: { address: string }): Promise<boolean> {
    try {
      const { address } = input;
      const primaryWallet = await this.walletModel.findOne({
        address,
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
}
