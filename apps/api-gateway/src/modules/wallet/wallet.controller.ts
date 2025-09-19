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
} from './dto';

// Guards and Decorators
import { Public } from '../../common/decorators/public.decorator';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';

// Interfaces
import type { Response } from '../../interfaces/response.interface';
import type { WalletDoc } from '../../interfaces/wallet-doc.interface';

@ApiTags('Wallet Management')
@Controller('wallets')
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ==================== HEALTH CHECK ====================

  @Get('healthz')
  @Public()
  @ApiOperation({ summary: 'Check wallet service health' })
  @ApiResponse({
    status: 200,
    description: 'Wallet service is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Wallet service is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
        },
      },
    },
  })
  checkHealth(): Response<{ status: string }> {
    return this.walletService.checkHealth();
  }

  // ==================== AUTH ENDPOINTS ====================

  @Post('auth/challenge')
  @Public()
  @ApiOperation({
    summary: 'Generate login challenge for wallet authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Login challenge generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
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
  @ApiOperation({
    summary: 'Validate login challenge for wallet authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Login challenge validated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid challenge or signature' })
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
  @ApiOperation({ summary: 'Generate link challenge for wallet linking' })
  @ApiResponse({
    status: 200,
    description: 'Link challenge generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Validate link challenge for wallet linking' })
  @ApiResponse({
    status: 200,
    description: 'Link challenge validated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid challenge or signature' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get wallets for current user' })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getWallets(
    @Headers('authorization') authorization: string,
  ): Promise<Response<WalletDoc[]>> {
    return await this.walletService.getWallets(authorization);
  }

  @Get('link/:user_id')
  @UseGuards(AuthGuardWithFingerprint)
  @ApiOperation({ summary: 'Get wallets by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Unlink wallet from user account' })
  @ApiResponse({
    status: 200,
    description: 'Wallet unlinked successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Generate primary wallet challenge' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet challenge generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Validate primary wallet challenge' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet challenge validated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid challenge or signature' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Unset primary wallet' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet unset successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async unsetPrimaryWallet(
    @Body() body: UnsetPrimaryWalletDto,
    @Headers('authorization') authorization: string,
  ): Promise<Response> {
    console.log('unsetPrimaryWallet', body);
    return await this.walletService.unsetPrimaryWallet(
      { address: body.address },
      authorization,
    );
  }

  @Get('primary/me')
  @UseGuards(AuthGuardWithFingerprint)
  @ApiOperation({ summary: 'Get primary wallet for current user' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async getPrimaryWallet(
    @Headers('authorization') authorization: string,
  ): Promise<Response<WalletDoc>> {
    return await this.walletService.getPrimaryWallet(authorization);
  }

  @Get('primary/:user_id')
  @UseGuards(AuthGuardWithFingerprint)
  @ApiOperation({ summary: 'Get primary wallet by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Primary wallet retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
