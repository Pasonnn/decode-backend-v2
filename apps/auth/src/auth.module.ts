import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientModule } from '@nestjs/microservices';

// Controllers Import
import { AuthController } from './controllers/auth.controller';
import { RegisterController } from './controllers/auth.controller';
import { LoginController } from './controllers/auth.controller';
import { SessionController } from './controllers/auth.controller';
import { PasswordController } from './controllers/auth.controller';
import { InfoController } from './controllers/auth.controller';

// Services Import
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { InfoService } from './services/info.service';

// Module Import
import { RedisModule } from '@nestjs-modules/ioredis';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

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
        url: config.get<string>('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, RegisterController, LoginController, SessionController, PasswordController, InfoController],
  providers: [RegisterService, LoginService, SessionService, PasswordService, InfoService],
})
export class AuthModule {}
