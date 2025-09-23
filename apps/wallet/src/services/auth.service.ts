import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Interfaces
import { Response } from '../interfaces/response.interface';
import { WalletDoc } from '../interfaces/wallet-doc.interface';

// Schemas
import { Wallet } from '../schemas/wallet.schema';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

// Constants
import { WALLET_CONSTANTS } from '../constants/wallet.constants';
import { MESSAGES } from '../constants/messages.constants';

// External Services
import { AuthServiceClient } from '../infrastructure/external-services/auth-service.client';

// Infrastructure
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly cryptoUtils: CryptoUtils,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    private readonly authServiceClient: AuthServiceClient,
    private readonly redisInfrastructure: RedisInfrastructure,
  ) {}

  async generateLoginChallenge(input: { address: string }): Promise<Response> {
    const { address } = input;
    try {
      const address_lowercase = address.toLowerCase();
      // Get Wallet Data
      const wallet = await this.getWallet({ address: address_lowercase });
      if (!wallet) {
        this.logger.error(
          `Wallet Authenticate not found for address ${address}`,
        );
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.AUTH.WALLET_NOT_FOUND,
        };
      }
      if (!this.isPrimaryWallet({ wallet })) {
        this.logger.error(
          `Wallet Authenticate is not primary for address ${address}`,
        );
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.AUTH.ONLY_PRIMARY_WALLET_ALLOWED,
        };
      }
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address: address_lowercase,
        message: WALLET_CONSTANTS.CHALLENGE.NONCE.MESSAGE_TEMPLATE.LOGIN,
      });
      if (!nonceMessage) {
        this.logger.error(
          `Wallet Authenticate nonce message generation failed for address ${address}`,
        );
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.CHALLENGE.NONCE_MESSAGE_GENERATION_FAILED,
        };
      }
      this.logger.log(
        `Wallet Authenticate nonce message generated for address ${address}`,
      );
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.CHALLENGE_GENERATED,
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      this.logger.error(
        `Wallet Authenticate nonce message generation failed for address ${address}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.CHALLENGE.NONCE_MESSAGE_GENERATION_FAILED,
        error: error as string,
      };
    }
  }

  async validateLoginChallenge(input: {
    address: string;
    signature: string;
    fingerprint_hashed: string;
    browser: string;
    device: string;
  }): Promise<Response> {
    const { address, signature, fingerprint_hashed, browser, device } = input;
    try {
      const address_lowercase = address.toLowerCase();
      // Validate signature
      const signatureIsValid = await this.cryptoUtils.validateNonceMessage({
        address: address_lowercase,
        signature,
      });
      if (!signatureIsValid) {
        this.logger.error(
          `Wallet Authenticate signature is invalid for address ${address}`,
        );
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
        };
      }
      // Get Wallet Data
      const wallet = await this.getWallet({ address: address_lowercase });
      if (!wallet) {
        this.logger.error(
          `Wallet Authenticate not found for address ${address}`,
        );
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.AUTH.WALLET_NOT_FOUND,
        };
      }
      if (!this.isPrimaryWallet({ wallet })) {
        this.logger.error(
          `Wallet Authenticate is not primary for address ${address}`,
        );
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: MESSAGES.AUTH.ONLY_PRIMARY_WALLET_ALLOWED,
        };
      }
      // Create wallet session
      const create_wallet_session_response =
        await this.authServiceClient.createWalletSession({
          user_id: wallet.user_id.toString(),
          device_fingerprint_hashed: fingerprint_hashed,
          browser,
          device,
        });
      if (!create_wallet_session_response.success) {
        this.logger.error(
          `Wallet Authenticate wallet session creation failed with Auth Service for address ${address}`,
        );
        return create_wallet_session_response;
      }
      // Response with session data (including access token and session token)
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: MESSAGES.SUCCESS.CHALLENGE_VALIDATED,
        data: create_wallet_session_response.data,
      };
    } catch (error) {
      this.logger.error(
        `Wallet Authenticate wallet session creation failed with Auth Service for address ${address}`,
        error,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
        error: error as string,
      };
    }
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
    const { wallet } = input;
    return wallet.is_primary;
  }
}
