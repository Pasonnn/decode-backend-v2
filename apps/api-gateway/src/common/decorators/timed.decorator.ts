/**
 * @fileoverview Timed Decorator
 *
 * Decorator for automatically timing method execution.
 * Records duration as a histogram metric.
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { SetMetadata } from '@nestjs/common';

export const TIMED_KEY = 'timed';

export interface TimedOptions {
  metricName: string;
  tags?: Record<string, string | number>;
}

/**
 * Timed decorator for automatic execution time tracking
 *
 * @param options - Timer configuration options
 * @example
 * ```typescript
 * @Timed({ metricName: 'db.query.duration', tags: { collection: 'users' } })
 * async findUser() { ... }
 * ```
 */
export const Timed = (options: TimedOptions) => SetMetadata(TIMED_KEY, options);
