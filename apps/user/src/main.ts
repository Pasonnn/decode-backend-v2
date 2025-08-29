import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap().catch((error) => {
  console.error('Failed to start user service:', error);
  process.exit(1);
});
