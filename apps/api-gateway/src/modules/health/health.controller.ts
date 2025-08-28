import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Response } from '../../interfaces/response.interface';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @ApiOperation({
        summary: 'Health check',
        description: 'Check the health status of the API Gateway service'
    })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                statusCode: { type: 'number', example: 200 },
                message: { type: 'string', example: 'Service is healthy' },
                data: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                        uptime: { type: 'number', example: 3600 }
                    }
                }
            }
        }
    })
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