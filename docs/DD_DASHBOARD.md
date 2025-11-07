# Datadog Dashboard Setup Guide

## Overview

This guide outlines all dashboards and metrics to create in Datadog for comprehensive system, service, and business monitoring. Use this as a reference for what to track, then follow Datadog's official documentation for UI implementation steps.

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
- **Metric**: `http.request.duration` (p95)
- **Group by**: `service`
- **Visualization**: Timeseries

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
- **Metrics**:
  - `http.request.duration` (avg)
  - `http.request.duration` (p50)
  - `http.request.duration` (p95)
  - `http.request.duration` (p99)
- **Group by**: `service`
- **Visualization**: Timeseries (multiple lines)

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
- **Metric**: `http.request.duration` (p95)
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
- **Metrics**:
  - `http.request.duration` (avg)
  - `http.request.duration` (p50)
  - `http.request.duration` (p75)
  - `http.request.duration` (p90)
  - `http.request.duration` (p95)
  - `http.request.duration` (p99)
- **Visualization**: Timeseries (multiple lines)

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
- **Metric**: `http.request.duration` (p95)
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
p95(http.request.duration{env:prod})
```

### Multiple Metrics
```
sum:http.request.count{env:prod}, sum:http.request.error{env:prod}
```

### Time Aggregation
```
avg:http.request.duration{env:prod} by {service}.rollup(avg, 60)
```

---

## Alert Recommendations

### Critical Alerts

1. **High Error Rate**
   - Metric: `http.request.error` rate
   - Threshold: > 5% of total requests
   - Notification: PagerDuty / Slack

2. **Service Down**
   - Metric: `http.request.count` by service
   - Threshold: 0 requests for 5 minutes
   - Notification: PagerDuty

3. **High Response Time**
   - Metric: `http.request.duration` p95
   - Threshold: > 2000ms
   - Notification: Slack

4. **Database Slow Queries**
   - Metric: `db.mongodb.query.slow` or `db.neo4j.query.slow`
   - Threshold: > 10 per minute
   - Notification: Slack

5. **Queue Backlog**
   - Formula: `queue.message.published - queue.message.consumed`
   - Threshold: > 1000 messages
   - Notification: Slack

6. **Cache Hit Rate Low**
   - Formula: `cache_hits / (cache_hits + cache_misses)`
   - Threshold: < 80%
   - Notification: Slack

7. **WebSocket Connection Failures**
   - Metric: `websocket.connection` with `status:error`
   - Threshold: > 10 per minute
   - Notification: Slack

8. **Email Send Failures**
   - Metric: `email.failed`
   - Threshold: > 5 per minute
   - Notification: Slack

### Warning Alerts

1. **Elevated Error Rate**
   - Metric: `http.request.error` rate
   - Threshold: > 2% of total requests
   - Notification: Slack

2. **Slow Response Time**
   - Metric: `http.request.duration` p95
   - Threshold: > 1000ms
   - Notification: Slack

3. **High Memory Usage**
   - Metric: `system.mem.used`
   - Threshold: > 80%
   - Notification: Slack

4. **High CPU Usage**
   - Metric: `system.cpu.user`
   - Threshold: > 80%
   - Notification: Slack

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

### HTTP Metrics
- `http.request.duration`
- `http.request.count`
- `http.request.error`
- `http.request.size`
- `http.response.size`

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

Use this as your implementation checklist. For detailed step-by-step UI instructions, refer to Datadog's official documentation.
