import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserServiceClient } from '../../infrastructure/external-services/user-service.client';
import { WalletServiceClient } from '../../infrastructure/external-services/wallet-service.client';
import { RelationshipServiceClient } from '../../infrastructure/external-services/relationship-service.client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OnlineService } from './online.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { CacheService } from '../../infrastructure/cache/cache.service';
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    CacheModule,
    ClientsModule.registerAsync([
      {
        name: 'NEO4JDB_SYNC_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672',
            ],
            queue: 'neo4j_sync_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UserServiceClient,
    UsersService,
    OnlineService,
    WalletServiceClient,
    RelationshipServiceClient,
    AuthGuard,
    AuthGuardWithFingerprint,
    ClientsModule,
    CacheService,
  ],
  exports: [
    UserServiceClient,
    UsersService,
    OnlineService,
    WalletServiceClient,
    RelationshipServiceClient,
    ClientsModule,
  ],
})
export class UsersModule {}
