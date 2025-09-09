import { NestFactory } from '@nestjs/core';
import { RelationshipModule } from './relationship.module';

async function bootstrap() {
  const app = await NestFactory.create(RelationshipModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
