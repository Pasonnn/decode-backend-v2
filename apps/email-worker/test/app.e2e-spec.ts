import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EmailWorkerModule } from './../src/email-worker.module';

describe('EmailWorkerController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EmailWorkerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
