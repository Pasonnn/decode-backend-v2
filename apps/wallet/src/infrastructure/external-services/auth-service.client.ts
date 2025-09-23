import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';
import { ServicesJwtStrategy } from '../../strategies/services-jwt.strategy';

interface createWalletSessionRequest {
  user_id: string;
  device_fingerprint_hashed: string;
  browser: string;
  device: string;
}

@Injectable()
export class AuthServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
    private readonly servicesJwtStrategy: ServicesJwtStrategy,
  ) {
    super(
      httpService,
      configService.get<string>('services.auth.url') || 'http://localhost:4001',
    );
  }

  async createWalletSession(
    data: createWalletSessionRequest,
  ): Promise<Response> {
    const services_token = this.servicesJwtStrategy.createServicesToken('auth');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Wallet-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return await this.post('/auth/session/wallet/create', data, config);
  }
}
