import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';

interface ValidateWalletPassTokenRequest {
  wallet_pass_token: string;
}

@Injectable()
export class AuthServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
  ) {
    super(
      httpService,
      configService.get<string>('services.auth.url') || 'http://localhost:4001',
    );
  }

  async validateWalletPassToken(
    data: ValidateWalletPassTokenRequest,
  ): Promise<Response> {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Wallet-Service/1.0',
      },
    };
    return await this.post(
      '/auth/session/validate-wallet-pass-token',
      data,
      config,
    );
  }
}
