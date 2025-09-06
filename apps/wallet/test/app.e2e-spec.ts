import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WalletModule } from './../src/wallet.module';

describe('WalletController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WalletModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
