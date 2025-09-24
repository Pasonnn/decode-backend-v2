import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

// Controllers Import
import { WalletController } from './wallet.controller';

// External Services Import
import { AuthServiceClient } from './infrastructure/external-services/auth-service.client';

// Services Import
import { LinkService } from './services/link.service';
import { AuthService } from './services/auth.service';
import { PrimaryService } from './services/primary.service';

// Utils Import
import { CryptoUtils } from './utils/crypto.utils';

// Strategies Import
import { ServicesJwtStrategy } from './strategies/services-jwt.strategy';

// Infrastructure Import
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

// Schemas Import
import { Wallet, WalletSchema } from './schemas/wallet.schema';

// Config Import
import configuration from './config/configuration';
import jwtConfig from './config/jwt.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule.forFeature(configuration),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret.servicesToken'), // Secret key for signing tokens
        signOptions: {
          expiresIn: config.get<string>('jwt.servicesToken.expiresIn'), // Token expiration time
          issuer: config.get<string>('jwt.servicesToken.issuer'), // Token issuer identification
          audience: config.get<string>('jwt.servicesToken.audience'), // Token audience validation
        },
      }),
      inject: [ConfigService],
    }),
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
    CryptoUtils,

    // Strategies
    ServicesJwtStrategy,

    // External Services
    AuthServiceClient,
  ],
  exports: [
    // Export services that might be used by other modules
    RedisInfrastructure,
  ],
})
export class WalletModule {}
