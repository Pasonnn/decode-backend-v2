import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';

// Response and Doc Interfaces
import { Response } from '../../interfaces/response.interface';
import { WalletDoc } from '../../interfaces/wallet-doc.interface';

// Wallet Service Interfaces
import {
  GenerateLoginChallengeRequest,
  ValidateLoginChallengeRequest,
  GenerateLinkChallengeRequest,
  ValidateLinkChallengeRequest,
  GetWalletsByUserIdRequest,
  GeneratePrimaryWalletChallengeRequest,
  ValidatePrimaryWalletChallengeRequest,
  UnsetPrimaryWalletRequest,
  GetPrimaryWalletByUserIdRequest,
} from '../../interfaces/wallet-service.interface';

@Injectable()
export class WalletServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
  ) {
    super(
      httpService,
      configService.get<string>('services.wallet.url') ||
        'http://localhost:4005',
    );
  }

  // Auth Endpoints
  async generateLoginChallenge(
    data: GenerateLoginChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/wallets/auth/challenge', data, config);
  }

  async validateLoginChallenge(
    data: ValidateLoginChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/wallets/auth/validation', data, config);
  }
  // Link Endpoints

  async generateLinkChallenge(
    data: GenerateLinkChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/wallets/link/challenge', data, config);
  }

  async validateLinkChallenge(
    data: ValidateLinkChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/wallets/link/validation', data, config);
  }

  async unlinkWallet(
    address: string,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.delete(`/wallets/link/unlink/${address}`, config);
  }

  async getWallets(authorization: string): Promise<Response<WalletDoc[]>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get('/wallets/link/me', config);
  }

  async getWalletsByUserId(
    data: GetWalletsByUserIdRequest,
    authorization: string,
  ): Promise<Response<WalletDoc[]>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get(`/wallets/link/${data.user_id}`, config);
  }
  // Primary Endpoints
  async generatePrimaryWalletChallenge(
    data: GeneratePrimaryWalletChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/wallets/primary/challenge', data, config);
  }

  async validatePrimaryWalletChallenge(
    data: ValidatePrimaryWalletChallengeRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/wallets/primary/validation', data, config);
  }

  async unsetPrimaryWallet(
    data: UnsetPrimaryWalletRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.patch('/wallets/primary/unset', data, config);
  }

  async getPrimaryWallet(authorization: string): Promise<Response<WalletDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    const response = await this.get('/wallets/primary/me', config);
    console.log('wallet service response', response);
    return response as Response<WalletDoc>;
  }

  async getPrimaryWalletByUserId(
    data: GetPrimaryWalletByUserIdRequest,
    authorization: string,
  ): Promise<Response<WalletDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    const response = await this.get(`/wallets/primary/${data.user_id}`, config);
    return response as Response<WalletDoc>;
  }
}
