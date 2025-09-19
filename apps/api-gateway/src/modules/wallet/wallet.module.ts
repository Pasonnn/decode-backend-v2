import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WalletServiceClient } from '../../infrastructure/external-services/wallet-service.client';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [WalletController],
  providers: [
    WalletServiceClient,
    WalletService,
    AuthGuard,
    AuthGuardWithFingerprint,
  ],
  exports: [WalletServiceClient, WalletService],
})
export class WalletModule {}
