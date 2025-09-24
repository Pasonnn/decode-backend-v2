import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';

// Controllers Import
import { UserController } from './user.controller';

// Services Import
import { ProfileService } from './services/profile.service';
import { UsernameService } from './services/username.service';
import { SearchService } from './services/search.service';
import { EmailService } from './services/email.service';
import { ServicesResponseService } from './services/services-response.service';

// Infrastructure Import
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

// Schemas Import
import { User, UserSchema } from './schemas/user.schema';

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
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
        name: 'EMAIL_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
                'amqp://localhost:5672',
            ],
            queue: 'email_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
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
  controllers: [UserController],
  providers: [
    // Services
    ProfileService,
    UsernameService,
    SearchService,
    EmailService,
    ServicesResponseService,
    // Infrastructure
    RedisInfrastructure,
  ],
  exports: [
    // Export services that might be used by other modules
    RedisInfrastructure,
    ServicesResponseService,
  ],
})
export class UserModule {}
