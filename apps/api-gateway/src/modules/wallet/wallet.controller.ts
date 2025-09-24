import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';

// Services
import { WalletService } from './wallet.service';

// DTOs
import {
  LoginChallengeDto,
  LoginChallengeValidationDto,
  LinkChallengeDto,
  LinkChallengeValidationDto,
  PrimaryWalletChallengeDto,
  PrimaryWalletChallengeValidationDto,
  UnsetPrimaryWalletDto,
  ChallengeResponseDto,
  LoginValidationResponseDto,
  LinkValidationResponseDto,
  UnlinkWalletResponseDto,
  PrimaryWalletResponseDto,
  WalletsListResponseDto,
  PrimaryWalletDataResponseDto,
  HealthCheckResponseDto,
  WalletErrorResponseDto,
  ServiceUnavailableResponseDto,
} from './dto';

// Guards and Decorators
import { Public } from '../../common/decorators/public.decorator';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import {
  UserRateLimit,
  IPRateLimit,
} from '../../common/decorators/rate-limit.decorator';

// Interfaces
import type { Response } from '../../interfaces/response.interface';
import type { WalletDoc } from '../../interfaces/wallet-doc.interface';

@ApiTags('Wallet Management')
@Controller('wallets')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(
  LoginChallengeDto,
  LoginChallengeValidationDto,
  LinkChallengeDto,
  LinkChallengeValidationDto,
  PrimaryWalletChallengeDto,
  PrimaryWalletChallengeValidationDto,
  UnsetPrimaryWalletDto,
  ChallengeResponseDto,
  LoginValidationResponseDto,
  LinkValidationResponseDto,
  UnlinkWalletResponseDto,
  PrimaryWalletResponseDto,
  WalletsListResponseDto,
  PrimaryWalletDataResponseDto,
  HealthCheckResponseDto,
  WalletErrorResponseDto,
  ServiceUnavailableResponseDto,
)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ==================== HEALTH CHECK ====================

  @Get('healthz')
  @Public()
  @ApiOperation({
    summary: 'Check wallet service health',
    description:
      'Returns the health status of the wallet service. This endpoint is public and does not require authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet service is healthy',
    type: HealthCheckResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ServiceUnavailableResponseDto,
  })
  checkHealth(): Response<{ status: string }> {
    return this.walletService.checkHealth();
  }

  // ==================== AUTH ENDPOINTS ====================

  @Post('auth/challenge')
  @Public()
  @IPRateLimit.strict()
  @ApiOperation({
    summary: 'Generate login challenge for wallet authentication',
    description:
      'Generates a challenge message that users must sign with their wallet to authenticate. This endpoint is public and does not require authentication.',
  })
  @ApiBody({
    type: LoginChallengeDto,
    description: 'Wallet address to generate challenge for',
    examples: {
      example1: {
        summary: 'Generate challenge for wallet',
        value: {
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login challenge generated successfully',
    type: ChallengeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async generateLoginChallenge(
    @Body() body: LoginChallengeDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.generateLoginChallenge(
      { address: body.address },
      authorization,
    );
  }

  @Post('auth/validation')
  @Public()
  @IPRateLimit.strict()
  @ApiOperation({
    summary: 'Validate login challenge for wallet authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Login challenge validated successfully',
    type: LoginValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid challenge or signature',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async validateLoginChallenge(
    @Body() body: LoginChallengeValidationDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.validateLoginChallenge(
      {
        address: body.address,
        signature: body.signature,
        fingerprint_hashed: body.fingerprint_hashed,
        browser: body.browser,
        device: body.device,
      },
      authorization,
    );
  }

  // ==================== LINK ENDPOINTS ====================

  @Post('link/challenge')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Generate link challenge for wallet linking' })
  @ApiResponse({
    status: 200,
    description: 'Link challenge generated successfully',
    type: ChallengeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async generateLinkChallenge(
    @Body() body: LinkChallengeDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.generateLinkChallenge(
      { address: body.address },
      authorization,
    );
  }

  @Post('link/validation')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Validate link challenge for wallet linking' })
  @ApiResponse({
    status: 200,
    description: 'Link challenge validated successfully',
    type: LinkValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid challenge or signature',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async validateLinkChallenge(
    @Body() body: LinkChallengeValidationDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.validateLinkChallenge(
      {
        address: body.address,
        signature: body.signature,
      },
      authorization,
    );
  }

  @Get('link/me')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Get wallets for current user' })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
    type: WalletsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ServiceUnavailableResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getWallets(
    @Headers('authorization') authorization: string,
  ): Promise<Response<WalletDoc[]>> {
    return await this.walletService.getWallets(authorization);
  }

  @Get('link/:user_id')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Get wallets by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
    type: WalletsListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ServiceUnavailableResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getWalletsByUserId(
    @Param('user_id') userId: string,
    @Headers('authorization') authorization: string,
  ): Promise<Response<WalletDoc[]>> {
    return await this.walletService.getWalletsByUserId(
      { user_id: userId },
      authorization,
    );
  }

  @Delete('link/unlink/:address')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Unlink wallet from user account' })
  @ApiResponse({
    status: 200,
    description: 'Wallet unlinked successfully',
    type: UnlinkWalletResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async unlinkWallet(
    @Param('address') address: string,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.unlinkWallet(
      { address: address },
      authorization,
    );
  }

  // ==================== PRIMARY WALLET ENDPOINTS ====================

  @Post('primary/challenge')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Generate primary wallet challenge' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet challenge generated successfully',
    type: ChallengeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async generatePrimaryWalletChallenge(
    @Body() body: PrimaryWalletChallengeDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.generatePrimaryWalletChallenge(
      { address: body.address },
      authorization,
    );
  }

  @Post('primary/validation')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Validate primary wallet challenge' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet challenge validated successfully',
    type: PrimaryWalletResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid challenge or signature',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async validatePrimaryWalletChallenge(
    @Body() body: PrimaryWalletChallengeValidationDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.validatePrimaryWalletChallenge(
      {
        address: body.address,
        signature: body.signature,
      },
      authorization,
    );
  }

  @Patch('primary/unset')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.strict()
  @ApiOperation({ summary: 'Unset primary wallet' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet unset successfully',
    type: PrimaryWalletResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async unsetPrimaryWallet(
    @Body() body: UnsetPrimaryWalletDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    return await this.walletService.unsetPrimaryWallet(
      { address: body.address },
      authorization,
    );
  }

  @Get('primary/me')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Get primary wallet for current user' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet retrieved successfully',
    type: PrimaryWalletDataResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ServiceUnavailableResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getPrimaryWallet(
    @Headers('authorization') authorization: string,
  ): Promise<Response<WalletDoc>> {
    return await this.walletService.getPrimaryWallet(authorization);
  }

  @Get('primary/:user_id')
  @UseGuards(AuthGuardWithFingerprint)
  @UserRateLimit.standard()
  @ApiOperation({ summary: 'Get primary wallet by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet retrieved successfully',
    type: PrimaryWalletDataResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: WalletErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ServiceUnavailableResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getPrimaryWalletByUserId(
    @Param('user_id') userId: string,
    @Headers('authorization') authorization: string,
  ): Promise<Response<WalletDoc>> {
    return await this.walletService.getPrimaryWalletByUserId(
      { user_id: userId },
      authorization,
    );
  }
}
