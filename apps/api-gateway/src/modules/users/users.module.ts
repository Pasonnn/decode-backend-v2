import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UserServiceClient } from '../../infrastructure/external-services/user-service.client';
import { WalletServiceClient } from '../../infrastructure/external-services/wallet-service.client';
import { RelationshipServiceClient } from '../../infrastructure/external-services/relationship-service.client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthGuardWithFingerprint } from '../../common/guards/auth-with-fingerprint.guard';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ClientsModule.register([
      {
        name: 'NEO4JDB_SYNC_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'neo4j_sync_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UserServiceClient,
    UsersService,
    WalletServiceClient,
    RelationshipServiceClient,
    AuthGuard,
    AuthGuardWithFingerprint,
  ],
  exports: [
    UserServiceClient,
    UsersService,
    WalletServiceClient,
    RelationshipServiceClient,
  ],
})
export class UsersModule {}
