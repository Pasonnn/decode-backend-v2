// apps/api-gateway/src/api-gateway.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import environmentConfig from './config/environment.config';

// Import your modules here
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { RelationshipModule } from './modules/relationship/relationship.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { GuardsModule } from './common/guards/guards.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
    RelationshipModule,
    NotificationModule,
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
  controllers: [],
  providers: [],
  exports: [ClientsModule],
})
export class ApiGatewayModule {}
