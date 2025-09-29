import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

// DTOs Import
import { LoginChallengeDto, LoginChallengeValidationDto } from './dto/auth.dto';
import { LinkChallengeDto, LinkChallengeValidationDto } from './dto/link.dto';
import {
  PrimaryWalletChallengeDto,
  PrimaryWalletChallengeValidationDto,
  UnsetPrimaryWalletDto,
} from './dto/primary.dto';

// Services Import
import { LinkService } from './services/link.service';
import { AuthService } from './services/auth.service';
import { PrimaryService } from './services/primary.service';

// Interfaces Import
import { Response } from './interfaces/response.interface';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

// Guard
import { AuthGuard } from './common/guards/auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Wallet Management')
@Controller('wallets')
@ApiBearerAuth()
export class WalletController {
  constructor(
    private readonly linkService: LinkService,
    private readonly authService: AuthService,
    private readonly primaryService: PrimaryService,
  ) {}

  @Public()
  @Post('auth/challenge')
  async generateLoginChallenge(
    @Body() dto: LoginChallengeDto,
  ): Promise<Response> {
    return this.authService.generateLoginChallenge(dto);
  }

  @Public()
  @Post('auth/validation')
  async validateLoginChallenge(
    @Body() dto: LoginChallengeValidationDto,
  ): Promise<Response> {
    return this.authService.validateLoginChallenge(dto);
  }

  @UseGuards(AuthGuard)
  @Post('link/challenge')
  async generateLinkChallenge(
    @Body() dto: LinkChallengeDto,
  ): Promise<Response> {
    return this.linkService.generateLinkChallenge(dto);
  }

  @UseGuards(AuthGuard)
  @Post('link/validation')
  async validateLinkChallenge(
    @Body() dto: LinkChallengeValidationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.linkService.validateLinkChallenge({
      address: dto.address,
      signature: dto.signature,
      user_id: user.userId,
    });
  }

  @UseGuards(AuthGuard)
  @Get('link/me')
  async getWallets(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    return this.linkService.getWallets({ user_id: user.userId });
  }

  @UseGuards(AuthGuard)
  @Get('link/:user_id')
  async getWalletsByUserId(
    @Param('user_id') user_id: string,
  ): Promise<Response> {
    return this.linkService.getWallets({ user_id });
  }

  @UseGuards(AuthGuard)
  @Delete('link/unlink/:address')
  async unlinkWallet(
    @Param('address') address: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.linkService.unlinkWallet({
      user_id: user.userId,
      address: address,
    });
  }

  @UseGuards(AuthGuard)
  @Post('primary/challenge')
  async generatePrimaryWalletChallenge(
    @Body() dto: PrimaryWalletChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.primaryService.generatePrimaryWalletChallenge({
      user_id: user.userId,
      address: dto.address,
    });
  }

  @UseGuards(AuthGuard)
  @Post('primary/validation')
  async validatePrimaryWalletChallenge(
    @Body() dto: PrimaryWalletChallengeValidationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.primaryService.validatePrimaryWalletChallenge({
      address: dto.address,
      signature: dto.signature,
      user_id: user.userId,
    });
  }

  @UseGuards(AuthGuard)
  @Patch('primary/unset')
  async unsetPrimaryWallet(
    @Body() dto: UnsetPrimaryWalletDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.primaryService.unsetPrimaryWallet({
      user_id: user.userId,
      address: dto.address,
    });
  }

  @UseGuards(AuthGuard)
  @Get('primary/me')
  async getPrimaryWallet(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.primaryService.getPrimaryWallet({ user_id: user.userId });
  }

  @Get('primary/:user_id')
  async getPrimaryWalletByUserId(
    @Param('user_id') user_id: string,
  ): Promise<Response> {
    return this.primaryService.getPrimaryWallet({ user_id });
  }
}
