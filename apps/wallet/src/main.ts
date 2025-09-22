import { NestFactory } from '@nestjs/core';
import { WalletModule } from './wallet.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(WalletModule);

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

  const port = process.env.WALLET_PORT ?? 4003;
  const host = process.env.WALLET_HOST
    ? process.env.WALLET_HOST.replace('http://', '').replace('https://', '')
    : 'localhost';
  await app.listen(port, host);
  console.info(`[WalletService] Wallet service is running on ${host}:${port}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start Wallet service:', error);
  process.exit(1);
});
