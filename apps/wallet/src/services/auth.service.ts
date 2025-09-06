import { Injectable } from '@nestjs/common';

// Interfaces
import { Response } from '../interfaces/response.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

// Constants
import { WALLET_CONSTANTS } from '../constants/wallet.constants';
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class AuthService {
  constructor(private readonly cryptoUtils: CryptoUtils) {}

  async generateLoginChallenge(input: { address: string }): Promise<Response> {
    try {
      const { address } = input;
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address,
        message: WALLET_CONSTANTS.CHALLENGE.NONCE.MESSAGE_TEMPLATE.LOGIN,
      });
      if (!nonceMessage) {
        return {
          success: false,
          statusCode: 400,
          message: MESSAGES.CHALLENGE.NONCE_MESSAGE_GENERATION_FAILED,
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: MESSAGES.SUCCESS.CHALLENGE_GENERATED,
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: MESSAGES.CHALLENGE.NONCE_MESSAGE_GENERATION_FAILED,
        error: error as string,
      };
    }
  }

  async validateLoginChallenge(input: {
    address: string;
    signature: string;
  }): Promise<Response> {
    try {
      const { address, signature } = input;
      const signatureIsValid = await this.cryptoUtils.validateNonceMessage({
        address,
        signature,
      });
      if (!signatureIsValid) {
        return {
          success: false,
          statusCode: 400,
          message: MESSAGES.CHALLENGE.CHALLENGE_VALIDATION_FAILED,
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: MESSAGES.SUCCESS.CHALLENGE_VALIDATED,
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
}
