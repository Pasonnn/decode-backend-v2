import { Injectable } from '@nestjs/common';

// Interfaces
import { Response } from '../interfaces/response.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

@Injectable()
export class AuthService {
  constructor(private readonly cryptoUtils: CryptoUtils) {}

  async generateLoginChallenge(input: { address: string }): Promise<Response> {
    try {
      const { address } = input;
      const nonceMessage = await this.cryptoUtils.generateNonceMessage({
        address,
        message: `Welcome to Decode Wallet! To ensure the security of your wallet and verify your identity, please sign this message with your wallet. 
            This cryptographic signature proves you control your wallet without revealing any sensitive information. 
            By signing this message, you are requesting access to your wallet. 
            This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.`,
      });
      if (!nonceMessage) {
        return {
          success: false,
          statusCode: 400,
          message: 'Failed to generate login challenge',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Login challenge generated successfully',
        data: {
          nonceMessage: nonceMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to generate login challenge',
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
          message: 'Invalid login challenge',
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Login challenge validated successfully',
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to validate login challenge',
        error: error as string,
      };
    }
  }
}
