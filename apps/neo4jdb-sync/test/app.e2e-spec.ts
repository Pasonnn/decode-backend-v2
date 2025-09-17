import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Neo4jDbSyncModule } from './../src/neo4jdb-sync.module';

describe('Neo4jDbSyncController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [Neo4jDbSyncModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
