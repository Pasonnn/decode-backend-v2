import { Logger, Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';

// Infrastructure Import
import { Neo4jInfrastructure } from '../infrastructure/neo4j.infrastructure';

// Schema Import
import { FollowerSnapshot } from '../schema/follower-snapshot.schema';
import { Response } from '../interfaces/response.interface';

@Injectable()
export class FollowerSnapshotService {
  private readonly logger = new Logger(FollowerSnapshotService.name);
  constructor(
    @InjectModel(FollowerSnapshot.name)
    private readonly followerSnapshotRepository: Model<FollowerSnapshot>,
    private readonly neo4jInfrastructure: Neo4jInfrastructure,
  ) {
    this.logger = new Logger(FollowerSnapshotService.name);
  }

  async getFollowersSnapshotDataLastMonth(input: {
    user_id: string;
  }): Promise<Response<FollowerSnapshot[]>> {
    const { user_id } = input;
    try {
      const followers = await this.followerSnapshotRepository.find(
        {
          user_id: new Types.ObjectId(user_id),
          snapshot_at: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        {
          followers: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      );
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: `Followers snapshot data last month fetched successfully`,
        data: followers,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get followers snapshot data last month: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to get followers snapshot data last month`,
      };
    }
  }

  /**
   * Automated daily snapshot of all users' followers
   *
   * Cron Schedule: '0 2 * * *' - Runs every day at 2:00 AM UTC
   *
   * Cron format: minute hour day month dayOfWeek
   * - 0: minute (0)
   * - 2: hour (2 AM)
   * - *: day of month (every day)
   * - *: month (every month)
   * - *: day of week (every day of week)
   *
   * This job will:
   * 1. Fetch all users from Neo4j
   * 2. For each user, get their current followers
   * 3. Store a snapshot in MongoDB with timestamp
   * 4. Log progress and any errors
   */
  @Cron('0 2 * * *', {
    name: 'daily-follower-snapshot',
    timeZone: 'UTC',
  })
  async snapshotAllNodesFollowers() {
    this.logger.log('Starting daily follower snapshot process...');

    try {
      const nodes = await this.neo4jInfrastructure.getAllUsers();
      this.logger.log(`Found ${nodes.length} users to snapshot`);

      let successCount = 0;
      let errorCount = 0;

      for (const node of nodes) {
        try {
          await this.snapshotFollowers({ user_id: node.properties.user_id });
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to snapshot followers for user ${node.properties.user_id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(
        `Daily follower snapshot completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Daily follower snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Manual trigger for follower snapshot (useful for testing)
   */
  async triggerManualSnapshot(): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log('Manual follower snapshot triggered');

    try {
      await this.snapshotAllNodesFollowers();
      return {
        success: true,
        message: 'Manual follower snapshot completed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Manual follower snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        message: `Manual follower snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async snapshotFollowers(input: { user_id: string }): Promise<void> {
    const { user_id } = input;
    try {
      const followers = await this.neo4jInfrastructure.getAllFollowers({
        user_id: user_id,
      });
      await this.followerSnapshotRepository.create({
        user_id: new Types.ObjectId(user_id),
        followers: followers.map((follower) => follower.properties.user_id),
        followers_number: followers.length,
        snapshot_at: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to snapshot followers: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
