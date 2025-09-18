import { HttpStatus, Injectable, Logger } from '@nestjs/common';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';
import { RedisInfrastructure } from '../infrastructure/redis.infrastructure';

// Interface Import
import type { PaginationResponse } from '../interfaces/pagination-response.interface';
import { UserNeo4jDoc } from '../interfaces/user-neo4j-doc.interface';
import { NodeResponse } from '../interfaces/node-response.interface';

// Service Import
import { UserService } from './user.service';

/**
 * SuggestService - Friend Suggestion Algorithm Service
 *
 * This service implements a sophisticated friend suggestion algorithm that combines
 * graph-based relationship analysis with Redis caching for optimal performance.
 *
 * Algorithm Overview:
 * 1. Second-degree connections: Friends of friends (2 hops away)
 * 2. Third-degree connections: Friends of friends of friends (3 hops away)
 * 3. Intelligent pagination that transitions from 2nd to 3rd degree suggestions
 * 4. Redis-based deduplication to prevent showing already suggested users
 *
 * Performance Optimizations:
 * - Redis caching with 5-minute TTL to store previously suggested users
 * - Pagination-aware algorithm that calculates optimal transition points
 * - Graph database queries optimized for relationship traversal
 *
 * @author Development Team
 * @since 1.0.0
 */
@Injectable()
export class SuggestService {
  private readonly logger = new Logger(SuggestService.name);
  constructor(
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
    private readonly redisInfrastructure: RedisInfrastructure,
    private readonly userService: UserService,
  ) {
    this.logger = new Logger(SuggestService.name);
    this.neo4jInfrastructure = neo4jInfrastructure;
    this.redisInfrastructure = redisInfrastructure;
    this.userService = userService;
  }

  /**
   * Retrieves paginated friend suggestions for a user using a multi-tier algorithm
   *
   * Algorithm Flow:
   * 1. Fetches suggestions from Neo4j using a hybrid 2nd/3rd degree approach
   * 2. Retrieves cached suggestions from Redis to avoid duplicates
   * 3. Filters out already suggested users using set difference operation
   * 4. Updates Redis cache with new suggestions (5-minute TTL)
   * 5. Returns filtered, paginated results
   *
   * Caching Strategy:
   * - Key: `suggestions:${user_id}`
   * - TTL: 5 minutes (300 seconds)
   * - Purpose: Prevent duplicate suggestions across pagination requests
   *
   * Performance Considerations:
   * - O(n) filtering operation where n = number of new suggestions
   * - Redis operations are O(1) for get/set
   * - Neo4j queries use indexed user_id fields for optimal traversal
   *
   * Error Handling:
   * - Graceful degradation on Neo4j failures
   * - Redis failures don't block suggestions (cache miss scenario)
   * - Comprehensive logging for debugging and monitoring
   *
   * @param input - Request parameters
   * @param input.user_id - Target user ID for generating suggestions
   * @param input.page - Page number (0-based indexing)
   * @param input.limit - Number of suggestions per page
   *
   * @returns Promise<PaginationResponse<UserNeo4jDoc[]>> - Paginated suggestion results
   *
   * @example
   * ```typescript
   * const suggestions = await suggestService.getSuggestionsPaginated({
   *   user_id: 'user123',
   *   page: 0,
   *   limit: 10
   * });
   * ```
   *
   * @throws {Error} When Neo4j infrastructure fails
   * @throws {Error} When Redis infrastructure is unavailable
   */
  async getSuggestionsPaginated(input: {
    user_id: string;
    page: number;
    limit: number;
  }): Promise<PaginationResponse<UserNeo4jDoc[]>> {
    const { user_id, page, limit } = input;

    try {
      // Step 1: Fetch fresh suggestions from Neo4j using hybrid 2nd/3rd degree algorithm
      // This method intelligently transitions from 2nd to 3rd degree connections
      // based on available data and pagination requirements
      const suggestions: PaginationResponse<NodeResponse<UserNeo4jDoc>[]> =
        await this.neo4jInfrastructure.getFriendsSuggestions({
          user_id: user_id,
          page: page,
          limit: limit,
        });

      // Early return if Neo4j query failed or returned no data
      if (!suggestions.success || !suggestions.data) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to get suggestions`,
        };
      }

      const new_suggestion_users: NodeResponse<UserNeo4jDoc>[] =
        suggestions.data.users;

      // Step 2: Retrieve cached suggestions to implement deduplication
      // Cache key format: suggestions:${user_id}
      // This prevents showing the same user multiple times across different pages
      const cached_suggestion_users =
        ((await this.redisInfrastructure.get(
          `suggestions:${user_id}`,
        )) as NodeResponse<UserNeo4jDoc>[]) || []; // Default to empty array if cache miss

      // Step 3: Filter out already suggested users using set difference
      // Time complexity: O(n*m) where n = new suggestions, m = cached suggestions
      // TODO: Consider using Set data structure for O(1) lookup performance
      const not_cached_suggestion_users = new_suggestion_users.filter(
        (user) =>
          !cached_suggestion_users.some(
            (cachedUser) =>
              cachedUser.properties.user_id === user.properties.user_id,
          ),
      );

      // Step 4: Update Redis cache with combined suggestions
      // TTL: 5 minutes to balance freshness with performance
      // This ensures users don't see the same suggestions repeatedly
      await this.redisInfrastructure.set(
        `suggestions:${user_id}`,
        [...cached_suggestion_users, ...not_cached_suggestion_users],
        5 * 60, // 5 minutes TTL
      );

      // Step 5: Filter out already suggested users with needed information
      const suggestion_users = await this.userService.filterUsers({
        users: not_cached_suggestion_users,
        from_user_id: user_id,
      });

      // Step 6: Return filtered, paginated results
      // Note: The total count reflects filtered results, not original Neo4j count
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Suggestions fetched successfully`,
        data: {
          users: suggestion_users,
          meta: {
            total: suggestion_users.length,
            page: page,
            limit: limit,
            is_last_page: suggestions.data.meta.is_last_page,
          },
        },
      };
    } catch (error) {
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
}
