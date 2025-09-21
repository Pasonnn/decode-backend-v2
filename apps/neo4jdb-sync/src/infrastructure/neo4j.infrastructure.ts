import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import { ConfigService } from '@nestjs/config';
import { UserDoc } from '../interfaces/user-doc.interface';

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

  async onModuleDestroy(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
    }
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.driver.session();
  }

  async getNeo4jHealth(): Promise<boolean> {
    const session = this.getSession();
    try {
      await session.run('RETURN 1');
      this.logger.log('Neo4j health check successful');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to get Neo4j health: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async createUserNode(user: UserDoc): Promise<boolean> {
    const session = this.getSession();
    try {
      // Check if user node already exists
      const result = await session.run('MATCH (u:User {id: $id}) RETURN u', {
        id: user._id.toString(),
      });
      if (result.records.length > 0) {
        this.logger.log(`User node already exists: ${user._id}`);
        return true;
      }
      // Create user node
      await session.run(
        `CREATE (u:User {user_id: $user_id,
        username: $username,
        role: $role,
        display_name: $display_name,
        avatar_ipfs_hash: $avatar_ipfs_hash,
        following_number: $following_number,
        followers_number: $followers_number})`,
        {
          user_id: user._id.toString(),
          username: user.username,
          role: user.role,
          display_name: user.display_name,
          avatar_ipfs_hash: user.avatar_ipfs_hash,
          following_number: 0,
          followers_number: 0,
        },
      );
      this.logger.log(`User node created successfully: ${user._id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to create user node: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async updateUserNode(user: UserDoc): Promise<boolean> {
    const session = this.getSession();
    try {
      // Update user node
      const update_query = `MATCH (u:User {user_id: "${user._id.toString()}"})
        SET u.username = "${user.username}",
        u.role = "${user.role}",
        u.display_name = "${user.display_name}",
        u.avatar_ipfs_hash = "${user.avatar_ipfs_hash}"`;
      console.log('update_query', update_query);
      await session.run(update_query);
      this.logger.log(`User node updated successfully: ${user._id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to update user node: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async findUserNode(user_id: string): Promise<boolean> {
    const session = this.getSession();
    try {
      const result = await session.run(
        'MATCH (u:User {user_id: $user_id}) RETURN u',
        {
          user_id: user_id.toString(),
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`User node not found: ${user_id}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to find user node: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }
}
