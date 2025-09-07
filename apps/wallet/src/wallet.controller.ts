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
import {
  LinkChallengeDto,
  LinkChallengeValidationDto,
  UnlinkWalletDto,
} from './dto/link.dto';
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

@ApiTags('Wallet Management')
@Controller('wallets')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(
    private readonly linkService: LinkService,
    private readonly authService: AuthService,
    private readonly primaryService: PrimaryService,
  ) {}

  @Post('auth/challenge')
  async generateLoginChallenge(
    @Body() dto: LoginChallengeDto,
  ): Promise<Response> {
    return this.authService.generateLoginChallenge(dto);
  }

  @Post('auth/validation')
  async validateLoginChallenge(
    @Body() dto: LoginChallengeValidationDto,
  ): Promise<Response> {
    return this.authService.validateLoginChallenge(dto);
  }

  @Post('link/challenge')
  async generateLinkChallenge(
    @Body() dto: LinkChallengeDto,
  ): Promise<Response> {
    return this.linkService.generateLinkChallenge(dto);
  }

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

  @Get('link')
  async getWallets(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    return this.linkService.getWallets({ user_id: user.userId });
  }

  @Get('link/:user_id')
  async getWalletsByUserId(
    @Param('user_id') user_id: string,
  ): Promise<Response> {
    return this.linkService.getWallets({ user_id });
  }

  @Delete('link')
  async unlinkWallet(
    @Body() dto: UnlinkWalletDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.linkService.unlinkWallet({
      user_id: user.userId,
      address: dto.address,
    });
  }

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

  @Patch('primary')
  async unsetPrimaryWallet(
    @Body() dto: UnsetPrimaryWalletDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.primaryService.unsetPrimaryWallet({
      user_id: user.userId,
      address: dto.address,
    });
  }

  @Get('primary')
  async getPrimaryWallet(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Response> {
    return this.primaryService.getPrimaryWallet({ user_id: user.userId });
  }
}
