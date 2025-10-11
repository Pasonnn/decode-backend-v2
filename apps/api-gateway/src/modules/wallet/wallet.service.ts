import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WalletServiceClient } from '../../infrastructure/external-services/wallet-service.client';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';
import { WalletDoc } from '../../interfaces/wallet-doc.interface';

// Import the interfaces from the client
import type {
  GenerateLoginChallengeRequest,
  ValidateLoginChallengeRequest,
  GenerateLinkChallengeRequest,
  ValidateLinkChallengeRequest,
  UnlinkWalletRequest,
  GetWalletsByUserIdRequest,
  GeneratePrimaryWalletChallengeRequest,
  ValidatePrimaryWalletChallengeRequest,
  UnsetPrimaryWalletRequest,
  GetPrimaryWalletByUserIdRequest,
} from '../../interfaces/wallet-service.interface';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly walletServiceClient: WalletServiceClient) {}

  // ==================== AUTH METHODS ====================

  /**
   * Generate login challenge for wallet authentication
   */
  async generateLoginChallenge(
    data: GenerateLoginChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(
        `Generating login challenge for address: ${data.address}`,
      );
      const response = await this.walletServiceClient.generateLoginChallenge(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to generate login challenge for address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully generated login challenge for address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to generate login challenge for address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Validate login challenge for wallet authentication
   */
  async validateLoginChallenge(
    data: ValidateLoginChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(
        `Validating login challenge for address: ${data.address}`,
      );
      const response = await this.walletServiceClient.validateLoginChallenge(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to validate login challenge for address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully validated login challenge for address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to validate login challenge for address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  // ==================== LINK METHODS ====================

  /**
   * Generate link challenge for wallet linking
   */
  async generateLinkChallenge(
    data: GenerateLinkChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Generating link challenge for address: ${data.address}`);
      const response = await this.walletServiceClient.generateLinkChallenge(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to generate link challenge for address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully generated link challenge for address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to generate link challenge for address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Validate link challenge for wallet linking
   */
  async validateLinkChallenge(
    data: ValidateLinkChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Validating link challenge for address: ${data.address}`);
      const response = await this.walletServiceClient.validateLinkChallenge(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to validate link challenge for address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully validated link challenge for address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to validate link challenge for address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Unlink wallet from user account
   */
  async unlinkWallet(
    data: UnlinkWalletRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Unlinking wallet address: ${data.address}`);
      const response = await this.walletServiceClient.unlinkWallet(
        data.address,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to unlink wallet address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully unlinked wallet address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to unlink wallet address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Get wallets for current user
   */
  async getWallets(authorization: string): Promise<Response<WalletDoc[]>> {
    try {
      this.logger.log('Getting wallets for current user');
      const response = await this.walletServiceClient.getWallets(authorization);

      if (!response.success) {
        this.logger.error(`Failed to get wallets: ${response.message}`);
      } else {
        this.logger.log(
          `Successfully retrieved ${response.data?.length || 0} wallets`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get wallets: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Return graceful degradation response instead of throwing
      return {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Wallet service is temporarily unavailable. Please try again later.',
        data: [],
      };
    }
  }

  /**
   * Get wallets by user ID
   */
  async getWalletsByUserId(
    data: GetWalletsByUserIdRequest,
  ): Promise<Response<WalletDoc[]>> {
    try {
      this.logger.log(`Getting wallets for user: ${data.user_id}`);
      const response = await this.walletServiceClient.getWalletsByUserId(data);

      if (!response.success) {
        this.logger.error(
          `Failed to get wallets for user ${data.user_id}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully retrieved ${response.data?.length || 0} wallets for user: ${data.user_id}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get wallets for user ${data.user_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Return graceful degradation response instead of throwing
      return {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Wallet service is temporarily unavailable. Please try again later.',
        data: [],
      };
    }
  }

  // ==================== PRIMARY WALLET METHODS ====================

  /**
   * Generate primary wallet challenge
   */
  async generatePrimaryWalletChallenge(
    data: GeneratePrimaryWalletChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(
        `Generating primary wallet challenge for address: ${data.address}`,
      );
      const response =
        await this.walletServiceClient.generatePrimaryWalletChallenge(
          data,
          authorization,
        );

      if (!response.success) {
        this.logger.error(
          `Failed to generate primary wallet challenge for address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully generated primary wallet challenge for address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to generate primary wallet challenge for address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Validate primary wallet challenge
   */
  async validatePrimaryWalletChallenge(
    data: ValidatePrimaryWalletChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(
        `Validating primary wallet challenge for address: ${data.address}`,
      );
      const response =
        await this.walletServiceClient.validatePrimaryWalletChallenge(
          data,
          authorization,
        );

      if (!response.success) {
        this.logger.error(
          `Failed to validate primary wallet challenge for address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully validated primary wallet challenge for address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to validate primary wallet challenge for address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Unset primary wallet
   */
  async unsetPrimaryWallet(
    data: UnsetPrimaryWalletRequest,
    authorization: string,
  ): Promise<Response> {
    try {
      this.logger.log(`Unsetting primary wallet address: ${data.address}`);
      const response = await this.walletServiceClient.unsetPrimaryWallet(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to unset primary wallet address ${data.address}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully unset primary wallet address: ${data.address}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to unset primary wallet address ${data.address}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Get primary wallet for current user
   */
  async getPrimaryWallet(authorization: string): Promise<Response<WalletDoc>> {
    try {
      this.logger.log('Getting primary wallet for current user');
      const response =
        await this.walletServiceClient.getPrimaryWallet(authorization);

      if (!response.success) {
        this.logger.error(`Failed to get primary wallet: ${response.message}`);
      } else {
        this.logger.log('Successfully retrieved primary wallet');
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get primary wallet: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Return graceful degradation response instead of throwing
      return {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Wallet service is temporarily unavailable. Please try again later.',
        data: undefined,
      };
    }
  }

  /**
   * Get primary wallet by user ID
   */
  async getPrimaryWalletByUserId(
    data: GetPrimaryWalletByUserIdRequest,
    authorization: string,
  ): Promise<Response<WalletDoc>> {
    try {
      this.logger.log(`Getting primary wallet for user: ${data.user_id}`);
      const response = await this.walletServiceClient.getPrimaryWalletByUserId(
        data,
        authorization,
      );

      if (!response.success) {
        this.logger.error(
          `Failed to get primary wallet for user ${data.user_id}: ${response.message}`,
        );
      } else {
        this.logger.log(
          `Successfully retrieved primary wallet for user: ${data.user_id}`,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get primary wallet for user ${data.user_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // Return graceful degradation response instead of throwing
      return {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Wallet service is temporarily unavailable. Please try again later.',
        data: undefined,
      };
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Check wallet service health
   */
  checkHealth(): Response<{ status: string }> {
    this.logger.log('Checking wallet service health');

    // Simple health check - wallet service is running if we can reach this point
    return {
      success: true,
      statusCode: 200,
      message: 'Wallet service is healthy',
      data: { status: 'ok' },
    };
  }
}
