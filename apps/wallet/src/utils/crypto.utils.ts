import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import { Injectable, Logger } from '@nestjs/common';

// Infrastructure Imports
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

@Injectable()
export class CryptoUtils {
  private readonly logger = new Logger(CryptoUtils.name);
  constructor(private readonly redisInfrastructure: RedisInfrastructure) {}

  async generateNonceMessage(input: {
    address: string;
    message: string;
  }): Promise<string> {
    const { address, message } = input;
    // Create nonce message structure
    const random_nonce = randomUUID();
    const issued_at = Math.floor(Date.now() / 1000);
    const expires_at = issued_at + 60 * 5; // 5 minutes
    const nonce_message: string = `
    ${message}\n\n
    Address: ${address}\n\n
    Nonce: ${random_nonce}\n\n
    Issued At: ${issued_at}\n\n
    Expires At: ${expires_at}`;
    // Store nonce message in
    const nonce_message_key = `verify_nonce:${address}`;
    const nonce_message_value = nonce_message;
    await this.redisInfrastructure.set(
      nonce_message_key,
      nonce_message_value,
      expires_at,
    );
    this.logger.log(`Nonce message stored for address: ${address}`);
    // Return nonce message as NonceMessage
    return nonce_message;
  }

  async validateNonceMessage(input: {
    address: string;
    signature: string;
  }): Promise<boolean> {
    const { address, signature } = input;
    try {
      const nonce_message_key = `verify_nonce:${address}`;
      const nonce_message_value = (await this.redisInfrastructure.get(
        nonce_message_key,
      )) as string;
      if (!nonce_message_value) {
        this.logger.error(`Nonce message not found for address: ${address}`);
        return false;
      }
      const address_lower = address.toLowerCase();
      const recovered_address = ethers.verifyMessage(
        nonce_message_value,
        signature,
      );
      if (recovered_address !== address_lower) {
        this.logger.error(
          `Recovered address does not match address: ${address}`,
        );
        return false;
      }
      await this.redisInfrastructure.del(nonce_message_key);
      return true;
    } catch (error) {
      this.logger.error(`Error validating nonce message: ${error as string}`);
      return false;
    }
  }
}
