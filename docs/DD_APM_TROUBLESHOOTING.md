# Datadog APM Troubleshooting Guide

## Issue: Only 4 Services Appearing in APM

**Expected**: 7 services (excluding email-worker)
**Currently Showing**: 4 services (decode-auth, decode-relationship, decode-wallet, decode-notification)
**Missing**: decode-api-gateway, decode-user, decode-neo4jdb-sync

---

## Why Services Don't Appear in APM

APM only shows services that have **generated traces**. A service won't appear if:
1. It hasn't received any traffic/requests
2. It can't connect to the Datadog agent
3. `dd-trace` isn't properly initialized
4. Environment variables are incorrect
5. The service is a RabbitMQ microservice (needs special configuration)

---

## Diagnostic Steps

### 1. Verify Services Are Running

```bash
# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}" | grep decode

# Expected output should show all 7 services:
# decode-api-gateway
# decode-auth
# decode-user
# decode-relationship
# decode-wallet
# decode-notification
# decode-neo4jdb-sync
```

### 2. Verify Services Can Reach Datadog Agent

```bash
# Test connectivity from each service container
docker exec decode-api-gateway nc -zv datadog-agent 8126
docker exec decode-user nc -zv datadog-agent 8126
docker exec decode-neo4jdb-sync nc -zv datadog-agent 8126

# If nc is not available, use telnet or curl
docker exec decode-api-gateway sh -c "echo > /dev/tcp/datadog-agent/8126" && echo "Connected" || echo "Failed"
```

### 3. Check Environment Variables

```bash
# Verify DD_SERVICE and DD_AGENT_HOST for each service
docker exec decode-api-gateway env | grep DD_
docker exec decode-user env | grep DD_
docker exec decode-neo4jdb-sync env | grep DD_

# Expected output should include:
# DD_SERVICE=decode-api-gateway (or decode-user, decode-neo4jdb-sync)
# DD_AGENT_HOST=datadog-agent
# DD_APM_ENABLED=true
# DD_TRACE_ENABLED=true
```

### 4. Check Service Logs for dd-trace Errors

```bash
# Check for dd-trace initialization errors
docker logs decode-api-gateway 2>&1 | grep -i "dd-trace\|trace\|apm"
docker logs decode-user 2>&1 | grep -i "dd-trace\|trace\|apm"
docker logs decode-neo4jdb-sync 2>&1 | grep -i "dd-trace\|trace\|apm"
```

### 5. Verify Services Are Receiving Traffic

**For HTTP Services (api-gateway, user):**
- Services need to receive HTTP requests to generate traces
- Check if services are being called by other services
- Make test requests to generate traces

**For RabbitMQ Microservice (neo4jdb-sync):**
- RabbitMQ microservices need special configuration to generate traces
- Check if messages are being processed
- Verify RabbitMQ instrumentation is enabled

---

## Solutions

### Solution 1: Generate Traffic for HTTP Services

**For decode-api-gateway:**
```bash
# Make a test request to generate traces
curl http://localhost:4000/health

# Or make a real API call
curl -X GET http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**For decode-user:**
```bash
# User service is internal, so it needs to be called via API Gateway
# Make a request that triggers user service
curl -X GET http://localhost:4000/api/users/search?q=test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Solution 2: Enable RabbitMQ Tracing for Neo4jDB Sync

The `neo4jdb-sync` service is a RabbitMQ microservice. By default, `dd-trace` doesn't automatically instrument RabbitMQ message handlers. You need to manually instrument it.

**Update `apps/neo4jdb-sync/src/main.ts`:**

```typescript
// Datadog observability - MUST be imported FIRST
import 'dd-trace/init';

// ... rest of imports ...

async function bootstrap() {
  // Create the NestJS microservice instance with RabbitMQ transport
  const app = await NestFactory.createMicroservice(Neo4jDbSyncModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
      queue: 'neo4j_sync_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start the microservice
  await app.listen();

  console.log(
    `Neo4j Database Sync Microservice is listening on neo4j_sync_queue`,
  );
}
```

**Then instrument the message handlers in your controller/service:**

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import tracer from 'dd-trace';

@Controller()
export class Neo4jDbSyncController {
  @MessagePattern('create_user_request')
  async handleCreateUser(@Payload() data: any) {
    // Wrap the handler in a trace span
    return tracer.trace('neo4jdb-sync.create_user', async (span) => {
      span.setTag('service', 'decode-neo4jdb-sync');
      span.setTag('operation', 'create_user');

      // Your existing handler logic here
      // ...
    });
  }

  @MessagePattern('update_user_request')
  async handleUpdateUser(@Payload() data: any) {
    return tracer.trace('neo4jdb-sync.update_user', async (span) => {
      span.setTag('service', 'decode-neo4jdb-sync');
      span.setTag('operation', 'update_user');

      // Your existing handler logic here
      // ...
    });
  }
}
```

### Solution 3: Verify dd-trace Import Order

**CRITICAL**: `dd-trace/init` must be imported **BEFORE** any other imports.

**Correct order:**
```typescript
// ✅ CORRECT - dd-trace first
import 'dd-trace/init';
import { NestFactory } from '@nestjs/core';
// ... other imports
```

**Incorrect order:**
```typescript
// ❌ WRONG - other imports first
import { NestFactory } from '@nestjs/core';
import 'dd-trace/init';  // Too late!
```

### Solution 4: Check Network Connectivity

Ensure all services are on the same Docker network:

```bash
# Verify all services are on decode-network
docker network inspect decode-backend-v2_decode-network | grep -A 5 "Containers"

# If a service is missing, restart it
docker compose -f docker-compose.prod.yml up -d decode-api-gateway
docker compose -f docker-compose.prod.yml up -d decode-user
docker compose -f docker-compose.prod.yml up -d decode-neo4jdb-sync
```

### Solution 5: Force Trace Generation

Add a startup trace to verify connectivity:

**Add to each service's `main.ts` after bootstrap:**

```typescript
import tracer from 'dd-trace';

async function bootstrap() {
  // ... existing bootstrap code ...

  // Force a trace to verify APM connectivity
  tracer.trace('service.startup', (span) => {
    span.setTag('service', process.env.DD_SERVICE || 'unknown');
    span.setTag('env', process.env.DD_ENV || 'production');
    console.log(`Service ${process.env.DD_SERVICE} started with APM enabled`);
  });
}
```

---

## Quick Fix Checklist

- [ ] All 7 containers are running (`docker ps`)
- [ ] All services have `DD_SERVICE` set correctly
- [ ] All services have `DD_AGENT_HOST=datadog-agent`
- [ ] All services have `DD_APM_ENABLED=true` and `DD_TRACE_ENABLED=true`
- [ ] `dd-trace/init` is imported FIRST in all `main.ts` files
- [ ] Services can reach `datadog-agent:8126` (APM port)
- [ ] HTTP services have received at least one request
- [ ] RabbitMQ microservice has manual tracing instrumentation
- [ ] All services are on the same Docker network

---

## Expected Behavior After Fix

Once fixed, you should see all 7 services in Datadog APM:

1. **decode-api-gateway** - Appears after receiving HTTP requests
2. **decode-auth** - ✅ Already showing
3. **decode-user** - Appears after being called via API Gateway
4. **decode-relationship** - ✅ Already showing
5. **decode-wallet** - ✅ Already showing
6. **decode-notification** - ✅ Already showing
7. **decode-neo4jdb-sync** - Appears after processing RabbitMQ messages (with manual instrumentation)

---

## Verification

After applying fixes, verify in Datadog:

1. Go to **APM > Services**
2. Filter by `env:prod`
3. You should see all 7 services listed
4. Each service should show traces if it has received traffic

---

## Common Issues

### Issue: Service appears but has no traces
**Cause**: Service is running but hasn't received any requests
**Solution**: Generate traffic to the service

### Issue: Service doesn't appear at all
**Cause**: Service can't connect to Datadog agent or dd-trace not initialized
**Solution**: Check network connectivity and import order

### Issue: RabbitMQ microservice doesn't appear
**Cause**: RabbitMQ handlers aren't instrumented
**Solution**: Add manual tracing instrumentation (see Solution 2)

---

## Next Steps

1. Run diagnostic steps above
2. Apply appropriate solutions
3. Generate traffic to missing services
4. Verify all services appear in Datadog APM
5. Check service map shows all connections
