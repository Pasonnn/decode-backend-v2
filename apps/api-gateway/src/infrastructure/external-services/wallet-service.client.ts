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
  UnlinkWalletRequest,
  GetWalletsByUserIdRequest,
  GeneratePrimaryWalletChallengeRequest,
  ValidatePrimaryWalletChallengeRequest,
  UnsetPrimaryWalletRequest,
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
    return this.post('/auth/challenge', data, config);
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
    return this.post('/auth/validation', data, config);
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
    return this.post('/link/challenge', data, config);
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
    return this.post('/link/validation', data, config);
  }

  async unlinkWallet(
    data: UnlinkWalletRequest,
    authorization: string,
  ): Promise<Response> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.post('/link/unlink', data, config);
  }

  async getWallets(authorization: string): Promise<Response<WalletDoc[]>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get('/link/me', config);
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
    return this.get(`/link/${data.user_id}`, config);
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
    return this.post('/primary/challenge', data, config);
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
    return this.post('/primary/validation', data, config);
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
    return this.post('/primary/unset', data, config);
  }

  async getPrimaryWallet(authorization: string): Promise<Response<WalletDoc>> {
    const config = {
      headers: {
        Authorization: authorization,
      },
    };
    return this.get('/primary/me', config);
  }
}
