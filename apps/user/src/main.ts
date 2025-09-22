import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);

  // Global exception filters
  app.useGlobalFilters(
    new ValidationExceptionFilter(),
    new HttpExceptionFilter(),
  );

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

  const port = process.env.USER_PORT ?? 4002;
  const host = process.env.USER_HOST
    ? process.env.USER_HOST.replace('http://', '').replace('https://', '')
    : 'localhost';
  await app.listen(port, host);
  console.info(`[UserService] User service is running on ${host}:${port}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start User service:', error);
  process.exit(1);
});
