import { Injectable } from '@nestjs/common';

// Interfaces
import { Response } from '../interfaces/response.interface';

// Utils
import { CryptoUtils } from '../utils/crypto.utils';

@Injectable()
export class AuthService {
  constructor(private readonly cryptoUtils: CryptoUtils) {}

  async generateLoginChallenge(address: string): Promise<Response> {
    const nonceMessage = await this.cryptoUtils.generateNonceMessage(
      address,
      `Welcome to Decode Network! To ensure the security of your account and verify your identity, please sign this message with your wallet. 
      This cryptographic signature proves you control your wallet without revealing any sensitive information. 
      By signing this message, you are requesting access to your wallet. 
      This challenge expires in 5 minutes for your security. Please do not share this message or your signature with anyone.`,
    );
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
  }

  async validateLoginChallenge(
    address: string,
    signature: string,
  ): Promise<Response> {
    const signatureIsValid = await this.cryptoUtils.validateNonceMessage(
      address,
      signature,
    );
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
  }
}
