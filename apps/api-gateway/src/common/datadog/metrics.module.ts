/**
 * @fileoverview Datadog Metrics Module
 *
 * This module provides the MetricsService for sending custom metrics to Datadog.
 * It should be imported globally in the application module.
 *
 * @author Decode Development Team
 * @version 2.0.0
 * @since 2024
 */

import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
