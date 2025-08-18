// Module Import
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers Import
import { AuthController } from './auth.controller';

// Services Import
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { InfoService } from './services/info.service';  

// Strategies and Infrastructure Import
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionStrategy } from './strategies/session.strategy';
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

// Utils Import
import { PasswordUtils } from './utils/password.utils';

// Schemas Import
import { User, UserSchema } from './schemas/user.schema';
import { Session, SessionSchema } from './schemas/session.schema';
import { DeviceFingerprint, DeviceFingerprintSchema } from './schemas/device-fingerprint.schema';

// Config Import
import authConfig from './config/auth.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule.forFeature(authConfig),
    ConfigModule.forFeature(jwtConfig),
    PassportModule, // Add PassportModule for strategies
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: DeviceFingerprint.name, schema: DeviceFingerprintSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret.accessToken'),
        signOptions: { 
          expiresIn: config.get<string>('jwt.accessToken.expiresIn'),
          issuer: config.get<string>('jwt.accessToken.issuer'),
          audience: config.get<string>('jwt.accessToken.audience'),
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URI'), // Use consistent naming
      }),
      inject: [ConfigService],
    }),
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'email_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Services
    RegisterService, 
    LoginService, 
    SessionService, 
    PasswordService, 
    InfoService,
    
    // Strategies
    JwtStrategy, 
    SessionStrategy,
    
    // Infrastructure
    RedisInfrastructure,

    // Utils
    PasswordUtils,
  ],
  exports: [
    // Export services that might be used by other modules
    RedisInfrastructure,
  ],
})
export class AuthModule {}