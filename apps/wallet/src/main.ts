import { NestFactory } from '@nestjs/core';
import { WalletModule } from './wallet.module';

async function bootstrap() {
  const app = await NestFactory.create(WalletModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
