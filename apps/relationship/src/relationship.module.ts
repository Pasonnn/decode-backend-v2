import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';

// Service Import
import { FollowService } from './services/follow.service';
import { BlockService } from './services/block.service';
import { SuggestService } from './services/suggest.service';
import { MutualService } from './services/mutual.service';
import { SearchService } from './services/search.service';

// Infrastructure Import
import { Neo4jInfrastructure } from './infrastructure/neo4j.infrastructure';
import { RedisInfrastructure } from './infrastructure/redis.infrastructure';

// Config Import
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  
  controllers: [RelationshipController],
  providers: [
    FollowService,
    BlockService,
    SuggestService,
    MutualService,
    SearchService,
  ],
  exports: [
    FollowService,
    BlockService,
    SuggestService,
    MutualService,
    SearchService,
  ],
})
export class RelationshipModule {}
