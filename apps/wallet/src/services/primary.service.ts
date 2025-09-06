import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Models
import { Wallet } from '../schemas/wallet.schema';

// Interfaces
import { Response } from '../interfaces/response.interface';
import { WalletDoc } from '../interfaces/wallet-doc.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

@Injectable()
export class PrimaryService {
  private readonly logger = new Logger(PrimaryService.name);
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private cryptoUtils: CryptoUtils,
  ) {}

  async generatePrimaryWalletChallenge(input: {
    user_id: string;
    wallet_address: string;
  }): Promise<Response> {
    try {
      const { user_id, wallet_address } = input;
      const wallet = await this.walletModel.findOne({
        user_id: new Types.ObjectId(user_id),
        address: wallet_address,
      });
      if (!wallet) {
        return {
          success: false,
          statusCode: 400,
          message: 'Wallet not found',
        };
      }
      const isPrimaryWallet = await this.isPrimaryWallet({
        address: wallet_address,
      });
      if (isPrimaryWallet) {
        return {
          success: false,
          statusCode: 400,
          message: 'Wallet is already primary',
        };
      }
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address: wallet_address,
        message: `Welcome to Decode Network! To set your wallet (${wallet_address.slice(0, 6)}...${wallet_address.slice(-4)}) as primary, please sign this message with your wallet. 
          This cryptographic signature proves you control your wallet without revealing any sensitive information. 
          By signing this message, you are requesting access to your wallet. 
          This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.`,
      });
      if (!nonceMessage) {
        return {
          success: false,
          statusCode: 400,
          message: 'Failed to generate primary wallet challenge',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Primary wallet challenge generated successfully',
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to generate primary wallet challenge',
        error: error as string,
      };
    }
  }

  async validatePrimaryWalletChallenge(input: {
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
          message: 'Invalid primary wallet challenge',
        };
      }
      const setPrimaryWallet = await this.setPrimaryWallet({
        user_id,
        wallet_address: address,
      });
      if (!setPrimaryWallet.success) {
        return setPrimaryWallet;
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Primary wallet challenge validated successfully',
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to validate primary wallet challenge',
        error: error as string,
      };
    }
  }

  async unsetPrimaryWallet(input: {
    user_id: string;
    wallet_address: string;
  }): Promise<Response> {
    try {
      const { user_id, wallet_address } = input;
      const isPrimaryWallet = await this.isPrimaryWallet({
        address: wallet_address,
      });
      if (!isPrimaryWallet) {
        return {
          success: false,
          statusCode: 400,
          message: 'Wallet is not primary',
        };
      }
      const unsetPrimaryWallet = await this.walletModel.findOneAndUpdate(
        {
          user_id: new Types.ObjectId(user_id),
          address: wallet_address,
        },
        { is_primary: false },
      );
      if (!unsetPrimaryWallet) {
        return {
          success: false,
          statusCode: 400,
          message: 'Failed to unset primary wallet',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Primary wallet unset successfully',
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to unset primary wallet',
        error: error as string,
      };
    }
  }

  private async setPrimaryWallet(input: {
    user_id: string;
    wallet_address: string;
  }): Promise<Response> {
    try {
      const { user_id, wallet_address } = input;
      const wallet = await this.walletModel.findOneAndUpdate(
        {
          user_id: new Types.ObjectId(user_id),
          address: wallet_address,
        },
        { is_primary: true },
      );
      if (!wallet) {
        return {
          success: false,
          statusCode: 400,
          message: 'Wallet not found',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Primary wallet set successfully',
        data: wallet as WalletDoc,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to set primary wallet',
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
