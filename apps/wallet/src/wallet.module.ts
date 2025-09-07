import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';

// Controllers Import
import { WalletController } from './wallet.controller';

// Services Import
import { LinkService } from './services/link.service';
import { AuthService } from './services/auth.service';
import { PrimaryService } from './services/primary.service';

// Infrastructure Import
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

// Schemas Import
import { Wallet, WalletSchema } from './schemas/wallet.schema';

// Config Import
import configuration from './config/configuration';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule.forFeature(configuration),
    HttpModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URI'), // Use consistent naming
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WalletController],
  providers: [
    // Services
    LinkService,
    AuthService,
    PrimaryService,

    // Infrastructure
    RedisInfrastructure,
  ],
  exports: [
    // Export services that might be used by other modules
    RedisInfrastructure,
  ],
})
export class WalletModule {}
