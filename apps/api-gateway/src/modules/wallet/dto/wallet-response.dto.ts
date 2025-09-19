import { ApiProperty } from '@nestjs/swagger';

/**
 * Base response structure for all wallet API responses
 */
export class BaseWalletResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Operation completed successfully',
  })
  message: string;
}

/**
 * Response for challenge generation endpoints
 */
export class ChallengeResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'Challenge data containing the nonce message',
    example: {
      nonceMessage:
        'Sign this message to authenticate with your wallet: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 at 2024-01-01T00:00:00Z',
    },
  })
  data: any;
}

/**
 * Response for login challenge validation
 */
export class LoginValidationResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'Authentication data including tokens and session information',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      session_token: 'session_123456789',
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      device_fingerprint_id: '507f1f77bcf86cd799439013',
      app: 'web-app',
      expires_at: 1640995200,
      is_active: true,
      last_used_at: 1640995200,
    },
  })
  data: any;
}

/**
 * Response for wallet linking validation
 */
export class LinkValidationResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'No additional data for successful link validation',
    example: null,
    nullable: true,
  })
  data?: any;
}

/**
 * Response for wallet unlinking
 */
export class UnlinkWalletResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'No additional data for successful wallet unlinking',
    example: null,
    nullable: true,
  })
  data?: any;
}

/**
 * Response for primary wallet operations
 */
export class PrimaryWalletResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'No additional data for successful primary wallet operations',
    example: null,
    nullable: true,
  })
  data?: any;
}

/**
 * Response for getting wallets list
 */
export class WalletsListResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'Array of wallet documents',
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        user_id: '507f1f77bcf86cd799439012',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        name_service: 'vitalik.eth',
        is_primary: true,
      },
    ],
  })
  data: any[];
}

/**
 * Response for getting primary wallet
 */
export class PrimaryWalletDataResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'Primary wallet document',
    example: {
      _id: '507f1f77bcf86cd799439011',
      user_id: '507f1f77bcf86cd799439012',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      name_service: 'vitalik.eth',
      is_primary: true,
    },
  })
  data: any;
}

/**
 * Response for health check
 */
export class HealthCheckResponseDto extends BaseWalletResponseDto {
  @ApiProperty({
    description: 'Health status information',
    example: {
      status: 'ok',
    },
  })
  data: any;
}

/**
 * Error response for wallet operations
 */
export class WalletErrorResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code of the error',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: 'Invalid wallet address format',
  })
  message: string;

  @ApiProperty({
    description: 'Additional error details (optional)',
    example: null,
    nullable: true,
  })
  data?: any;

  @ApiProperty({
    description: 'Technical error details (optional)',
    example: 'Validation failed: address must be a valid Ethereum address',
    nullable: true,
  })
  error?: string;
}

/**
 * Service unavailable response for graceful degradation
 */
export class ServiceUnavailableResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code indicating service unavailability',
    example: 503,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Message indicating service unavailability',
    example:
      'Wallet service is temporarily unavailable. Please try again later.',
  })
  message: string;

  @ApiProperty({
    description:
      'Empty data array for list endpoints or null for single object endpoints',
    example: [],
  })
  data: any;
}
