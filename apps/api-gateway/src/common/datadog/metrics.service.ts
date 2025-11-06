/**
 * @fileoverview Datadog Metrics Service
 *
 * This service provides a comprehensive interface for sending custom metrics to Datadog
 * using DogStatsD protocol. It supports all metric types (counters, gauges, histograms, timers)
 * and provides automatic tagging with service context.
 *
 * Metric Types:
 * - Counter: Increment/decrement values (e.g., request counts, errors)
 * - Gauge: Current value snapshot (e.g., active connections, cache size)
 * - Histogram: Statistical distribution (e.g., response times, request sizes)
 * - Timer: Duration tracking (e.g., function execution time, query duration)
 *
 * Features:
 * - Automatic service tagging
 * - Environment tagging
 * - Custom tag support
 * - Error handling and fallback
 * - Connection pooling for performance
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StatsD from 'hot-shots';

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
  private readonly client: InstanceType<typeof StatsD>;
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

    // Initialize DogStatsD client
    // Note: DD_DOGSTATSD_SOCKET is a file path string, not a Socket object
    // hot-shots socket option expects a Socket object, so we omit it here
    // If socket-based communication is needed, it should be configured separately
    this.client = new StatsD({
      host,
      port,
      prefix: '',
      bufferFlushInterval: 1000,
      telegraf: false,
      errorHandler: (error) => {
        this.logger.error(`DogStatsD error: ${error.message}`);
      },
      mock: false,
    });

    this.logger.log(
      `MetricsService initialized for ${this.serviceName} in ${this.environment}`,
    );
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
   * @param metricName - Name of the metric (e.g., 'auth.login.success')
   * @param value - Value to increment by (default: 1)
   * @param tags - Additional tags
   * @param sampleRate - Sample rate (0-1)
   */
  increment(
    metricName: string,
    value: number = 1,
    tags?: MetricTags,
    sampleRate?: number,
  ): void {
    try {
      this.client.increment(
        metricName,
        value,
        this.getDefaultTags(tags),
        sampleRate,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Decrement a counter metric
   * @param metricName - Name of the metric
   * @param value - Value to decrement by (default: 1)
   * @param tags - Additional tags
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
   * @param metricName - Name of the metric
   * @param value - Current value
   * @param tags - Additional tags
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
   * @param metricName - Name of the metric
   * @param value - Value to record
   * @param tags - Additional tags
   * @param sampleRate - Sample rate (0-1)
   */
  histogram(
    metricName: string,
    value: number,
    tags?: MetricTags,
    sampleRate?: number,
  ): void {
    try {
      this.client.histogram(
        metricName,
        value,
        this.getDefaultTags(tags),
        sampleRate,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record histogram metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Record a timer metric (duration in milliseconds)
   * @param metricName - Name of the metric
   * @param durationMs - Duration in milliseconds
   * @param tags - Additional tags
   * @param sampleRate - Sample rate (0-1)
   */
  timing(
    metricName: string,
    durationMs: number,
    tags?: MetricTags,
    sampleRate?: number,
  ): void {
    try {
      this.client.timing(
        metricName,
        durationMs,
        this.getDefaultTags(tags),
        sampleRate,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record timing metric ${metricName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Time an async function and record the duration
   * @param metricName - Name of the metric
   * @param fn - Async function to time
   * @param tags - Additional tags
   * @returns Result of the function
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
   * @param metricName - Name of the metric
   * @param fn - Function to time
   * @param tags - Additional tags
   * @returns Result of the function
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
   * @param metricName - Name of the metric
   * @param value - Value to record
   * @param tags - Additional tags
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
   * @param metricName - Name of the metric
   * @param value - Value to set
   * @param tags - Additional tags
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
