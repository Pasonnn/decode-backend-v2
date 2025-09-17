import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jdbSyncController } from './neo4jdb-sync.controller';
import { UserSyncService } from './services/user-sync.service';
import neo4jdbSyncConfig from './config/neo4jdb-sync.config';
import { Neo4jInfrastructure } from './infrastructure/neo4j.infrastructure';
import { RabbitMQInfrastructure } from './infrastructure/rabbitmq.infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConfigModule.forFeature(neo4jdbSyncConfig),
  ],
  controllers: [Neo4jdbSyncController],
  providers: [UserSyncService, RabbitMQInfrastructure, Neo4jInfrastructure],
})
export class Neo4jDbSyncModule {}
