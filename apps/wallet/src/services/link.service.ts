import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Models
import { Wallet } from '../schemas/wallet.schema';

// Interfaces
import { Response } from '../interfaces/response.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);
  constructor(
    private readonly cryptoUtils: CryptoUtils,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
  ) {}

  async generateLinkChallenge(input: {
    address: string;
    user_id: string;
  }): Promise<Response> {
    try {
      const { address, user_id } = input;
      // Check if wallet is already linked
      const existingWallet = await this.walletModel.findOne({ address });
      if (existingWallet) {
        return {
          success: false,
          statusCode: 400,
          message: 'Wallet already linked',
        };
      }
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address,
        message: `Welcome to Decode Network! To link your wallet to your account (${user_id}), please sign this message with your wallet. 
        This cryptographic signature proves you control your wallet without revealing any sensitive information. 
        By signing this message, you are requesting access to your wallet. 
        This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.`,
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
        message: 'Failed to generate link challenge',
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
        message: 'Link challenge validated successfully',
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to validate link challenge',
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
          message: 'Primary wallet cannot be unlinked',
        };
      }
      await this.walletModel.deleteOne({
        address,
        user_id: new Types.ObjectId(user_id),
      });
      return {
        success: true,
        statusCode: 200,
        message: 'Wallet unlinked successfully',
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to unlink wallet',
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
          message: 'No wallets found',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Wallets fetched successfully',
        data: wallets,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to get wallets',
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
          message: 'Wallet already linked',
        };
      }
      const newWallet = await this.walletModel.create({
        user_id: new Types.ObjectId(user_id),
        address,
      });
      return {
        success: true,
        statusCode: 200,
        message: 'Wallet linked successfully',
        data: newWallet,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to link wallet',
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
