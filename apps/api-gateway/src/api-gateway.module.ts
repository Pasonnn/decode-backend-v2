import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import environmentConfig from './config/environment.config';

// Import your modules here
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { GuardsModule } from './common/guards/guards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule.forFeature(configuration),
    ConfigModule.forFeature(environmentConfig),
    HttpModule,
    CacheModule,
    GuardsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    WalletModule,
  ],
})
export class ApiGatewayModule {}
