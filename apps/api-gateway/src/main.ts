import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const configService = app.get(ConfigService);

  // Global pipes - following your auth service pattern
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const port = configService.get('apiGateway.port') || 4000;
  const host = configService.get('apiGateway.host') || '0.0.0.0';
  
  await app.listen(port, host);
  console.info(`[ApiGateway] API Gateway is running on ${host}:${port}`);
}

bootstrap();