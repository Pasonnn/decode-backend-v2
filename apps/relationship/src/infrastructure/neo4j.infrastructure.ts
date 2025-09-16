import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import { ConfigService } from '@nestjs/config';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
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

  async createUserNode(user: UserNeo4jDoc): Promise<boolean> {
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
        'CREATE (u:User {user_id: $user_id, email: $email, username: $username, role: $role, display_name: $display_name, avatar_ipfs_hash: $avatar_ipfs_hash})',
        {
          user_id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          display_name: user.display_name,
          avatar_ipfs_hash: user.avatar_ipfs_hash,
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

  async updateUserNode(user: UserNeo4jDoc): Promise<boolean> {
    const session = this.getSession();
    try {
      // Find user node
      const result = await session.run(
        'MATCH (u:User {user_id: $user_id}) RETURN u',
        {
          user_id: user._id.toString(),
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`User node not found: ${user._id}`);
        return false;
      }
      // Check which fields are different
      const differentFields = Object.keys(user).filter(
        (key) => user[key] !== result.records[0].get(key),
      );
      if (differentFields.length === 0) {
        this.logger.log(`User node is up to date: ${user._id}`);
        return true;
      }
      // Update user node
      await session.run(
        'MATCH (u:User {user_id: $user_id}) SET u.email = $email, u.username = $username, u.role = $role, u.display_name = $display_name, u.avatar_ipfs_hash = $avatar_ipfs_hash',
        {
          user_id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          display_name: user.display_name,
          avatar_ipfs_hash: user.avatar_ipfs_hash,
        },
      );
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

  async findUserNode(input: { user_id: string }): Promise<boolean> {
    const session = this.getSession();
    try {
      const result = await session.run(
        'MATCH (u:User {user_id: $user_id}) RETURN u',
        {
          user_id: input.user_id,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`User node not found: ${input.user_id}`);
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

  async findUserToUserRelationship(input: {
    user_id_from: string;
    user_id_to: string;
    relationship_type: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to, relationship_type } = input;
    try {
      // Find relationship_type of user_id_from to user_id_to
      const result = await session.run(
        'MATCH (s)-[r:${relationship_type}]->(t) WHERE s.user_id = ${from_user_id} AND t.user_id = ${to_user_id} RETURN r',
        {
          relationship_type: relationship_type,
          from_user_id: user_id_from,
          to_user_id: user_id_to,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(
          `Relationship not found: ${user_id_from} to ${user_id_to}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to find user relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async findUserFromRelationship(input: {
    user_id: string;
    relationship_type: string;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, relationship_type } = input;
    try {
      const result = await session.run(
        'MATCH (s)-[r:${relationship_type}]->(t) WHERE s.user_id = ${user_id} RETURN r',
        {
          relationship_type: relationship_type,
          user_id: user_id,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`Relationship not found: ${user_id}`);
        return [];
      }
      return result.records.map((record) => record.get('r') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to find user from relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  async findUserToRelationship(input: {
    user_id: string;
    relationship_type: string;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, relationship_type } = input;
    try {
      const result = await session.run(
        'MATCH (s)-[r:${relationship_type}]->(t) WHERE t.user_id = ${user_id} RETURN r',
        {
          relationship_type: relationship_type,
          user_id: user_id,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`Relationship not found: ${user_id}`);
        return [];
      }
      return result.records.map((record) => record.get('r') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to find user to relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  async createUserToUserRelationship(input: {
    user_id_from: string;
    user_id_to: string;
    relationship_type: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to, relationship_type } = input;
    try {
      // Create relationship
      await session.run(
        'MATCH (s:User {user_id: $user_id_from}), (t:User {user_id: $user_id_to}) CREATE (s)-[r:${relationship_type}]->(t)',
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
          relationship_type: relationship_type,
        },
      );
      this.logger.log(
        `Relationship created successfully: ${user_id_from} to ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to create user relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async deleteUserToUserRelationship(input: {
    user_id_from: string;
    user_id_to: string;
    relationship_type: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to, relationship_type } = input;
    try {
      // Delete relationship
      await session.run(
        'MATCH (s:User {user_id: $user_id_from})-[r:${relationship_type}]->(t:User {user_id: $user_id_to}) DELETE r',
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
          relationship_type: relationship_type,
        },
      );
      this.logger.log(
        `Relationship deleted successfully: ${user_id_from} to ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete user relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async deleteTwoUsersRelationships(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to } = input;
    try {
      // Delete all relationships between two users
      await session.run(
        'MATCH (s:User {user_id: $user_id_from})-[r:${relationship_type}]->(t:User {user_id: $user_id_to}) DELETE r',
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      await session.run(
        'MATCH (s:User {user_id: $user_id_to})-[r:${relationship_type}]->(t:User {user_id: $user_id_from}) DELETE r',
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      this.logger.log(
        `All relationships deleted successfully: ${user_id_from} and ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete two users relationships: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }
}
