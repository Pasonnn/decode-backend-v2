import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Models
import { Wallet } from '../schemas/wallet.schema';

// Interfaces
import { Response } from '../interfaces/response.interface';
import { WalletDoc } from '../interfaces/wallet-doc.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';
import { MESSAGES } from '../constants/messages.constants';
import { WALLET_CONSTANTS } from '../constants/wallet.constants';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class PrimaryService {
  private readonly logger = new Logger(PrimaryService.name);
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private cryptoUtils: CryptoUtils,
    private readonly metricsService?: MetricsService,
  ) {}

  async generatePrimaryWalletChallenge(input: {
    user_id: string;
    address: string;
  }): Promise<Response> {
    try {
      const { user_id, address } = input;
      const address_lowercase = address.toLowerCase();
      // Check if wallet is already primary
      const check_valid_primary_wallet = await this.checkValidPrimaryWallet({
        address: address_lowercase,
        user_id,
      });
      if (check_valid_primary_wallet.success) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: check_valid_primary_wallet.message,
        };
      }
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address: address_lowercase,
        message: WALLET_CONSTANTS.CHALLENGE.NONCE.MESSAGE_TEMPLATE.PRIMARY,
      });
      if (!nonceMessage) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_GENERATION_FAILED,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_CHALLENGE_GENERATED,
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_GENERATION_FAILED,
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
      const address_lowercase = address.toLowerCase();
      // Check if wallet is already primary
      const check_valid_primary_wallet = await this.checkValidPrimaryWallet({
        address: address_lowercase,
        user_id,
      });
      if (check_valid_primary_wallet.success) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: check_valid_primary_wallet.message,
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
          message: MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_VALIDATION_FAILED,
        };
      }
      // Set primary wallet
      const setPrimaryWallet = await this.setPrimaryWallet({
        user_id,
        address: address_lowercase,
      });
      if (!setPrimaryWallet.success) {
        this.metricsService?.increment('wallet.primary.set', 1, {
          operation: 'validatePrimaryWalletChallenge',
          status: 'failed',
        });
        return setPrimaryWallet;
      }

      // Record business metric
      this.metricsService?.increment('wallet.primary.set', 1, {
        operation: 'validatePrimaryWalletChallenge',
        status: 'success',
      });

      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_CHALLENGE_VALIDATED,
      };
    } catch (error) {
      this.metricsService?.increment('wallet.primary.set', 1, {
        operation: 'validatePrimaryWalletChallenge',
        status: 'failed',
      });
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_CHALLENGE_VALIDATION_FAILED,
        error: error as string,
      };
    }
  }

  async unsetPrimaryWallet(input: {
    user_id: string;
    address: string;
  }): Promise<Response> {
    try {
      const { user_id, address } = input;
      const address_lowercase = address.toLowerCase();
      // Check if wallet is already primary
      const check_valid_primary_wallet = await this.checkValidPrimaryWallet({
        address: address_lowercase,
        user_id,
      });
      if (!check_valid_primary_wallet.success) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: check_valid_primary_wallet.message,
        };
      }
      // Unset primary wallet
      const unsetPrimaryWallet = await this.walletModel.findOneAndUpdate(
        {
          user_id: new Types.ObjectId(user_id),
          address: address_lowercase,
        },
        { is_primary: false },
      );
      if (!unsetPrimaryWallet) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_UNSET_FAILED,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_UNSET,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_UNSET_FAILED,
        error: error as string,
      };
    }
  }

  async getPrimaryWallet(input: { user_id: string }): Promise<Response> {
    try {
      const { user_id } = input;
      const primaryWallet = await this.walletModel.findOne({
        user_id: new Types.ObjectId(user_id),
        is_primary: true,
      });
      if (!primaryWallet) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_FOUND,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_FETCHED,
        data: primaryWallet as WalletDoc,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_FOUND,
        error: error as string,
      };
    }
  }

  private async setPrimaryWallet(input: {
    user_id: string;
    address: string;
  }): Promise<Response> {
    try {
      const { user_id, address } = input;
      const address_lowercase = address.toLowerCase();
      const check_valid_primary_wallet = await this.checkValidPrimaryWallet({
        address: address_lowercase,
        user_id,
      });
      if (check_valid_primary_wallet.success) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: check_valid_primary_wallet.message,
        };
      }
      const set_primary_wallet = await this.walletModel.findOneAndUpdate(
        {
          address: address_lowercase,
          user_id: new Types.ObjectId(user_id),
        },
        { is_primary: true },
      );
      if (!set_primary_wallet) {
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_SET_FAILED,
        };
      }
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.PRIMARY_WALLET_SET,
        data: set_primary_wallet as WalletDoc,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_SET_FAILED,
        error: error as string,
      };
    }
  }

  private async checkValidPrimaryWallet(input: {
    address: string;
    user_id: string;
  }): Promise<Response<WalletDoc>> {
    const { address, user_id } = input;
    const address_lowercase = address.toLowerCase();
    const is_user_primary_wallet = await this.userPrimaryWallet({ user_id });
    if (!is_user_primary_wallet) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      };
    }
    const wallet = await this.getWallet({ address: address_lowercase });
    const is_user_wallet = this.isUserWallet({ wallet, user_id });
    if (!is_user_wallet) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.WALLET_LINK.WALLET_NOT_LINKED,
      };
    }
    const is_primary_wallet = this.isPrimaryWallet({ wallet });
    if (!is_primary_wallet) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: MESSAGES.PRIMARY_WALLET.PRIMARY_WALLET_NOT_SET,
      };
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: MESSAGES.SUCCESS.PRIMARY_WALLET_VALID,
      data: wallet,
    };
  }
  private async getWallet(input: { address: string }): Promise<WalletDoc> {
    const { address } = input;
    const address_lowercase = address.toLowerCase();
    const wallet = await this.walletModel.findOne({
      address: address_lowercase,
    });
    return wallet as WalletDoc;
  }

  private isPrimaryWallet(input: { wallet: WalletDoc }): boolean {
    try {
      const { wallet } = input;
      if (wallet.is_primary) {
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(error as string);
      return false;
    }
  }

  private isUserWallet(input: { wallet: WalletDoc; user_id: string }): boolean {
    try {
      const { wallet, user_id } = input;
      if (!wallet) {
        return false;
      }
      if (wallet.user_id.toString() === user_id) {
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(error as string);
      return false;
    }
  }

  private async userPrimaryWallet(input: {
    user_id: string;
  }): Promise<boolean> {
    const { user_id } = input;
    try {
      const primaryWallet = await this.walletModel.findOne({
        user_id: new Types.ObjectId(user_id),
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
