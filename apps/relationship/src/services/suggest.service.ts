import { HttpStatus, Injectable, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';
import { RedisInfrastructure } from '../infrastructure/cache/redis.infrastructure';

// Interface Import
import type { PaginationResponse } from '../interfaces/pagination-response.interface';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import { NodeResponse } from '../interfaces/node-response.interface';

// Service Import
import { UserService } from './user.service';
import { MetricsService } from '../common/datadog/metrics.service';

@Injectable()
export class SuggestService {
  private readonly logger = new Logger(SuggestService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly userService: UserService,
    private readonly metricsService?: MetricsService,
  ) {
    this.logger = new Logger(SuggestService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.redisInfrastructure = redisInfrastructure;
    this.userService = userService;
  }

  async getSuggestionsPaginated(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, page, limit } = input;

    try {
      // Step 1: Get fresh suggestions from Neo4j with priority ordering
      const suggestions: PaginationResponse<NodeResponse<UserNeo4jDoc>[]> =
        await this.neo4jInfrastructure.getFriendsSuggestions({
          user_id: user_id,
          page: page,
          limit: limit,
        });

      // Early return if Neo4j query failed or returned no data
      if (!suggestions.success || !suggestions.data) {
        this.metricsService?.increment(
          'relationship.suggestions.generated',
          1,
          {
            operation: 'getSuggestionsPaginated',
            status: 'failed',
          },
        );
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get suggestions`,
        };
      }

      const new_suggestion_users: NodeResponse<UserNeo4jDoc>[] =
        suggestions.data.users;

      // Step 2: Get previously suggested users from Redis cache for deduplication
      // This prevents showing the same user across different pages
      const cache_key = `suggestions:${user_id}`;
      const cached_suggestion_user_ids =
        await this.getCachedSuggestionUserIds(cache_key);

      // Step 3: Filter out already suggested users
      const not_cached_suggestion_users = new_suggestion_users.filter(
        (user) => !cached_suggestion_user_ids.has(user.properties.user_id),
      );

      // Step 4: Update Redis cache with new suggestions
      if (not_cached_suggestion_users.length > 0) {
        await this.updateCachedSuggestionUserIds(
          cache_key,
          not_cached_suggestion_users.map((user) => user.properties.user_id),
        );
      }

      // Step 5: Filter users with additional information (blocked status, etc.)
      const suggestion_users = await this.userService.filterUsers({
        users: not_cached_suggestion_users,
        from_user_id: user_id,
      });

      // Record business metrics
      this.metricsService?.increment('relationship.suggestions.generated', 1, {
        operation: 'getSuggestionsPaginated',
        status: 'success',
      });
      this.metricsService?.histogram(
        'relationship.suggestions.results',
        suggestion_users.length,
        {
          operation: 'getSuggestionsPaginated',
        },
      );

      // Step 6: Return filtered, paginated results
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Suggestions fetched successfully`,
        data: {
          users: suggestion_users,
          meta: {
            total: suggestions.data.meta.total,
            page: page,
            limit: limit,
            is_last_page: suggestions.data.meta.is_last_page,
          },
        },
      };
    } catch (error) {
      this.metricsService?.increment('relationship.suggestions.generated', 1, {
        operation: 'getSuggestionsPaginated',
        status: 'failed',
      });
      // Comprehensive error logging for debugging and monitoring
      this.logger.error(
        `Failed to get suggestions for user ${user_id}: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Return standardized error response
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get suggestions`,
      };
    }
  }

  /**
   * Get cached suggestion user IDs from Redis
   * Returns a Set for O(1) lookup performance
   */
  private async getCachedSuggestionUserIds(
    cache_key: string,
  ): Promise<Set<string>> {
    try {
      const cached_ids = (await this.redisInfrastructure.get(
        cache_key,
      )) as unknown;
      if (Array.isArray(cached_ids)) {
        return new Set(cached_ids as string[]);
      }
      return new Set();
    } catch (error) {
      this.logger.warn(
        `Failed to get cached suggestions: ${error instanceof Error ? error.message : String(error)}`,
      );
      return new Set();
    }
  }

  /**
   * Update Redis cache with new suggestion user IDs
   * Appends new IDs to existing cache to maintain deduplication across pages
   */
  private async updateCachedSuggestionUserIds(
    cache_key: string,
    new_user_ids: string[],
  ): Promise<void> {
    try {
      // Get existing cached IDs
      const existing_ids = await this.getCachedSuggestionUserIds(cache_key);

      // Add new IDs to existing set (automatically deduplicates)
      new_user_ids.forEach((id) => existing_ids.add(id));

      // Convert back to array and store in Redis
      const all_ids = Array.from(existing_ids);
      await this.redisInfrastructure.set(cache_key, all_ids, 5 * 60); // 5 minutes TTL

      this.logger.log(
        `Updated suggestion cache for key ${cache_key} with ${new_user_ids.length} new suggestions`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update cached suggestions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
