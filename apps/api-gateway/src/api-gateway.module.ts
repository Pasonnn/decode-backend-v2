import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import environmentConfig from './config/environment.config';

// Import your modules here
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from './infrastructure/cache/cache.module';

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
    HealthModule,
    AuthModule,
  ],
})
export class ApiGatewayModule {}
