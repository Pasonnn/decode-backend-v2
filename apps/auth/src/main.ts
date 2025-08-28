import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit conversion
      },
    }),
  );

  const port = process.env.AUTH_PORT ?? 4001;
  const host = process.env.AUTH_HOST
    ? process.env.AUTH_HOST.replace('http://', '').replace('https://', '')
    : '0.0.0.0';
  await app.listen(port, host);
  console.info(`[AuthService] Auth service is running on ${host}:${port}`);
}
bootstrap();
