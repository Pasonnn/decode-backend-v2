# Datadog Observability Implementation

## Executive Summary

This document outlines the comprehensive Datadog observability implementation across the Decode microservices architecture. The implementation provides **Application Performance Monitoring (APM)**, **distributed logging**, and **custom metrics** collection for all 8 microservices.

### Key Features

- **Automatic APM Tracing**: Distributed tracing across all services using `dd-trace`
- **Custom Metrics**: Business and infrastructure metrics via DogStatsD protocol
- **Log Collection**: Centralized log aggregation with trace correlation
- **Real-time Monitoring**: WebSocket, database, queue, and cache metrics

### Architecture at a Glance

```
┌─────────────────┐
│  Microservices  │
│  (8 services)   │
└────────┬────────┘
         │
         │ DogStatsD (UDP 8125)
         │ APM (TCP 8126)
         │ Logs (stdout/stderr)
         │
         ▼
┌─────────────────┐
│ Datadog Agent   │
│ (Docker)        │
└────────┬────────┘
         │
         │ HTTPS
         │
         ▼
┌─────────────────┐
│  Datadog Cloud  │
│  (us5.datadoghq.com) │
└─────────────────┘
```

---

## Architecture Overview

### Datadog Agent Setup

The Datadog Agent runs as a Docker container alongside all microservices, configured via `docker-compose.prod.yml`:

```yaml
datadog-agent:
  image: datadog/agent:latest
  container_name: datadog-agent
  env_file:
    - .env.decode-observe
  environment:
    DD_APM_ENABLED: true
    DD_APM_NON_LOCAL_TRAFFIC: true
    DD_LOGS_ENABLED: true
    DD_DOGSTATSD_NON_LOCAL_TRAFFIC: true
    DD_DOGSTATSD_PORT: 8125
  ports:
    - "8125:8125/udp"  # DogStatsD
    - "8126:8126"      # APM
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /proc/:/host/proc/:ro
    - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
```

### Service-to-Agent Communication

- **DogStatsD (UDP 8125)**: Custom metrics from `MetricsService`
- **APM (TCP 8126)**: Distributed traces from `dd-trace`
- **Logs**: Container stdout/stderr via Docker socket

---

## APM Implementation

### Initialization

All services initialize APM tracing in their `main.ts` files:

```typescript:apps/api-gateway/src/main.ts
// Datadog observability
import 'dd-trace/init';
```

### Configuration

Each service configures APM via environment variables:

```yaml
DD_SERVICE: decode-api-gateway  # Service name
DD_VERSION: 1.0.0               # Service version
DD_AGENT_HOST: datadog-agent    # Agent hostname
DD_APM_ENABLED: true             # Enable APM
DD_TRACE_ENABLED: true           # Enable tracing
DD_TRACE_SAMPLE_RATE: 1.0       # 100% sampling
DD_ENV: prod                     # Environment tag
```

### Service Naming Conventions

All services follow the pattern: `decode-{service-name}`

| Service | DD_SERVICE Value |
|---------|------------------|
| API Gateway | `decode-api-gateway` |
| Auth | `decode-auth` |
| User | `decode-user` |
| Relationship | `decode-relationship` |
| Wallet | `decode-wallet` |
| Notification | `decode-notification` |
| Email Worker | `decode-email-worker` |
| Neo4jDB Sync | `decode-neo4jdb-sync` |

### Distributed Tracing

- **Automatic trace propagation** across service boundaries
- **Span correlation** for request chains
- **Service map generation** showing service dependencies
- **Error tracking** with stack traces

### Trace Metrics Generation

When APM is enabled, the Datadog Agent automatically generates **trace metrics** from APM traces. These metrics are available alongside custom metrics and provide an alternative source of performance data.

**Available Trace Metrics**:

| Metric | Description | Type |
|--------|-------------|------|
| `trace.http.request.duration` | HTTP request duration from traces | Distribution |
| `trace.http.request.hits` | HTTP request count from traces | Count |
| `trace.http.request.errors` | HTTP error count from traces | Count |
| `trace.span.duration` | Span duration metrics | Distribution |

**Trace Metrics vs Custom Metrics**:

- **Trace Metrics**: Automatically generated from APM traces, no code changes required
- **Custom Metrics**: Explicitly sent via DogStatsD from application code
- **Recommendation**: Use custom metrics (`http.request.duration`) as primary source, trace metrics (`trace.http.request.duration`) for comparison or when custom metrics are unavailable

**Configuration**:

Trace metrics are automatically enabled when:
- `DD_APM_ENABLED: true` is set (already configured)
- APM traces are being collected
- Datadog Agent is running and receiving traces

No additional configuration is required. Trace metrics will appear in Datadog Metrics Explorer once traces are being generated.

---

## Logging Implementation

### Configuration

Logs are collected automatically from container stdout/stderr:

```yaml
DD_LOGS_ENABLED: true
DD_LOGS_INJECTION: true  # Inject trace IDs into logs
DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL: true
```

### Log Processing

- **Multi-line log handling**: Detects log entries starting with dates
- **Trace correlation**: Logs include trace IDs for correlation with APM
- **Container collection**: All container logs are collected automatically

---

## Custom Metrics Implementation

### MetricsService Architecture

The `MetricsService` is a shared service available in all microservices:

**Location**: `apps/*/src/common/datadog/metrics.service.ts`

**Example Implementation**:

```typescript
@Injectable()
export class MetricsService {
  private readonly client: StatsDClient;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('DD_AGENT_HOST') || 'localhost';
    const port = parseInt(this.configService.get<string>('DD_DOGSTATSD_PORT') || '8125', 10);

    this.client = new StatsD({
      host,
      port,
      prefix: '',
      bufferFlushInterval: 1000,
      telegraf: false,
    });
  }

  // Counter metrics
  increment(metricName: string, value: number = 1, tags?: MetricTags): void {
    this.client.increment(metricName, value, this.getDefaultTags(tags));
  }

  // Timing metrics
  timing(metricName: string, durationMs: number, tags?: MetricTags): void {
    this.client.timing(metricName, durationMs, this.getDefaultTags(tags));
  }

  // Gauge metrics
  gauge(metricName: string, value: number, tags?: MetricTags): void {
    this.client.gauge(metricName, value, this.getDefaultTags(tags));
  }

  // Histogram metrics
  histogram(metricName: string, value: number, tags?: MetricTags): void {
    this.client.histogram(metricName, value, this.getDefaultTags(tags));
  }
}
```

### Automatic Tagging

All metrics automatically include:
- `service:{serviceName}` - Service identifier
- `env:{environment}` - Environment (prod/dev)

### Metric Types

| Type | Method | Use Case |
|------|--------|----------|
| **Counter** | `increment()`, `decrement()` | Request counts, errors, events |
| **Gauge** | `gauge()` | Active connections, cache size |
| **Histogram** | `histogram()` | Response sizes, result counts |
| **Timing** | `timing()` | Query duration, operation time |
| **Distribution** | `distribution()` | Advanced analytics |

---

## Business Metrics Implementation

### User Service Metrics

**Location**: `apps/user/src/services/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `user.search.executed` | Counter | `operation`, `status` | User search operations |
| `user.search.results` | Histogram | `operation` | Number of search results |
| `user.profile.viewed` | Counter | `operation`, `status` | Profile view events |
| `user.profile.updated` | Counter | `operation`, `status` | Profile update events |
| `user.email.changed` | Counter | `operation`, `status` | Email change operations |
| `user.username.changed` | Counter | `operation`, `status` | Username change operations |

**Example**:
```typescript:apps/user/src/services/profile.service.ts
this.metricsService?.increment('user.profile.viewed', 1, {
  operation: 'getUserProfile',
  status: 'success',
});
```

### Relationship Service Metrics

**Location**: `apps/relationship/src/services/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `relationship.follow` | Counter | `operation`, `status` | Follow operations |
| `relationship.unfollow` | Counter | `operation`, `status` | Unfollow operations |
| `relationship.block` | Counter | `operation`, `status` | Block operations |
| `relationship.unblock` | Counter | `operation`, `status` | Unblock operations |
| `relationship.search.executed` | Counter | `operation`, `status` | Relationship search |
| `relationship.suggestions.generated` | Counter | `operation`, `status` | Suggestion generation |

### Wallet Service Metrics

**Location**: `apps/wallet/src/services/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `wallet.linked` | Counter | `operation`, `status` | Wallet link operations |
| `wallet.unlinked` | Counter | `operation`, `status` | Wallet unlink operations |
| `wallet.primary.set` | Counter | `operation`, `status` | Primary wallet designation |
| `wallet.operation.duration` | Timing | `operation` | Wallet operation duration |

### Notification Service Metrics

**Location**: `apps/notification/src/services/*.ts`, `apps/notification/src/gateways/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `notification.created` | Counter | `operation`, `status`, `type` | Notification creation |
| `notification.read` | Counter | `operation`, `status` | Notification read events |
| `websocket.connection` | Counter | `status`, `user_id` | WebSocket connections |
| `websocket.disconnection` | Counter | `status`, `user_id` | WebSocket disconnections |
| `websocket.connections.active` | Gauge | - | Active WebSocket connections |
| `websocket.message.sent` | Counter | `event_type`, `user_id` | WebSocket messages sent |
| `websocket.message.received` | Counter | `event_type`, `user_id` | WebSocket messages received |

### Neo4jDB Sync Service Metrics

**Location**: `apps/neo4jdb-sync/src/services/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `sync.user.created` | Counter | `operation`, `status` | User creation sync |
| `sync.user.updated` | Counter | `operation`, `status` | User update sync |
| `sync.duration` | Timing | `operation` | Sync operation duration |
| `sync.errors` | Counter | `operation`, `error_type` | Sync errors |

### Email Worker Service Metrics

**Location**: `apps/email-worker/src/services/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `email.sent` | Counter | `template`, `status` | Emails sent |
| `email.failed` | Counter | `template`, `error_type` | Email failures |
| `email.processing.duration` | Timing | `template` | Email processing time |

---

## Infrastructure Metrics

### HTTP Request Metrics

**Location**: `apps/api-gateway/src/common/interceptors/metrics.interceptor.ts`

**Example Implementation**:
```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const startTime = Date.now();
  // ... request processing ...

  return next.handle().pipe(
    tap((data) => {
      const duration = Date.now() - startTime;

      // Record request duration
      this.metricsService.timing('http.request.duration', duration, {
        method,
        route,
        status_code: statusCode.toString(),
      });

      // Record request count
      this.metricsService.increment('http.request.count', 1, {
        method,
        route,
        status_code: statusCode.toString(),
      });

      // Record errors
      if (statusCode >= 400) {
        this.metricsService.increment('http.request.error', 1, {
          method,
          route,
          status_code: statusCode.toString(),
          error_type: statusCode >= 500 ? 'server_error' : 'client_error',
        });
      }
    }),
  );
}
```

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `http.request.duration` | Timing | `method`, `route`, `status_code` | Request duration |
| `http.request.count` | Counter | `method`, `route`, `status_code` | Request count |
| `http.request.error` | Counter | `method`, `route`, `status_code`, `error_type` | Error count |
| `http.request.size` | Histogram | `method`, `route` | Request payload size |
| `http.response.size` | Histogram | `method`, `route`, `status_code` | Response payload size |

### Database Query Metrics

#### MongoDB Metrics

**Location**: `apps/user/src/services/*.ts`, `apps/auth/src/services/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `db.mongodb.query.duration` | Timing | `collection`, `operation` | Query duration |
| `db.mongodb.query.count` | Counter | `collection`, `operation` | Query count |
| `db.mongodb.query.errors` | Counter | `collection`, `operation` | Query errors |
| `db.mongodb.query.slow` | Counter | `collection`, `operation` | Slow queries (>100ms) |

**Example**:
```typescript:apps/user/src/services/profile.service.ts
const duration = Date.now() - startTime;
this.metricsService?.timing('db.mongodb.query.duration', duration, {
  collection: 'users',
  operation: 'findOne',
});
this.metricsService?.increment('db.mongodb.query.count', 1, {
  collection: 'users',
  operation: 'findOne',
});

if (duration > 100) {
  this.metricsService?.increment('db.mongodb.query.slow', 1, {
    collection: 'users',
    operation: 'findOne',
  });
}
```

#### Neo4j Metrics

**Location**: `apps/relationship/src/infrastructure/neo4j.infrastructure.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `db.neo4j.query.duration` | Timing | `query_type`, `relationship_type` | Query duration |
| `db.neo4j.query.count` | Counter | `query_type`, `relationship_type` | Query count |
| `db.neo4j.query.errors` | Counter | `query_type`, `relationship_type` | Query errors |
| `db.neo4j.query.slow` | Counter | `query_type`, `relationship_type` | Slow queries (>200ms) |
| `db.neo4j.relationships.created` | Counter | `relationship_type` | Relationship creation |

### Queue Metrics (RabbitMQ)

**Location**: `apps/email-worker/src/services/*.ts`, `apps/notification/src/infrastructure/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `queue.message.published` | Counter | `queue`, `routing_key` | Messages published |
| `queue.message.consumed` | Counter | `queue`, `routing_key` | Messages consumed |
| `queue.message.processing.duration` | Timing | `queue`, `routing_key` | Processing duration |
| `queue.message.failed` | Counter | `queue`, `routing_key`, `error_type` | Processing failures |

### Cache Metrics (Redis)

**Location**: `apps/api-gateway/src/infrastructure/cache/*.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `cache.redis.operation.duration` | Timing | `operation`, `key_pattern` | Operation duration |
| `cache.redis.operation.count` | Counter | `operation`, `key_pattern` | Operation count |
| `cache.redis.hit` | Counter | `key_pattern` | Cache hits |
| `cache.redis.miss` | Counter | `key_pattern` | Cache misses |

### Rate Limiting Metrics

**Location**: `apps/api-gateway/src/infrastructure/cache/rate-limit.service.ts`

| Metric | Type | Tags | Description |
|--------|------|------|-------------|
| `rate_limit.requests.allowed` | Counter | `route`, `user_id` | Allowed requests |
| `rate_limit.requests.denied` | Counter | `route`, `user_id` | Denied requests |

---

## Configuration Details

### Environment Variables

#### Required Variables (`.env.decode-observe`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DD_API_KEY` | Datadog API key | `bcf656a0004cdc8cf7c3f446d0ec7c2eace69c5b` |
| `DD_SITE` | Datadog site region | `us5.datadoghq.com` |
| `DD_ENV` | Environment tag | `prod` |

#### Service-Specific Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DD_SERVICE` | Service name | `decode-{service-name}` |
| `DD_VERSION` | Service version | `1.0.0` |
| `DD_AGENT_HOST` | Datadog Agent hostname | `datadog-agent` |
| `DD_APM_ENABLED` | Enable APM | `true` |
| `DD_TRACE_ENABLED` | Enable tracing | `true` |
| `DD_TRACE_SAMPLE_RATE` | Trace sampling rate | `1.0` |
| `DD_LOGS_ENABLED` | Enable log collection | `true` |
| `DD_LOGS_INJECTION` | Inject trace IDs in logs | `true` |
| `DD_DOGSTATSD_PORT` | DogStatsD port | `8125` |
| `DD_DOGSTATSD_NON_LOCAL_TRAFFIC` | Allow non-local traffic | `true` |

---

## Metric Naming Conventions

### Naming Pattern

Format: `{category}.{subcategory}.{metric_name}`

### Categories

- **`http.*`** - HTTP request metrics (custom metrics via DogStatsD)
- **`trace.*`** - Trace metrics (automatically generated from APM traces)
- **`db.mongodb.*`** - MongoDB database metrics
- **`db.neo4j.*`** - Neo4j database metrics
- **`queue.*`** - RabbitMQ queue metrics
- **`cache.redis.*`** - Redis cache metrics
- **`rate_limit.*`** - Rate limiting metrics
- **`user.*`** - User service business metrics
- **`relationship.*`** - Relationship service business metrics
- **`wallet.*`** - Wallet service business metrics
- **`notification.*`** - Notification service business metrics
- **`websocket.*`** - WebSocket connection metrics
- **`sync.*`** - Neo4jDB sync service metrics
- **`email.*`** - Email worker service metrics

### Tagging Strategy

**Required Tags**:
- `service:{serviceName}` - Automatically added by MetricsService
- `env:{environment}` - Automatically added by MetricsService

**Common Tags**:
- `operation` - Operation name (e.g., `getUserProfile`, `follow`)
- `status` - Operation status (e.g., `success`, `error`, `not_found`)
- `method` - HTTP method (e.g., `GET`, `POST`)
- `route` - Normalized route path (e.g., `/api/users/:id`)
- `status_code` - HTTP status code (e.g., `200`, `404`, `500`)
- `error_type` - Error classification (e.g., `server_error`, `client_error`)

---

## Complete Metrics List

### Trace Metrics (APM - Automatically Generated)

| Metric | Type | Source | Description |
|--------|------|--------|-------------|
| `trace.http.request.duration` | Distribution | APM Traces | HTTP request duration from traces |
| `trace.http.request.hits` | Count | APM Traces | HTTP request count from traces |
| `trace.http.request.errors` | Count | APM Traces | HTTP error count from traces |
| `trace.span.duration` | Distribution | APM Traces | Span duration metrics |

**Note**: Trace metrics are automatically generated from APM traces when `DD_APM_ENABLED: true` is set. They complement custom metrics and provide an alternative source of performance data.

### System Metrics (Infrastructure)

| Metric | Type | Service | Description |
|--------|------|---------|-------------|
| `http.request.duration` | Timing | API Gateway | HTTP request duration |
| `http.request.count` | Counter | API Gateway | HTTP request count |
| `http.request.error` | Counter | API Gateway | HTTP error count |
| `http.request.size` | Histogram | API Gateway | Request payload size |
| `http.response.size` | Histogram | API Gateway | Response payload size |
| `db.mongodb.query.duration` | Timing | All | MongoDB query duration |
| `db.mongodb.query.count` | Counter | All | MongoDB query count |
| `db.mongodb.query.errors` | Counter | All | MongoDB query errors |
| `db.mongodb.query.slow` | Counter | All | MongoDB slow queries |
| `db.neo4j.query.duration` | Timing | Relationship | Neo4j query duration |
| `db.neo4j.query.count` | Counter | Relationship | Neo4j query count |
| `db.neo4j.query.errors` | Counter | Relationship | Neo4j query errors |
| `db.neo4j.query.slow` | Counter | Relationship | Neo4j slow queries |
| `db.neo4j.relationships.created` | Counter | Relationship | Neo4j relationships created |
| `queue.message.published` | Counter | Email Worker | Messages published |
| `queue.message.consumed` | Counter | All | Messages consumed |
| `queue.message.processing.duration` | Timing | All | Message processing duration |
| `queue.message.failed` | Counter | All | Message processing failures |
| `cache.redis.operation.duration` | Timing | API Gateway | Redis operation duration |
| `cache.redis.operation.count` | Counter | API Gateway | Redis operation count |
| `cache.redis.hit` | Counter | API Gateway | Cache hits |
| `cache.redis.miss` | Counter | API Gateway | Cache misses |
| `rate_limit.requests.allowed` | Counter | API Gateway | Rate limit allowed |
| `rate_limit.requests.denied` | Counter | API Gateway | Rate limit denied |

### Business Metrics

| Metric | Type | Service | Description |
|--------|------|---------|-------------|
| `user.search.executed` | Counter | User | User search operations |
| `user.search.results` | Histogram | User | Search result count |
| `user.profile.viewed` | Counter | User | Profile views |
| `user.profile.updated` | Counter | User | Profile updates |
| `user.email.changed` | Counter | User | Email changes |
| `user.username.changed` | Counter | User | Username changes |
| `relationship.follow` | Counter | Relationship | Follow operations |
| `relationship.unfollow` | Counter | Relationship | Unfollow operations |
| `relationship.block` | Counter | Relationship | Block operations |
| `relationship.unblock` | Counter | Relationship | Unblock operations |
| `relationship.search.executed` | Counter | Relationship | Relationship searches |
| `relationship.suggestions.generated` | Counter | Relationship | Suggestion generation |
| `wallet.linked` | Counter | Wallet | Wallet link operations |
| `wallet.unlinked` | Counter | Wallet | Wallet unlink operations |
| `wallet.primary.set` | Counter | Wallet | Primary wallet designation |
| `wallet.operation.duration` | Timing | Wallet | Wallet operation duration |
| `notification.created` | Counter | Notification | Notification creation |
| `notification.read` | Counter | Notification | Notification read events |
| `websocket.connection` | Counter | Notification | WebSocket connections |
| `websocket.disconnection` | Counter | Notification | WebSocket disconnections |
| `websocket.connections.active` | Gauge | Notification | Active WebSocket connections |
| `websocket.message.sent` | Counter | Notification | WebSocket messages sent |
| `websocket.message.received` | Counter | Notification | WebSocket messages received |
| `sync.user.created` | Counter | Neo4jDB Sync | User creation sync |
| `sync.user.updated` | Counter | Neo4jDB Sync | User update sync |
| `sync.duration` | Timing | Neo4jDB Sync | Sync operation duration |
| `sync.errors` | Counter | Neo4jDB Sync | Sync errors |
| `email.sent` | Counter | Email Worker | Emails sent |
| `email.failed` | Counter | Email Worker | Email failures |
| `email.processing.duration` | Timing | Email Worker | Email processing duration |

---

## Integration Points

### Service Initialization Flow

1. **Service starts** → `main.ts` imports `dd-trace/init`
2. **APM initialized** → Traces automatically collected
3. **MetricsService created** → DogStatsD client connects to agent
4. **Metrics sent** → Custom metrics flow to Datadog Agent
5. **Logs collected** → Container logs forwarded to agent

### Data Flow

```
Service Code
    │
    ├─→ dd-trace → APM Traces → Datadog Agent → Datadog Cloud
    │
    ├─→ MetricsService → DogStatsD → Datadog Agent → Datadog Cloud
    │
    └─→ stdout/stderr → Docker Logs → Datadog Agent → Datadog Cloud
```

---

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Datadog**
   - Verify `DD_AGENT_HOST` is set to `datadog-agent`
   - Check DogStatsD port `8125` is accessible
   - Ensure `.env.decode-observe` contains valid `DD_API_KEY`

2. **APM traces missing**
   - Verify `DD_APM_ENABLED=true` and `DD_TRACE_ENABLED=true`
   - Check APM port `8126` is accessible
   - Ensure `dd-trace/init` is imported in `main.ts`

3. **Logs not collected**
   - Verify `DD_LOGS_ENABLED=true`
   - Check Docker socket is mounted: `/var/run/docker.sock`
   - Ensure `DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true`

---

## Summary

This implementation provides comprehensive observability across all microservices:

- ✅ **8 services** instrumented with APM
- ✅ **50+ custom metrics** tracking business and infrastructure
- ✅ **Centralized logging** with trace correlation
- ✅ **Real-time monitoring** for WebSocket, databases, queues, and caches
- ✅ **Automatic tagging** for service and environment identification

All metrics follow consistent naming conventions and include automatic service and environment tags for easy filtering and analysis in Datadog dashboards.
