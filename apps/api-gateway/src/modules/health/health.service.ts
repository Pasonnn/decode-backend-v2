import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from '../../interfaces/response.interface';
import { ResponseUtil } from '../../common/utils/response.util';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  async checkHealth(): Promise<Response> {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '1.0.0',
      environment: this.configService.get('environment'),
    };

    return ResponseUtil.success(healthData, 'API Gateway is healthy', 200);
  }
}
