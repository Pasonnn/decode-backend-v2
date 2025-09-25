import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';

// Controllers
import { NotificationController } from './notification.controller';
import { RabbitMQController } from './controllers/rabbitmq.controller';

// Services
import { NotificationService } from './services/notification.service';
import { RedisService } from './infrastructure/redis.service';

// Gateways
import { NotificationGateway } from './gateways/notification.gateway';

// Schemas
import { Notification, NotificationSchema } from './schema/notification.schema';

// Infrastructure
import { RabbitMQInfrastructure } from './infrastructure/rabbitmq.infrastructure';

/**
 * Notification Module
 * Main module for notification service with clean architecture
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Redis for WebSocket connection management
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): RedisModuleOptions => ({
        type: 'single',
        url: `redis://${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}/${configService.get<number>('REDIS_DB', 0)}`,
      }),
      inject: [ConfigService],
    }),

    // JWT for authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),

    // Mongoose schemas
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController, RabbitMQController],
  providers: [
    // Core services
    NotificationService,
    RedisService,

    // WebSocket gateway
    NotificationGateway,

    // Infrastructure
    RabbitMQInfrastructure,
  ],
  exports: [NotificationService, NotificationGateway, RedisService],
})
export class NotificationModule {}
