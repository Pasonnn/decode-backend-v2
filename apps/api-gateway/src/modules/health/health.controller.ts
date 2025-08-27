import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Response } from '../../interfaces/response.interface';

@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    /**
     * Health check endpoint to verify service availability
     * @returns Service status object
     */
    @Get('healthz')
    async checkHealth(): Promise<Response> {
        const health_check_response = await this.healthService.checkHealth();
        return health_check_response;
    }
}