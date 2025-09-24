import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

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

// Strategies Import
import { ServicesJwtStrategy } from './strategies/services-jwt.strategy';

// Guards Import
import { AuthServiceGuard } from './common/guards/service.guard';

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
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret.servicesToken'),
        signOptions: {
          expiresIn: config.get<string>('jwt.servicesToken.expiresIn'),
          issuer: config.get<string>('jwt.servicesToken.issuer'),
          audience: config.get<string>('jwt.servicesToken.audience'),
        },
      }),
      inject: [ConfigService],
    }),
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
    ServicesJwtStrategy,
    AuthServiceGuard,
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
