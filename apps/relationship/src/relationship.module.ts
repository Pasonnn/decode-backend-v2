import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';

// Controller Import
import { RelationshipController } from './relationship.controller';

// Service Import
import { UserService } from './services/user.service';
import { FollowService } from './services/follow.service';
import { BlockService } from './services/block.service';
import { SuggestService } from './services/suggest.service';
import { MutualService } from './services/mutual.service';
import { SearchService } from './services/search.service';

// Infrastructure Import
import { Neo4jInfrastructure } from './infrastructure/neo4j.infrastructure';
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

// Config Import
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule.forFeature(configuration),
    HttpModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URI'), // Use consistent naming
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672',
            ],
            queue: 'notification_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [RelationshipController],
  providers: [
    // Services
    UserService,
    FollowService,
    BlockService,
    SuggestService,
    MutualService,
    SearchService,

    // Infrastructure
    Neo4jInfrastructure,
    RedisInfrastructure,
  ],
  exports: [
    // Infrastructure
    Neo4jInfrastructure,
  ],
})
export class RelationshipModule {}
