import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import { PaginationResponse } from '../interfaces/pagination-response.interface';
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

  async findUserNode(input: { user_id: string }): Promise<UserNeo4jDoc | null> {
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
        return null;
      }
      return result.records[0].get('u') as UserNeo4jDoc;
    } catch (error) {
      this.logger.error(
        `Failed to find user node: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
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
        'MATCH (s)-[r:$relationship_type]->(t) WHERE s.user_id = $from_user_id AND t.user_id = $to_user_id RETURN r',
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

  async findUserFromRelationshipPaginated(input: {
    user_id: string;
    relationship_type: string;
    page: number;
    limit: number;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, relationship_type, page, limit } = input;
    try {
      const result = await session.run(
        'MATCH (s)-[r:$relationship_type]->(t) WHERE s.user_id = $user_id RETURN t SKIP $skip LIMIT $limit',
        {
          relationship_type: relationship_type,
          user_id: user_id,
          skip: page * limit,
          limit: limit,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`Relationship not found: ${user_id}`);
        return [];
      }
      return result.records.map((record) => record.get('t') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to find user from relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  async findUserToRelationshipPaginated(input: {
    user_id: string;
    relationship_type: string;
    page: number;
    limit: number;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, relationship_type, page, limit } = input;
    try {
      const result = await session.run(
        'MATCH (s)-[r:$relationship_type]->(t) WHERE t.user_id = $user_id RETURN s SKIP $skip LIMIT $limit',
        {
          relationship_type: relationship_type,
          user_id: user_id,
          skip: page * limit,
          limit: limit,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`Relationship not found: ${user_id}`);
        return [];
      }
      return result.records.map((record) => record.get('s') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to find user to relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  async createUserToUserFollowingRelationship(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to } = input;
    try {
      // Create relationship
      await session.run(
        `MATCH (s:User {user_id: $user_id_from}), (t:User {user_id: $user_id_to}) CREATE (s)-[r:FOLLOWING]->(t);
        SET s.following_number = s.following_number + 1, t.followers_number = t.followers_number + 1`,
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      this.logger.log(
        `User following relationship created successfully: ${user_id_from} to ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to create user following relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async createUserToUserBlockedRelationship(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to } = input;
    try {
      // Create relationship
      await session.run(
        `MATCH (s:User {user_id: $user_id_from}), (t:User {user_id: $user_id_to}) CREATE (s)-[r:BLOCKED]->(t);`,
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      this.logger.log(
        `User blocked relationship created successfully: ${user_id_from} to ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to create user blocked relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async deleteUserToUserFollowingRelationship(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to } = input;
    try {
      // Delete relationship
      await session.run(
        `MATCH (s:User {user_id: $user_id_from})-[r:FOLLOWING]->(t:User {user_id: $user_id_to}) DELETE r;
        SET s.following_number = s.following_number - 1, t.followers_number = t.followers_number - 1`,
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      this.logger.log(
        `User following relationship deleted successfully: ${user_id_from} to ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete user following relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async deleteUserToUserBlockedRelationship(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<boolean> {
    const session = this.getSession();
    const { user_id_from, user_id_to } = input;
    try {
      // Delete relationship
      await session.run(
        `MATCH (s:User {user_id: $user_id_from})-[r:BLOCKED]->(t:User {user_id: $user_id_to}) DELETE r;`,
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      this.logger.log(
        `User blocked relationship deleted successfully: ${user_id_from} to ${user_id_to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete user blocked relationship: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      await session.close();
    }
  }

  async getFriendsSuggestions(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const session = this.getSession();
    const { user_id, page, limit } = input;
    try {
      const second_degree_suggestions_count =
        await this.secondDegreeSuggestionsCount({
          user_id: user_id,
        });
      const third_degree_start_page = Math.ceil(
        second_degree_suggestions_count / limit,
      );
      if (page < third_degree_start_page) {
        const second_degree_suggestions = await this.secondDegreeSuggestions({
          user_id: user_id,
          page: page,
          limit: limit,
        });
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: `Second degree suggestions fetched successfully`,
          data: {
            users: second_degree_suggestions,
            meta: {
              total: second_degree_suggestions.length,
              page: page,
              limit: limit,
              is_last_page: false,
            },
          },
        };
      } else {
        const third_degree_suggestions = await this.thirdDegreeSuggestions({
          user_id: user_id,
          page: third_degree_start_page,
          limit: limit,
        });
        const is_last_page = third_degree_suggestions.length < limit;
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: `Third degree suggestions fetched successfully`,
          data: {
            users: third_degree_suggestions,
            meta: {
              total: third_degree_suggestions.length,
              page: third_degree_start_page,
              limit: limit,
              is_last_page: is_last_page,
            },
          },
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to get friends suggestions: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get friends suggestions`,
      };
    } finally {
      await session.close();
    }
  }

  private async secondDegreeSuggestions(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, page, limit } = input;
    try {
      const result = await session.run(
        `MATCH (me:User {user_id: ${user_id}})-[:FOLLOWING]->(follower)-[:FOLLOWING]->(fof)
        WHERE NOT (me)-[:FOLLOWING]->(fof) AND me <> fof
        RETURN DISTINCT fof.user_id, fof.username, fof.display_name, fof.avatar_ipfs_hash
        SKIP $skip LIMIT $limit`,
        {
          user_id: user_id,
          skip: page * limit,
          limit: limit,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(
          `No second degree suggestions found for user: ${user_id}`,
        );
        return [];
      }
      return result.records.map((record) => record.get('fof') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to get second degree suggestions: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  private async thirdDegreeSuggestions(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, page, limit } = input;
    try {
      const result = await session.run(
        `MATCH (me:User {user_id: $user_id})-[:FOLLOWING]->(follower)-[:FOLLOWING]->(fof)-[:FOLLOWING]->(fofof)
        WHERE NOT (me)-[:FOLLOWING]->(fofof) AND me <> fofof AND fof <> fofof
        RETURN DISTINCT fofof.user_id, fofof.username, fofof.display_name, fofof.avatar_ipfs_hash
        SKIP $skip LIMIT $limit`,
        {
          user_id: user_id,
          skip: page * limit,
          limit: limit,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(
          `No third degree suggestions found for user: ${user_id}`,
        );
        return [];
      }
      return result.records.map(
        (record) => record.get('fofof') as UserNeo4jDoc,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get second degree suggestions: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  private async secondDegreeSuggestionsCount(input: {
    user_id: string;
  }): Promise<number> {
    const session = this.getSession();
    const { user_id } = input;
    try {
      const result = await session.run(
        `MATCH (me:User {user_id: $user_id})-[:FOLLOWING]->(follower)-[:FOLLOWING]->(fof)
        WHERE NOT (me)-[:FOLLOWING]->(fof) AND me <> fof
        RETURN COUNT(DISTINCT fof.user_id)`,
        {
          user_id: user_id,
        },
      );
      return result.records[0].get('count') as number;
    } catch (error) {
      this.logger.error(
        `Failed to get second degree suggestions count: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    } finally {
      await session.close();
    }
  }

  async getMutualFollowers(input: {
    user_id_from: string;
    user_id_to: string;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id_from, user_id_to } = input;
    try {
      // get followers of user_id_from who I am following
      const result = await session.run(
        `MATCH (s:User {user_id: $user_id_from})-[:FOLLOWING]->(follower)-[:FOLLOWING]->(t:User {user_id: $user_id_to})
        RETURN DISTINCT follower.user_id, follower.username, follower.display_name, follower.avatar_ipfs_hash`,
        {
          user_id_from: user_id_from,
          user_id_to: user_id_to,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`No mutual followers found for user: ${user_id_from}`);
        return [];
      }
      return result.records.map(
        (record) => record.get('follower') as UserNeo4jDoc,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get mutual followers: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  async searchFollowers(input: {
    user_id: string;
    params: string;
    page: number;
    limit: number;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, params, page, limit } = input;
    try {
      const result = await session.run(
        `MATCH (s:User)-[:FOLLOWING]->(t:User {user_id: $user_id})
         WHERE (toLower(t.username) CONTAINS toLower($params)
            OR toLower(t.display_name) CONTAINS toLower($params)
         RETURN t.user_id, t.username, t.display_name, t.avatar_ipfs_hash
         SKIP $skip LIMIT $limit`,
        {
          user_id: user_id,
          params: params,
          skip: page * limit,
          limit: limit,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`No followers found for params: ${params}`);
        return [];
      }
      return result.records.map((record) => record.get('t') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to search followers: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }

  async searchFollowing(input: {
    user_id: string;
    params: string;
    page: number;
    limit: number;
  }): Promise<UserNeo4jDoc[]> {
    const session = this.getSession();
    const { user_id, params, page, limit } = input;
    try {
      const result = await session.run(
        `MATCH (s:User {user_id: $user_id})-[:FOLLOWING]->(t:User)
         WHERE toLower(t.username) CONTAINS toLower($params)
            OR toLower(t.display_name) CONTAINS toLower($params)
         RETURN t.user_id, t.username, t.display_name, t.avatar_ipfs_hash
         SKIP $skip LIMIT $limit`,
        {
          user_id: user_id,
          params: params,
          skip: page * limit,
          limit: limit,
        },
      );
      if (result.records.length === 0) {
        this.logger.log(`No following found for params: ${params}`);
        return [];
      }
      return result.records.map((record) => record.get('t') as UserNeo4jDoc);
    } catch (error) {
      this.logger.error(
        `Failed to search following: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    } finally {
      await session.close();
    }
  }
}
