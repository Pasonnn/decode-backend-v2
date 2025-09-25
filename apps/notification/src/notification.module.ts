import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-modules/ioredis';

// Controllers
import { NotificationController } from './notification.controller';
import { RabbitMQController } from './controllers/rabbitmq.controller';

// Services
import { NotificationService } from './services/notification.service';
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

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
      useFactory: (config: ConfigService) => ({
        type: 'single', // Single Redis instance configuration
        url: config.get<string>('REDIS_URI'), // Redis connection string
      }),
      inject: [ConfigService],
    }),

    // JWT for authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret.accessToken'), // Secret key for signing tokens
        signOptions: {
          expiresIn: config.get<string>('jwt.accessToken.expiresIn'), // Token expiration time
          issuer: config.get<string>('jwt.accessToken.issuer'), // Token issuer identification
          audience: config.get<string>('jwt.accessToken.audience'), // Token audience validation
        },
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
    RedisInfrastructure,

    // WebSocket gateway
    NotificationGateway,

    // Infrastructure
    RabbitMQInfrastructure,
  ],
  exports: [NotificationService, NotificationGateway, RedisInfrastructure],
})
export class NotificationModule {}
