import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import neo4j, { Driver, auth } from 'neo4j-driver';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Neo4jInfrastructure implements OnModuleInit {
  private readonly logger = new Logger(Neo4jInfrastructure.name);
  private driver: Driver;
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const neo4j_uri = this.configService.get('NEO4J_URI') as string;
    const neo4j_user = this.configService.get('NEO4J_USER') as string;
    const neo4j_password = this.configService.get('NEO4J_PASSWORD') as string;

    if (!neo4j_uri || !neo4j_user || !neo4j_password) {
      throw new Error('NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD must be set');
    }

    try {
      this.driver = neo4j.driver(
        neo4j_uri,
        auth.basic(neo4j_user, neo4j_password),
      );
      if (!this.driver) {
        throw new Error('Failed to create Neo4j driver');
      }
      this.logger.log(`Neo4j driver created successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to create Neo4j driver: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error('Failed to create Neo4j driver');
    }
  }

  getDriver(): Driver {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.driver;
  }
}
