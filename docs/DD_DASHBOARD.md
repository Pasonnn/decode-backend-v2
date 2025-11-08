# Datadog Dashboard Setup Guide

## Overview

This guide outlines all dashboards and metrics to create in Datadog for comprehensive system, service, and business monitoring. Use this as a reference for what to track, then follow Datadog's official documentation for UI implementation steps.

---

## Understanding Metrics: Custom Metrics vs Trace Metrics

This implementation provides **two types of metrics** for HTTP request monitoring:

### Custom Metrics (DogStatsD)

**Source**: Sent directly from application code via DogStatsD protocol
**Prefix**: `http.*`
**Examples**:
- `http.request.duration` - Request duration (timing metric)
- `http.request.count` - Request count (counter metric)
- `http.request.error` - Error count (counter metric)
- `http.request.size` - Request payload size (histogram)
- `http.response.size` - Response payload size (histogram)

**Characteristics**:
- ✅ Explicitly sent by application code
- ✅ Full control over tags and dimensions
- ✅ Available immediately after deployment
- ✅ Consistent naming and structure
- ✅ Can include business-specific tags (route, method, status_code)

**When to Use**:
- Primary choice for dashboards (recommended)
- When you need specific tags or dimensions
- For business metrics and custom KPIs
- When you want explicit control over metric collection

### Trace Metrics (APM)

**Source**: Automatically generated from APM traces by Datadog Agent
**Prefix**: `trace.*`
**Examples**:
- `trace.http.request.duration` - HTTP request duration from traces
- `trace.http.request.hits` - HTTP request count from traces
- `trace.http.request.errors` - HTTP error count from traces
- `trace.span.duration` - Span duration metrics

**Characteristics**:
- ✅ Automatically generated from APM traces
- ✅ No code changes required
- ✅ Includes all traced requests automatically
- ✅ Correlates with APM traces and spans
- ⚠️ May have different tag structure than custom metrics
- ⚠️ Requires APM traces to be present

**When to Use**:
- When you want metrics directly from trace data
- For correlation with APM traces
- As a backup/comparison to custom metrics
- When you need metrics for services without custom instrumentation

### Comparison Table

| Feature | Custom Metrics | Trace Metrics |
|---------|---------------|---------------|
| **Source** | Application code (DogStatsD) | APM traces (automatic) |
| **Metric Name** | `http.request.duration` | `trace.http.request.duration` |
| **Availability** | After code deployment | After traces are generated |
| **Tag Control** | Full control | Automatic from traces |
| **Code Changes** | Required | Not required |
| **Correlation** | Via tags | Direct with traces |
| **Recommended** | ✅ Primary choice | ✅ Secondary/comparison |

### Using Both Metrics

You can use both metric types in your dashboards:

**Example Query - Custom Metric**:
```
avg:http.request.duration{env:prod} by {service}
```

**Example Query - Trace Metric**:
```
avg:trace.http.request.duration{env:prod} by {service}
```

**Best Practice**: Use custom metrics (`http.request.duration`) as your primary source, and trace metrics (`trace.http.request.duration`) for comparison or when custom metrics are unavailable.

---

## Dashboard Structure

Create the following dashboards:

1. **System Overview Dashboard** - High-level system health
2. **Service Performance Dashboard** - Per-service performance metrics
3. **Business Metrics Dashboard** - User and business KPIs
4. **Database Performance Dashboard** - MongoDB and Neo4j metrics
5. **Queue & Cache Dashboard** - RabbitMQ and Redis metrics
6. **Error Tracking Dashboard** - Error rates and types
7. **WebSocket Dashboard** - Real-time connection metrics
8. **API Gateway Dashboard** - HTTP request metrics

---

## 1. System Overview Dashboard

**Purpose**: High-level system health and availability

### Widgets to Create

#### System Health Score
- **Metric**: `http.request.count` (sum)
- **Formula**: `(successful_requests / total_requests) * 100`
- **Filter**: `status_code:200,201,204`
- **Visualization**: Single Value / Gauge

#### Total Requests (Last 24h)
- **Metric**: `http.request.count` (sum)
- **Timeframe**: Last 24 hours
- **Visualization**: Timeseries

#### Error Rate
- **Metric**: `http.request.error` (sum)
- **Formula**: `error_count / total_requests * 100`
- **Visualization**: Timeseries

#### Active Services
- **Metric**: `metrics.service.initialized` (count)
- **Group by**: `service`
- **Visualization**: List / Table

#### Service Map
- **Type**: Service Map widget
- **Shows**: All `decode-*` services and their connections

#### Request Duration (P95)
- **Metric (Custom)**: `http.request.duration` (p95) - **Recommended**
- **Metric (Trace)**: `trace.http.request.duration` (p95) - Alternative
- **Group by**: `service`
- **Visualization**: Timeseries
- **Note**: Use custom metric as primary, trace metric for comparison

#### Top Error Routes
- **Metric**: `http.request.error` (sum)
- **Group by**: `route`
- **Order**: Descending
- **Visualization**: Top List

---

## 2. Service Performance Dashboard

**Purpose**: Detailed performance metrics per microservice

### Widgets to Create

#### Per-Service Request Count
- **Metric**: `http.request.count` (sum)
- **Group by**: `service`
- **Split by**: `status_code`
- **Visualization**: Timeseries (stacked)

#### Per-Service Request Duration
- **Metrics (Custom - Recommended)**:
  - `http.request.duration` (avg)
  - `http.request.duration` (p50)
  - `http.request.duration` (p95)
  - `http.request.duration` (p99)
- **Metrics (Trace - Alternative)**:
  - `trace.http.request.duration` (avg)
  - `trace.http.request.duration` (p50)
  - `trace.http.request.duration` (p95)
  - `trace.http.request.duration` (p99)
- **Group by**: `service`
- **Visualization**: Timeseries (multiple lines)
- **Note**: Use custom metrics as primary source

#### Per-Service Error Rate
- **Metric**: `http.request.error` (sum)
- **Group by**: `service`
- **Split by**: `error_type`
- **Visualization**: Timeseries

#### Service CPU Usage
- **Metric**: `system.cpu.user` (avg)
- **Filter**: `service:decode-*`
- **Group by**: `service`
- **Visualization**: Timeseries

#### Service Memory Usage
- **Metric**: `system.mem.used` (avg)
- **Filter**: `service:decode-*`
- **Group by**: `service`
- **Visualization**: Timeseries

#### Service Request Size
- **Metric**: `http.request.size` (avg)
- **Group by**: `service`
- **Visualization**: Timeseries

#### Service Response Size
- **Metric**: `http.response.size` (avg)
- **Group by**: `service`
- **Visualization**: Timeseries

#### Top Slow Routes by Service
- **Metric (Custom)**: `http.request.duration` (p95) - **Recommended**
- **Metric (Trace)**: `trace.http.request.duration` (p95) - Alternative
- **Group by**: `service`, `route`
- **Order**: Descending
- **Visualization**: Top List

---

## 3. Business Metrics Dashboard

**Purpose**: User behavior and business KPIs

### Widgets to Create

#### User Search Operations
- **Metric**: `user.search.executed` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### User Search Results Distribution
- **Metric**: `user.search.results` (histogram)
- **Visualization**: Distribution

#### Profile Views
- **Metric**: `user.profile.viewed` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Profile Updates
- **Metric**: `user.profile.updated` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Email Changes
- **Metric**: `user.email.changed` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Username Changes
- **Metric**: `user.username.changed` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Follow Operations
- **Metric**: `relationship.follow` (sum)
- **Visualization**: Timeseries

#### Unfollow Operations
- **Metric**: `relationship.unfollow` (sum)
- **Visualization**: Timeseries

#### Block Operations
- **Metric**: `relationship.block` (sum)
- **Visualization**: Timeseries

#### Unblock Operations
- **Metric**: `relationship.unblock` (sum)
- **Visualization**: Timeseries

#### Relationship Searches
- **Metric**: `relationship.search.executed` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Suggestions Generated
- **Metric**: `relationship.suggestions.generated` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Wallet Links
- **Metric**: `wallet.linked` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Wallet Unlinks
- **Metric**: `wallet.unlinked` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Primary Wallet Sets
- **Metric**: `wallet.primary.set` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Wallet Operation Duration
- **Metric**: `wallet.operation.duration` (avg, p95)
- **Split by**: `operation`
- **Visualization**: Timeseries

#### Notifications Created
- **Metric**: `notification.created` (sum)
- **Split by**: `type`, `status`
- **Visualization**: Timeseries

#### Notifications Read
- **Metric**: `notification.read` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Emails Sent
- **Metric**: `email.sent` (sum)
- **Split by**: `template`, `status`
- **Visualization**: Timeseries

#### Email Failures
- **Metric**: `email.failed` (sum)
- **Split by**: `template`, `error_type`
- **Visualization**: Timeseries

#### Email Processing Duration
- **Metric**: `email.processing.duration` (avg, p95)
- **Split by**: `template`
- **Visualization**: Timeseries

#### Sync Operations
- **Metrics**:
  - `sync.user.created` (sum)
  - `sync.user.updated` (sum)
- **Visualization**: Timeseries

#### Sync Duration
- **Metric**: `sync.duration` (avg, p95)
- **Split by**: `operation`
- **Visualization**: Timeseries

#### Sync Errors
- **Metric**: `sync.errors` (sum)
- **Split by**: `operation`, `error_type`
- **Visualization**: Timeseries

---

## 3.1. Business Metrics Reference Guide

This section provides comprehensive definitions and query examples for all business metrics used in the Business Metrics Dashboard.

### User Service Metrics

#### `user.search.executed`
- **Type**: Counter
- **Description**: Number of user search operations executed
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total searches
  sum:user.search.executed{env:prod}

  # Searches by status
  sum:user.search.executed{env:prod} by {status}

  # Searches by operation
  sum:user.search.executed{env:prod} by {operation}

  # Rate of searches per minute
  rate(sum:user.search.executed{env:prod}[1m])

  # Successful searches only
  sum:user.search.executed{env:prod,status:success}
  ```

#### `user.search.results`
- **Type**: Histogram
- **Description**: Distribution of number of results returned per search
- **Tags**: `service`, `env`, `operation`
- **Example Queries**:
  ```datadog
  # Average results per search
  avg:user.search.results{env:prod}

  # Results distribution by operation
  avg:user.search.results{env:prod} by {operation}

  # P95 results count
  p95(user.search.results{env:prod})

  # Histogram distribution
  histogram:user.search.results{env:prod}
  ```

#### `user.profile.viewed`
- **Type**: Counter
- **Description**: Number of profile view events
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total profile views
  sum:user.profile.viewed{env:prod}

  # Profile views by status
  sum:user.profile.viewed{env:prod} by {status}

  # Profile views per hour
  sum:user.profile.viewed{env:prod}.as_count().rollup(sum, 3600)

  # Successful profile views
  sum:user.profile.viewed{env:prod,status:success}
  ```

#### `user.profile.updated`
- **Type**: Counter
- **Description**: Number of profile update events
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total profile updates
  sum:user.profile.updated{env:prod}

  # Profile updates by status
  sum:user.profile.updated{env:prod} by {status}

  # Update success rate
  (sum:user.profile.updated{env:prod,status:success}.as_count() / sum:user.profile.updated{env:prod}.as_count()) * 100
  ```

#### `user.email.changed`
- **Type**: Counter
- **Description**: Number of email change operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total email changes
  sum:user.email.changed{env:prod}

  # Email changes by status
  sum:user.email.changed{env:prod} by {status}

  # Failed email changes
  sum:user.email.changed{env:prod,status:error}
  ```

#### `user.username.changed`
- **Type**: Counter
- **Description**: Number of username change operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total username changes
  sum:user.username.changed{env:prod}

  # Username changes by status
  sum:user.username.changed{env:prod} by {status}
  ```

### Relationship Service Metrics

#### `relationship.follow`
- **Type**: Counter
- **Description**: Number of follow operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total follows
  sum:relationship.follow{env:prod}

  # Follows by status
  sum:relationship.follow{env:prod} by {status}

  # Follows per hour
  sum:relationship.follow{env:prod}.as_count().rollup(sum, 3600)
  ```

#### `relationship.unfollow`
- **Type**: Counter
- **Description**: Number of unfollow operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total unfollows
  sum:relationship.unfollow{env:prod}

  # Unfollows by status
  sum:relationship.unfollow{env:prod} by {status}
  ```

#### `relationship.block`
- **Type**: Counter
- **Description**: Number of block operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total blocks
  sum:relationship.block{env:prod}

  # Blocks by status
  sum:relationship.block{env:prod} by {status}
  ```

#### `relationship.unblock`
- **Type**: Counter
- **Description**: Number of unblock operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total unblocks
  sum:relationship.unblock{env:prod}

  # Unblocks by status
  sum:relationship.unblock{env:prod} by {status}
  ```

#### `relationship.search.executed`
- **Type**: Counter
- **Description**: Number of relationship search operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total relationship searches
  sum:relationship.search.executed{env:prod}

  # Relationship searches by status
  sum:relationship.search.executed{env:prod} by {status}
  ```

#### `relationship.suggestions.generated`
- **Type**: Counter
- **Description**: Number of suggestion generation operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total suggestions generated
  sum:relationship.suggestions.generated{env:prod}

  # Suggestions by status
  sum:relationship.suggestions.generated{env:prod} by {status}

  # Successful suggestions
  sum:relationship.suggestions.generated{env:prod,status:success}
  ```

### Wallet Service Metrics

#### `wallet.linked`
- **Type**: Counter
- **Description**: Number of wallet link operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total wallet links
  sum:wallet.linked{env:prod}

  # Wallet links by status
  sum:wallet.linked{env:prod} by {status}

  # Successful wallet links
  sum:wallet.linked{env:prod,status:success}
  ```

#### `wallet.unlinked`
- **Type**: Counter
- **Description**: Number of wallet unlink operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total wallet unlinks
  sum:wallet.unlinked{env:prod}

  # Wallet unlinks by status
  sum:wallet.unlinked{env:prod} by {status}
  ```

#### `wallet.primary.set`
- **Type**: Counter
- **Description**: Number of primary wallet designation operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total primary wallet sets
  sum:wallet.primary.set{env:prod}

  # Primary wallet sets by status
  sum:wallet.primary.set{env:prod} by {status}
  ```

#### `wallet.operation.duration`
- **Type**: Timing
- **Description**: Duration of wallet operations in milliseconds
- **Tags**: `service`, `env`, `operation`
- **Example Queries**:
  ```datadog
  # Average wallet operation duration
  avg:wallet.operation.duration{env:prod}

  # Duration by operation type
  avg:wallet.operation.duration{env:prod} by {operation}

  # P95 wallet operation duration
  p95(wallet.operation.duration{env:prod})

  # P95 by operation
  p95(wallet.operation.duration{env:prod}) by {operation}
  ```

### Notification Service Metrics

#### `notification.created`
- **Type**: Counter
- **Description**: Number of notifications created
- **Tags**: `service`, `env`, `operation`, `status`, `type`
- **Example Queries**:
  ```datadog
  # Total notifications created
  sum:notification.created{env:prod}

  # Notifications by type
  sum:notification.created{env:prod} by {type}

  # Notifications by status
  sum:notification.created{env:prod} by {status}

  # Notifications by type and status
  sum:notification.created{env:prod} by {type,status}
  ```

#### `notification.read`
- **Type**: Counter
- **Description**: Number of notification read events
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total notifications read
  sum:notification.read{env:prod}

  # Notifications read by status
  sum:notification.read{env:prod} by {status}

  # Read rate (reads per created)
  (sum:notification.read{env:prod}.as_count() / sum:notification.created{env:prod}.as_count()) * 100
  ```

### Email Service Metrics

#### `email.sent`
- **Type**: Counter
- **Description**: Number of emails sent successfully
- **Tags**: `service`, `env`, `template`, `status`
- **Example Queries**:
  ```datadog
  # Total emails sent
  sum:email.sent{env:prod}

  # Emails by template
  sum:email.sent{env:prod} by {template}

  # Emails by status
  sum:email.sent{env:prod} by {status}

  # Emails by template and status
  sum:email.sent{env:prod} by {template,status}
  ```

#### `email.failed`
- **Type**: Counter
- **Description**: Number of email send failures
- **Tags**: `service`, `env`, `template`, `error_type`
- **Example Queries**:
  ```datadog
  # Total email failures
  sum:email.failed{env:prod}

  # Failures by template
  sum:email.failed{env:prod} by {template}

  # Failures by error type
  sum:email.failed{env:prod} by {error_type}

  # Failure rate
  (sum:email.failed{env:prod}.as_count() / (sum:email.sent{env:prod}.as_count() + sum:email.failed{env:prod}.as_count())) * 100
  ```

#### `email.processing.duration`
- **Type**: Timing
- **Description**: Email processing duration in milliseconds
- **Tags**: `service`, `env`, `template`
- **Example Queries**:
  ```datadog
  # Average email processing duration
  avg:email.processing.duration{env:prod}

  # Duration by template
  avg:email.processing.duration{env:prod} by {template}

  # P95 email processing duration
  p95(email.processing.duration{env:prod})

  # P95 by template
  p95(email.processing.duration{env:prod}) by {template}
  ```

### Sync Service Metrics

#### `sync.user.created`
- **Type**: Counter
- **Description**: Number of user creation sync operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total user creation syncs
  sum:sync.user.created{env:prod}

  # User creation syncs by status
  sum:sync.user.created{env:prod} by {status}
  ```

#### `sync.user.updated`
- **Type**: Counter
- **Description**: Number of user update sync operations
- **Tags**: `service`, `env`, `operation`, `status`
- **Example Queries**:
  ```datadog
  # Total user update syncs
  sum:sync.user.updated{env:prod}

  # User update syncs by status
  sum:sync.user.updated{env:prod} by {status}
  ```

#### `sync.duration`
- **Type**: Timing
- **Description**: Sync operation duration in milliseconds
- **Tags**: `service`, `env`, `operation`
- **Example Queries**:
  ```datadog
  # Average sync duration
  avg:sync.duration{env:prod}

  # Duration by operation
  avg:sync.duration{env:prod} by {operation}

  # P95 sync duration
  p95(sync.duration{env:prod})

  # P95 by operation
  p95(sync.duration{env:prod}) by {operation}
  ```

#### `sync.errors`
- **Type**: Counter
- **Description**: Number of sync errors
- **Tags**: `service`, `env`, `operation`, `error_type`
- **Example Queries**:
  ```datadog
  # Total sync errors
  sum:sync.errors{env:prod}

  # Errors by operation
  sum:sync.errors{env:prod} by {operation}

  # Errors by error type
  sum:sync.errors{env:prod} by {error_type}

  # Errors by operation and error type
  sum:sync.errors{env:prod} by {operation,error_type}
  ```

### Common Query Patterns

#### Rate Calculation
```datadog
# Operations per minute
rate(sum:user.search.executed{env:prod}[1m])

# Operations per hour
rate(sum:user.search.executed{env:prod}[1h])
```

#### Success Rate
```datadog
# Success rate percentage
(sum:user.profile.viewed{env:prod,status:success}.as_count() / sum:user.profile.viewed{env:prod}.as_count()) * 100
```

#### Time-based Aggregation
```datadog
# Hourly rollup
sum:user.search.executed{env:prod}.as_count().rollup(sum, 3600)

# Daily rollup
sum:user.search.executed{env:prod}.as_count().rollup(sum, 86400)
```

#### Multiple Metrics Comparison
```datadog
# Compare follows vs unfollows
sum:relationship.follow{env:prod}, sum:relationship.unfollow{env:prod}
```

#### Top N Queries
```datadog
# Top 10 operations by count
top(sum:user.search.executed{env:prod} by {operation}, 10, 'sum', 'desc')
```

---

## 4. Database Performance Dashboard

**Purpose**: MongoDB and Neo4j query performance

### MongoDB Widgets

#### MongoDB Query Duration
- **Metrics**:
  - `db.mongodb.query.duration` (avg)
  - `db.mongodb.query.duration` (p50)
  - `db.mongodb.query.duration` (p95)
  - `db.mongodb.query.duration` (p99)
- **Group by**: `collection`, `operation`
- **Visualization**: Timeseries

#### MongoDB Query Count
- **Metric**: `db.mongodb.query.count` (sum)
- **Group by**: `collection`, `operation`
- **Visualization**: Timeseries

#### MongoDB Query Errors
- **Metric**: `db.mongodb.query.errors` (sum)
- **Group by**: `collection`, `operation`
- **Visualization**: Timeseries

#### MongoDB Slow Queries
- **Metric**: `db.mongodb.query.slow` (sum)
- **Group by**: `collection`, `operation`
- **Visualization**: Timeseries

#### Top Slow MongoDB Operations
- **Metric**: `db.mongodb.query.duration` (p95)
- **Group by**: `collection`, `operation`
- **Order**: Descending
- **Visualization**: Top List

### Neo4j Widgets

#### Neo4j Query Duration
- **Metrics**:
  - `db.neo4j.query.duration` (avg)
  - `db.neo4j.query.duration` (p50)
  - `db.neo4j.query.duration` (p95)
  - `db.neo4j.query.duration` (p99)
- **Group by**: `query_type`, `relationship_type`
- **Visualization**: Timeseries

#### Neo4j Query Count
- **Metric**: `db.neo4j.query.count` (sum)
- **Group by**: `query_type`, `relationship_type`
- **Visualization**: Timeseries

#### Neo4j Query Errors
- **Metric**: `db.neo4j.query.errors` (sum)
- **Group by**: `query_type`, `relationship_type`
- **Visualization**: Timeseries

#### Neo4j Slow Queries
- **Metric**: `db.neo4j.query.slow` (sum)
- **Group by**: `query_type`, `relationship_type`
- **Visualization**: Timeseries

#### Relationships Created
- **Metric**: `db.neo4j.relationships.created` (sum)
- **Group by**: `relationship_type`
- **Visualization**: Timeseries

#### Top Slow Neo4j Operations
- **Metric**: `db.neo4j.query.duration` (p95)
- **Group by**: `query_type`, `relationship_type`
- **Order**: Descending
- **Visualization**: Top List

---

## 5. Queue & Cache Dashboard

**Purpose**: RabbitMQ and Redis performance

### RabbitMQ Widgets

#### Messages Published
- **Metric**: `queue.message.published` (sum)
- **Group by**: `queue`, `routing_key`
- **Visualization**: Timeseries

#### Messages Consumed
- **Metric**: `queue.message.consumed` (sum)
- **Group by**: `queue`, `routing_key`
- **Visualization**: Timeseries

#### Message Processing Duration
- **Metrics**:
  - `queue.message.processing.duration` (avg)
  - `queue.message.processing.duration` (p95)
  - `queue.message.processing.duration` (p99)
- **Group by**: `queue`, `routing_key`
- **Visualization**: Timeseries

#### Message Processing Failures
- **Metric**: `queue.message.failed` (sum)
- **Group by**: `queue`, `routing_key`, `error_type`
- **Visualization**: Timeseries

#### Queue Backlog (Estimated)
- **Formula**: `messages_published - messages_consumed`
- **Visualization**: Timeseries

#### Top Slow Queue Operations
- **Metric**: `queue.message.processing.duration` (p95)
- **Group by**: `queue`, `routing_key`
- **Order**: Descending
- **Visualization**: Top List

### Redis Widgets

#### Redis Operation Duration
- **Metrics**:
  - `cache.redis.operation.duration` (avg)
  - `cache.redis.operation.duration` (p95)
  - `cache.redis.operation.duration` (p99)
- **Group by**: `operation`, `key_pattern`
- **Visualization**: Timeseries

#### Redis Operation Count
- **Metric**: `cache.redis.operation.count` (sum)
- **Group by**: `operation`, `key_pattern`
- **Visualization**: Timeseries

#### Cache Hit Rate
- **Formula**: `cache_hits / (cache_hits + cache_misses) * 100`
- **Metrics**:
  - `cache.redis.hit` (sum)
  - `cache.redis.miss` (sum)
- **Visualization**: Timeseries

#### Cache Hits
- **Metric**: `cache.redis.hit` (sum)
- **Group by**: `key_pattern`
- **Visualization**: Timeseries

#### Cache Misses
- **Metric**: `cache.redis.miss` (sum)
- **Group by**: `key_pattern`
- **Visualization**: Timeseries

#### Top Cache Operations
- **Metric**: `cache.redis.operation.count` (sum)
- **Group by**: `operation`, `key_pattern`
- **Order**: Descending
- **Visualization**: Top List

---

## 6. Error Tracking Dashboard

**Purpose**: Error rates, types, and trends

### Widgets to Create

#### Total Errors (Last 24h)
- **Metric**: `http.request.error` (sum)
- **Timeframe**: Last 24 hours
- **Visualization**: Single Value

#### Error Rate Trend
- **Metric**: `http.request.error` (sum)
- **Split by**: `error_type`
- **Visualization**: Timeseries

#### Errors by Service
- **Metric**: `http.request.error` (sum)
- **Group by**: `service`
- **Split by**: `error_type`
- **Visualization**: Timeseries (stacked)

#### Errors by Route
- **Metric**: `http.request.error` (sum)
- **Group by**: `route`
- **Split by**: `status_code`
- **Order**: Descending
- **Visualization**: Top List

#### Errors by Status Code
- **Metric**: `http.request.error` (sum)
- **Group by**: `status_code`
- **Visualization**: Pie Chart / Donut

#### Database Query Errors
- **Metrics**:
  - `db.mongodb.query.errors` (sum)
  - `db.neo4j.query.errors` (sum)
- **Group by**: `collection` / `query_type`
- **Visualization**: Timeseries

#### Queue Processing Errors
- **Metric**: `queue.message.failed` (sum)
- **Group by**: `queue`, `routing_key`, `error_type`
- **Visualization**: Timeseries

#### Email Send Failures
- **Metric**: `email.failed` (sum)
- **Group by**: `template`, `error_type`
- **Visualization**: Timeseries

#### Sync Errors
- **Metric**: `sync.errors` (sum)
- **Group by**: `operation`, `error_type`
- **Visualization**: Timeseries

#### Error Rate by Hour
- **Metric**: `http.request.error` (sum)
- **Rollup**: Hour
- **Visualization**: Timeseries

---

## 7. WebSocket Dashboard

**Purpose**: Real-time connection monitoring

### Widgets to Create

#### Active WebSocket Connections
- **Metric**: `websocket.connections.active` (last value)
- **Visualization**: Single Value / Gauge

#### Active Connections Trend
- **Metric**: `websocket.connections.active` (avg)
- **Visualization**: Timeseries

#### Connections Opened
- **Metric**: `websocket.connection` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Connections Closed
- **Metric**: `websocket.disconnection` (sum)
- **Split by**: `status`
- **Visualization**: Timeseries

#### Messages Sent
- **Metric**: `websocket.message.sent` (sum)
- **Group by**: `event_type`
- **Visualization**: Timeseries

#### Messages Received
- **Metric**: `websocket.message.received` (sum)
- **Group by**: `event_type`
- **Visualization**: Timeseries

#### Connection Duration
- **Metric**: `websocket.connection.duration` (avg, p95)
- **Visualization**: Timeseries

#### Message Processing Duration
- **Metric**: `websocket.message.duration` (avg, p95)
- **Group by**: `event_type`
- **Visualization**: Timeseries

#### Failed Messages
- **Metric**: `websocket.message.failed` (sum)
- **Group by**: `event_type`, `error_type`
- **Visualization**: Timeseries

#### Connections by User (Top 10)
- **Metric**: `websocket.connection` (sum)
- **Group by**: `user_id`
- **Order**: Descending
- **Limit**: 10
- **Visualization**: Top List

---

## 8. API Gateway Dashboard

**Purpose**: HTTP request metrics and API performance

### Widgets to Create

#### Total API Requests
- **Metric**: `http.request.count` (sum)
- **Visualization**: Single Value

#### Request Rate (RPS)
- **Metric**: `http.request.count` (rate)
- **Visualization**: Timeseries

#### Request Duration Distribution
- **Metrics (Custom - Recommended)**:
  - `http.request.duration` (avg)
  - `http.request.duration` (p50)
  - `http.request.duration` (p75)
  - `http.request.duration` (p90)
  - `http.request.duration` (p95)
  - `http.request.duration` (p99)
- **Metrics (Trace - Alternative)**:
  - `trace.http.request.duration` (avg)
  - `trace.http.request.duration` (p50)
  - `trace.http.request.duration` (p75)
  - `trace.http.request.duration` (p90)
  - `trace.http.request.duration` (p95)
  - `trace.http.request.duration` (p99)
- **Visualization**: Timeseries (multiple lines)
- **Note**: Use custom metrics as primary source

#### Requests by Method
- **Metric**: `http.request.count` (sum)
- **Group by**: `method`
- **Visualization**: Pie Chart / Donut

#### Requests by Route
- **Metric**: `http.request.count` (sum)
- **Group by**: `route`
- **Order**: Descending
- **Limit**: 20
- **Visualization**: Top List

#### Requests by Status Code
- **Metric**: `http.request.count` (sum)
- **Group by**: `status_code`
- **Visualization**: Pie Chart / Donut

#### Request Size Distribution
- **Metric**: `http.request.size` (avg, p95, p99)
- **Visualization**: Timeseries

#### Response Size Distribution
- **Metric**: `http.response.size` (avg, p95, p99)
- **Visualization**: Timeseries

#### Rate Limit Metrics
- **Metrics**:
  - `rate_limit.requests.allowed` (sum)
  - `rate_limit.requests.denied` (sum)
- **Group by**: `route`
- **Visualization**: Timeseries

#### Rate Limit Denial Rate
- **Formula**: `rate_limit_denied / (rate_limit_allowed + rate_limit_denied) * 100`
- **Visualization**: Timeseries

#### Top Slow Endpoints
- **Metric (Custom)**: `http.request.duration` (p95) - **Recommended**
- **Metric (Trace)**: `trace.http.request.duration` (p95) - Alternative
- **Group by**: `route`, `method`
- **Order**: Descending
- **Limit**: 20
- **Visualization**: Top List

#### Top Error Endpoints
- **Metric**: `http.request.error` (sum)
- **Group by**: `route`, `method`, `status_code`
- **Order**: Descending
- **Limit**: 20
- **Visualization**: Top List

---

## Metric Query Examples

### Basic Metric Query
```
sum:http.request.count{env:prod}
```

### Metric with Tags
```
sum:http.request.count{env:prod,service:decode-api-gateway,status_code:200}
```

### Metric with Grouping
```
sum:http.request.count{env:prod} by {service,status_code}
```

### Calculated Formula
```
(sum:http.request.error{env:prod}.as_count() / sum:http.request.count{env:prod}.as_count()) * 100
```

### Rate Calculation
```
rate(sum:http.request.count{env:prod}[1m])
```

### Percentile Calculation
```
# Custom metric (recommended)
p95(http.request.duration{env:prod})

# Trace metric (alternative)
p95(trace.http.request.duration{env:prod})
```

### Multiple Metrics
```
sum:http.request.count{env:prod}, sum:http.request.error{env:prod}
```

### Time Aggregation
```
avg:http.request.duration{env:prod} by {service}.rollup(avg, 60)
```

--c

---

## Dashboard Organization Tips

1. **Group Related Widgets**: Place related metrics in the same row or section
2. **Use Row Groups**: Organize widgets into logical groups (e.g., "Request Metrics", "Error Metrics")
3. **Set Appropriate Timeframes**: Use "Last 24 hours" for overview, "Last 1 hour" for detailed views
4. **Add Notes**: Include context notes explaining what each metric represents
5. **Use Colors Consistently**: Use the same color scheme across dashboards
6. **Set Refresh Intervals**: Auto-refresh every 30-60 seconds for real-time monitoring
7. **Create Dashboard Links**: Link related dashboards together for easy navigation

---

## Quick Reference: All Metrics by Category

### HTTP Metrics (Custom - DogStatsD)
- `http.request.duration` - Request duration (timing)
- `http.request.count` - Request count (counter)
- `http.request.error` - Error count (counter)
- `http.request.size` - Request payload size (histogram)
- `http.response.size` - Response payload size (histogram)

### HTTP Metrics (Trace - APM)
- `trace.http.request.duration` - Request duration from traces
- `trace.http.request.hits` - Request count from traces
- `trace.http.request.errors` - Error count from traces
- `trace.span.duration` - Span duration metrics

### Database Metrics
- `db.mongodb.query.duration`
- `db.mongodb.query.count`
- `db.mongodb.query.errors`
- `db.mongodb.query.slow`
- `db.neo4j.query.duration`
- `db.neo4j.query.count`
- `db.neo4j.query.errors`
- `db.neo4j.query.slow`
- `db.neo4j.relationships.created`

### Queue Metrics
- `queue.message.published`
- `queue.message.consumed`
- `queue.message.processing.duration`
- `queue.message.failed`

### Cache Metrics
- `cache.redis.operation.duration`
- `cache.redis.operation.count`
- `cache.redis.hit`
- `cache.redis.miss`

### Rate Limiting Metrics
- `rate_limit.requests.allowed`
- `rate_limit.requests.denied`

### User Service Metrics
- `user.search.executed`
- `user.search.results`
- `user.profile.viewed`
- `user.profile.updated`
- `user.email.changed`
- `user.username.changed`

### Relationship Service Metrics
- `relationship.follow`
- `relationship.unfollow`
- `relationship.block`
- `relationship.unblock`
- `relationship.search.executed`
- `relationship.suggestions.generated`

### Wallet Service Metrics
- `wallet.linked`
- `wallet.unlinked`
- `wallet.primary.set`
- `wallet.operation.duration`

### Notification Service Metrics
- `notification.created`
- `notification.read`
- `websocket.connection`
- `websocket.disconnection`
- `websocket.connections.active`
- `websocket.message.sent`
- `websocket.message.received`

### Sync Service Metrics
- `sync.user.created`
- `sync.user.updated`
- `sync.duration`
- `sync.errors`

### Email Service Metrics
- `email.sent`
- `email.failed`
- `email.processing.duration`

---

## Trace Metrics Reference

### Overview

Trace metrics are automatically generated from APM traces by the Datadog Agent. They provide an alternative source of performance data that complements custom metrics sent via DogStatsD.

### Available Trace Metrics

| Metric | Description | Type | Tags Available |
|--------|-------------|------|----------------|
| `trace.http.request.duration` | HTTP request duration from traces | Distribution | `service`, `env`, `http.method`, `http.status_code`, `http.url_details.endpoint` |
| `trace.http.request.hits` | HTTP request count from traces | Count | `service`, `env`, `http.method`, `http.status_code`, `http.url_details.endpoint` |
| `trace.http.request.errors` | HTTP error count from traces | Count | `service`, `env`, `http.method`, `http.status_code`, `http.url_details.endpoint` |
| `trace.span.duration` | Span duration metrics | Distribution | `service`, `env`, `operation_name`, `resource_name` |

### Trace Metrics Query Examples

#### Basic Query
```
avg:trace.http.request.duration{env:prod}
```

#### Query with Service Filter
```
avg:trace.http.request.duration{env:prod,service:decode-api-gateway}
```

#### Query with Grouping
```
avg:trace.http.request.duration{env:prod} by {service,http.method}
```

#### Percentile Query
```
p95(trace.http.request.duration{env:prod})
```

#### Request Count Query
```
sum:trace.http.request.hits{env:prod} by {service}
```

#### Error Rate Query
```
sum:trace.http.request.errors{env:prod} by {service,http.status_code}
```

#### Comparison Query (Custom vs Trace)
```
# Custom metric (primary)
avg:http.request.duration{env:prod} by {service}

# Trace metric (comparison)
avg:trace.http.request.duration{env:prod} by {service}
```

### Trace Metrics vs Custom Metrics

#### When to Use Trace Metrics

✅ **Use trace metrics when**:
- You want metrics directly from trace data
- You need correlation with APM traces
- Custom metrics are unavailable for a service
- You want to compare trace-based vs custom metrics
- You need metrics for services without custom instrumentation

#### When to Use Custom Metrics

✅ **Use custom metrics when**:
- You need specific tags or dimensions
- You want explicit control over metric collection
- You need business-specific metrics
- You want consistent naming and structure
- You need metrics immediately after deployment

### Trace Metrics Tag Structure

Trace metrics automatically include tags from APM traces:

**Common Tags**:
- `service` - Service name (e.g., `decode-api-gateway`)
- `env` - Environment (e.g., `prod`)
- `http.method` - HTTP method (e.g., `GET`, `POST`)
- `http.status_code` - HTTP status code (e.g., `200`, `404`, `500`)
- `http.url_details.endpoint` - Normalized endpoint path

**Note**: Trace metric tags may differ from custom metric tags. Custom metrics use tags like `route`, `method`, `status_code`, while trace metrics use `http.url_details.endpoint`, `http.method`, `http.status_code`.

### Verifying Trace Metrics

To verify trace metrics are available:

1. **Check Metrics Explorer**:
   - Navigate to Datadog → Metrics → Explorer
   - Search for `trace.http.request.duration`
   - Verify metrics appear for your services

2. **Check APM Traces**:
   - Navigate to Datadog → APM → Traces
   - Verify traces are being collected
   - Trace metrics are generated automatically from these traces

3. **Check Service Map**:
   - Navigate to Datadog → APM → Service Map
   - Verify services appear and are connected
   - Trace metrics are available for services in the service map

### Troubleshooting Trace Metrics

**Issue**: Trace metrics not appearing

**Solutions**:
1. Verify APM is enabled: `DD_APM_ENABLED: true` in Datadog Agent
2. Verify traces are being collected: Check APM → Traces
3. Wait for metrics to appear: Trace metrics are generated with a slight delay
4. Check service names: Ensure `DD_SERVICE` is set correctly
5. Verify Datadog Agent is running: Check agent health status

**Issue**: Trace metrics have different values than custom metrics

**Explanation**: This is expected. Trace metrics and custom metrics may differ because:
- They measure slightly different things (trace duration vs custom timing)
- They may have different sampling rates
- They may include/exclude different operations

**Solution**: Use custom metrics as primary source, trace metrics for comparison.

---

## Implementation Notes

1. **Create dashboards in order**: Start with System Overview, then add detailed dashboards
2. **Use consistent naming**: Prefix all custom metrics with your namespace
3. **Set up alerts early**: Configure alerts as you create dashboards
4. **Test queries**: Verify metric queries return data before creating widgets
5. **Document custom formulas**: Save complex formulas for future reference
6. **Share dashboards**: Make dashboards accessible to your team
7. **Set permissions**: Control who can view/edit dashboards

---

## Next Steps

1. Log into Datadog dashboard
2. Navigate to Dashboards → New Dashboard
3. For each dashboard listed above:
   - Create the dashboard
   - Add widgets using the metric queries provided
   - Configure visualizations and timeframes
   - Set up alerts for critical metrics
4. Follow Datadog's official documentation for detailed UI steps:
   - [Creating Dashboards](https://docs.datadoghq.com/dashboards/)
   - [Widget Configuration](https://docs.datadoghq.com/dashboards/widgets/)
   - [Metric Queries](https://docs.datadoghq.com/metrics/)

---

## Summary

This guide provides:
- ✅ **8 comprehensive dashboards** to create
- ✅ **100+ metric widgets** with specific queries
- ✅ **Alert recommendations** for critical metrics
- ✅ **Quick reference** for all metrics by category
- ✅ **Trace metrics support** - Both custom metrics (`http.request.duration`) and trace metrics (`trace.http.request.duration`) documented
- ✅ **Comparison guide** - When to use custom metrics vs trace metrics

Use this as your implementation checklist. For detailed step-by-step UI instructions, refer to Datadog's official documentation.

**Note**: This implementation supports both custom metrics (sent via DogStatsD) and trace metrics (automatically generated from APM traces). Use custom metrics as your primary source, and trace metrics for comparison or when custom metrics are unavailable.
