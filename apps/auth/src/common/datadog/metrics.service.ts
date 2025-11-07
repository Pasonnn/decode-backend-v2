/**
 * @fileoverview Datadog Metrics Service
 *
 * This service provides a comprehensive interface for sending custom metrics to Datadog
 * using DogStatsD protocol. It supports all metric types (counters, gauges, histograms, timers)
 * and provides automatic tagging with service context.
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StatsD from 'hot-shots';

// Type for the StatsD client instance
type StatsDClient = InstanceType<typeof StatsD>;

export interface MetricTags {
  [key: string]: string | number;
}

export interface TimerOptions {
  tags?: MetricTags;
  sampleRate?: number;
}

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly client: StatsDClient;
  private readonly serviceName: string;
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName =
      this.configService.get<string>('DD_SERVICE') || 'unknown-service';
    this.environment = this.configService.get<string>('DD_ENV') || 'production';

    // Get DogStatsD configuration
    const host = this.configService.get<string>('DD_AGENT_HOST') || 'localhost';
    const port = parseInt(
      this.configService.get<string>('DD_DOGSTATSD_PORT') || '8125',
      10,
    );

    this.client = new StatsD({
      host,
      port,
      prefix: '',
      bufferFlushInterval: 1000,
      telegraf: false,
      errorHandler: (error: Error) => {
        this.logger.error(
          `DogStatsD error: ${error.message}. Host: ${host}, Port: ${port}`,
        );
      },
      mock: false,
    });

    this.logger.log(
      `MetricsService initialized for ${this.serviceName} in ${this.environment}. Connecting to DogStatsD at ${host}:${port}`,
    );

    // Send a test metric on initialization to verify connectivity
    try {
      this.client.increment('metrics.service.initialized', 1, [
        `service:${this.serviceName}`,
        `env:${this.environment}`,
      ]);
      this.logger.log(
        `Test metric sent: metrics.service.initialized for ${this.serviceName}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send test metric: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get default tags for all metrics
   */
  private getDefaultTags(customTags?: MetricTags): string[] {
    const tags: string[] = [
      `service:${this.serviceName}`,
      `env:${this.environment}`,
    ];

    if (customTags) {
      Object.entries(customTags).forEach(([key, value]) => {
        tags.push(`${key}:${String(value)}`);
      });
    }

    return tags;
  }

  /**
   * Increment a counter metric
   */
  increment(
    metricName: string,
    value: number = 1,
    tags?: MetricTags,
    sampleRate?: number,
  ): void {
    try {
      if (sampleRate !== undefined) {
        this.client.increment(
          metricName,
          value,
          sampleRate,
          this.getDefaultTags(tags),
        );
      } else {
        this.client.increment(metricName, value, this.getDefaultTags(tags));
      }
    } catch (error) {
      this.logger.error(
        `Failed to increment metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Decrement a counter metric
   */
  decrement(metricName: string, value: number = 1, tags?: MetricTags): void {
    try {
      this.client.decrement(metricName, value, this.getDefaultTags(tags));
    } catch (error) {
      this.logger.error(
        `Failed to decrement metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Set a gauge metric (current value)
   */
  gauge(metricName: string, value: number, tags?: MetricTags): void {
    try {
      this.client.gauge(metricName, value, this.getDefaultTags(tags));
    } catch (error) {
      this.logger.error(
        `Failed to set gauge metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Record a histogram metric (statistical distribution)
   */
  histogram(
    metricName: string,
    value: number,
    tags?: MetricTags,
    sampleRate?: number,
  ): void {
    try {
      if (sampleRate !== undefined) {
        this.client.histogram(
          metricName,
          value,
          sampleRate,
          this.getDefaultTags(tags),
        );
      } else {
        this.client.histogram(metricName, value, this.getDefaultTags(tags));
      }
    } catch (error) {
      this.logger.error(
        `Failed to record histogram metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Record a timer metric (duration in milliseconds)
   */
  timing(
    metricName: string,
    durationMs: number,
    tags?: MetricTags,
    sampleRate?: number,
  ): void {
    try {
      if (sampleRate !== undefined) {
        this.client.timing(
          metricName,
          durationMs,
          sampleRate,
          this.getDefaultTags(tags),
        );
      } else {
        this.client.timing(metricName, durationMs, this.getDefaultTags(tags));
      }
    } catch (error) {
      this.logger.error(
        `Failed to record timing metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Time an async function and record the duration
   */
  async timeAsync<T>(
    metricName: string,
    fn: () => Promise<T>,
    tags?: MetricTags,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.timing(metricName, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timing(metricName, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Time a synchronous function and record the duration
   */
  timeSync<T>(metricName: string, fn: () => T, tags?: MetricTags): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.timing(metricName, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timing(metricName, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Record a distribution metric (for advanced analytics)
   */
  distribution(metricName: string, value: number, tags?: MetricTags): void {
    try {
      this.client.distribution(metricName, value, this.getDefaultTags(tags));
    } catch (error) {
      this.logger.error(
        `Failed to record distribution metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Set a metric with a specific value (for events)
   */
  set(metricName: string, value: string | number, tags?: MetricTags): void {
    try {
      this.client.set(metricName, value, this.getDefaultTags(tags));
    } catch (error) {
      this.logger.error(
        `Failed to set metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Close the DogStatsD client connection
   */
  onModuleDestroy(): void {
    try {
      this.client.close();
      this.logger.log('MetricsService client closed');
    } catch (error) {
      this.logger.error(
        `Error closing metrics client: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
