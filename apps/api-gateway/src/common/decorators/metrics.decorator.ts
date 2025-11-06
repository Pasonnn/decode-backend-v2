/**
 * @fileoverview Metrics Decorator
 *
 * Decorator for automatically tracking method execution metrics.
 * Automatically records timing and success/failure metrics.
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { SetMetadata } from '@nestjs/common';

export const METRICS_KEY = 'metrics';

export interface MetricsOptions {
  metricName: string;
  tags?: Record<string, string | number>;
  trackDuration?: boolean;
  trackSuccess?: boolean;
  trackFailure?: boolean;
}

/**
 * Metrics decorator for automatic metric collection
 *
 * @param options - Metric configuration options
 * @example
 * ```typescript
 * @Metrics({ metricName: 'auth.login', trackDuration: true })
 * async login() { ... }
 * ```
 */
export const Metrics = (options: MetricsOptions) =>
  SetMetadata(METRICS_KEY, options);
