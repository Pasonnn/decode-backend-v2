import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RelationshipModule } from './../src/relationship.module';

describe('RelationshipController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RelationshipModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
