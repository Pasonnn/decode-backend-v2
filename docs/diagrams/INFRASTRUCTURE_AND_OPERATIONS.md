# Infrastructure and Operations Flow Diagrams

This document provides detailed step-by-step instructions for drawing infrastructure, security, deployment, and operational flow diagrams for the Decode Network Backend system.

---

## 1. Database Architecture Diagram

**Purpose**: Shows the data storage architecture and data models across MongoDB, Neo4j, and Redis.

**Diagram Types Recommended**:
- **Entity Relationship Diagram (ERD)** for MongoDB collections
- **Graph Database Schema Diagram** for Neo4j
- **Data Structure Diagram** for Redis
- **Combined Architecture Diagram** showing all three databases

---

### Actors/Components to Include:

1. **MongoDB** (Port 27017)
   - Database: `decode_db`
   - Collections: `users`, `sessions`, `device_fingerprints`, `otps`, `otp_codes`, `wallets`, `notifications`, `follower_snapshots`
2. **Neo4j** (Port 7687)
   - Graph database
   - Nodes: `User`, `Interest`
   - Relationships: `FOLLOWING`, `BLOCKED`, `INTERESTS`
3. **Redis** (Port 6379)
   - Data structures: Strings, Sets, Sorted Sets, Hashes
   - Namespaces: Sessions, Cache, Rate Limits, WebSocket Connections, SSO Tokens, Verification Codes

---

### MongoDB Collections to Document:

#### Collection 1: `users`
- **Fields**: `_id`, `username`, `email`, `password_hashed`, `display_name`, `bio`, `avatar_ipfs_hash`, `role`, `last_login`, `is_active`, `createdAt`, `updatedAt`
- **Indexes**: Unique on `email`, Unique on `username`, Index on `createdAt`
- **Relationships**: Referenced by `sessions`, `device_fingerprints`, `otps`, `wallets`, `notifications`, `follower_snapshots`

#### Collection 2: `sessions`
- **Fields**: `_id`, `user_id` (ref: User), `device_fingerprint_id` (ref: DeviceFingerprint), `session_token`, `app`, `expires_at`, `is_active`, `revoked_at`, `last_used_at`, `createdAt`, `updatedAt`
- **Indexes**: Index on `user_id`, Unique on `session_token`, TTL index on `expires_at`
- **Relationships**: References `User`, `DeviceFingerprint`

#### Collection 3: `device_fingerprints`
- **Fields**: `_id`, `user_id` (ref: User), `device`, `browser`, `fingerprint_hashed`, `is_trusted`, `createdAt`, `updatedAt`
- **Indexes**: Index on `user_id`, Index on `fingerprint_hashed`
- **Relationships**: References `User`, Referenced by `sessions`

#### Collection 4: `otps`
- **Fields**: `_id`, `user_id` (ref: User), `otp_secret`, `otp_enable`, `createdAt`, `updatedAt`
- **Indexes**: Index on `user_id`
- **Relationships**: References `User`

#### Collection 5: `otp_codes`
- **Fields**: `userId` (ref: User), `code`, `type`, `createdAt`, `expiresAt`
- **Indexes**: Index on `userId`, Index on `code`, TTL index on `expiresAt`
- **Relationships**: References `User`

#### Collection 6: `wallets`
- **Fields**: `_id`, `address`, `user_id` (ref: User), `name_service`, `is_primary`, `createdAt`, `updatedAt`
- **Indexes**: Unique on `address`, Index on `user_id`
- **Relationships**: References `User`

#### Collection 7: `notifications`
- **Fields**: `_id`, `user_id` (ref: User), `type`, `title`, `message`, `delivered`, `delivered_at`, `read`, `read_at`, `createdAt`, `updatedAt`
- **Indexes**: Index on `user_id`, Index on `createdAt`, Index on `type`
- **Relationships**: References `User`

#### Collection 8: `follower_snapshots`
- **Fields**: `_id`, `user_id` (ref: User), `followers` (array of User IDs), `followers_number`, `snapshot_at`, `createdAt`, `updatedAt`
- **Indexes**: Index on `user_id`, Index on `snapshot_at`
- **Relationships**: References `User` (multiple)

---

### Neo4j Graph Schema to Document:

#### Node Type 1: `User`
- **Properties**: `user_id`, `username`, `email`, `display_name`, `bio`, `avatar_ipfs_hash`, `role`, `is_active`, `followers_number`, `following_number`, `created_at`, `updated_at`
- **Indexes**: Index on `user_id`
- **Purpose**: Represents users in social graph

#### Node Type 2: `Interest`
- **Properties**: `key` (unique interest identifier)
- **Indexes**: Index on `key`
- **Purpose**: Represents interest topics

#### Relationship Type 1: `FOLLOWING`
- **Direction**: Directed (User A → FOLLOWING → User B)
- **Properties**: `created_at`
- **Purpose**: Represents follow relationships

#### Relationship Type 2: `BLOCKED`
- **Direction**: Directed (User A → BLOCKED → User B)
- **Properties**: `created_at`
- **Purpose**: Represents blocking relationships

#### Relationship Type 3: `INTERESTS`
- **Direction**: Directed (User → INTERESTS → Interest)
- **Properties**: `timestamp`
- **Purpose**: Represents user interests

---

### Redis Data Structures to Document:

#### Namespace 1: Session Cache
- **Key Pattern**: `session:{session_token}`
- **Data Type**: String (JSON)
- **TTL**: 1 hour (3600 seconds)
- **Purpose**: Fast session lookup

#### Namespace 2: User Profile Cache
- **Key Pattern**: `user:{user_id}`
- **Data Type**: String (JSON)
- **TTL**: 30 minutes (1800 seconds)
- **Purpose**: Cached user profile data

#### Namespace 3: Rate Limiting
- **Key Pattern**: `rate_limit:user:{user_id}` or `rate_limit:ip:{ip_address}`
- **Data Type**: Sorted Set or String (counter)
- **TTL**: 1 minute (60 seconds) - window duration
- **Purpose**: Track request counts per user/IP

#### Namespace 4: WebSocket Connections
- **Key Pattern**: `user_sockets:{user_id}`
- **Data Type**: Set (socket IDs)
- **TTL**: 24 hours (86400 seconds)
- **Purpose**: Track active WebSocket connections per user

#### Namespace 5: SSO Tokens
- **Key Pattern**: `sso:{sso_token}`
- **Data Type**: String (JSON)
- **TTL**: 60 seconds
- **Purpose**: Temporary SSO token storage

#### Namespace 6: Verification Codes
- **Key Patterns**:
  - `register_info:{email}`
  - `change_password_verification_code:{code}`
  - `email_change_verification:{code}`
  - `new_email_change:{code}`
- **Data Type**: String (JSON)
- **TTL**: 5 minutes (300 seconds)
- **Purpose**: Temporary verification code storage

#### Namespace 7: Suggestion Cache
- **Key Pattern**: `suggestions:{user_id}`
- **Data Type**: Set (user IDs)
- **TTL**: Configurable
- **Purpose**: Track suggested users to prevent duplicates

#### Namespace 8: Interest Suggestions Cache
- **Key Pattern**: `interest_suggestions:{user_id}`
- **Data Type**: Set (user IDs)
- **TTL**: Configurable
- **Purpose**: Track interest-based suggestions

---

### Data Flow Relationships:

1. **MongoDB → Neo4j Sync**:
   - User data synced from MongoDB `users` collection to Neo4j `User` nodes
   - Triggered via RabbitMQ `neo4j_sync_queue`
   - Fields mapped: `_id` → `user_id`, `username`, `role`, `display_name`, `avatar_ipfs_hash`

2. **MongoDB → Redis Cache**:
   - User profiles cached in Redis after fetch
   - Session data cached for fast lookup
   - Cache invalidation on updates

3. **Neo4j → MongoDB Snapshots**:
   - Follower counts synced to MongoDB `follower_snapshots` collection
   - Used for analytics and historical tracking

---

### Diagram Annotations:

- Show MongoDB collections as rectangles with field lists
- Show Neo4j nodes as circles with properties
- Show Neo4j relationships as directed arrows with labels
- Show Redis namespaces as boxes with key patterns
- Include indexes and TTL information
- Show data flow arrows between databases
- Include cardinality indicators (1:1, 1:N, N:M)

---

## 2. Message Queue Architecture Diagram

**Purpose**: Shows RabbitMQ exchanges, queues, message routing, and consumer patterns.

**Diagram Types Recommended**:
- **Queue Topology Diagram** showing queues and bindings
- **Message Flow Diagram** showing producer → queue → consumer flows
- **Exchange and Routing Diagram** (if using exchanges)

---

### Actors/Components to Include:

1. **RabbitMQ Broker** (Port 5672)
   - Management UI: Port 15672
   - Virtual Host: `/` (default)
2. **Producers** (Services that publish messages):
   - Auth Service
   - User Service
   - Relationship Service
   - API Gateway
3. **Consumers** (Services that consume messages):
   - Email Worker Service
   - Notification Service
   - Neo4j Sync Service
4. **Queues**:
   - `email_queue`
   - `notification_queue`
   - `neo4j_sync_queue`
5. **Message Patterns**:
   - `email_request`
   - `create_notification`
   - `create_user_request`
   - `update_user_request`

---

### Queue Details:

#### Queue 1: `email_queue`
- **Purpose**: Asynchronous email processing
- **Durability**: Durable (persists across broker restarts)
- **Message Pattern**: `email_request`
- **Producer Services**: Auth Service, User Service
- **Consumer Service**: Email Worker Service (Port 4003)
- **Message Types**:
  - `create-account`: Registration email verification
  - `welcome-message`: Welcome email
  - `fingerprint-verify`: Device verification
  - `forgot-password-verify`: Password reset
  - `email-change-verify`: Email change verification
  - `new-email-change-verify`: New email verification
  - `username-change-verify`: Username change verification
- **Message Structure**:
  ```json
  {
    "type": "create-account",
    "data": {
      "email": "user@example.com",
      "otpCode": "ABC123"
    }
  }
  ```
- **Retry Logic**: Configurable (max 3 retries)
- **Dead Letter Queue**: Optional DLQ for failed messages

#### Queue 2: `notification_queue`
- **Purpose**: Notification creation and delivery
- **Durability**: Durable
- **Message Pattern**: `create_notification`
- **Producer Services**: Auth Service, Relationship Service
- **Consumer Service**: Notification Service (Port 4006)
- **Message Structure**:
  ```json
  {
    "user_id": "user123",
    "type": "follow",
    "title": "New Follower",
    "message": "User A started following you"
  }
  ```
- **Processing Flow**: Message → MongoDB storage → WebSocket push

#### Queue 3: `neo4j_sync_queue`
- **Purpose**: MongoDB to Neo4j data synchronization
- **Durability**: Durable
- **Message Patterns**: `create_user_request`, `update_user_request`
- **Producer Services**: User Service, API Gateway
- **Consumer Service**: Neo4j Sync Service (Port 4007)
- **Message Structure** (create):
  ```json
  {
    "_id": "user123",
    "username": "johndoe",
    "email": "user@example.com",
    "role": "user",
    "display_name": "John Doe",
    "avatar_ipfs_hash": "Qm..."
  }
  ```
- **Processing Flow**: Message → Neo4j Cypher query → Node creation/update

---

### Message Flow Patterns:

#### Pattern 1: Email Request Flow
```
Auth Service
    ↓ (emit 'email_request')
RabbitMQ (email_queue)
    ↓ (consume)
Email Worker Service
    ↓ (process)
SMTP Server
```

#### Pattern 2: Notification Flow
```
Relationship Service
    ↓ (emit 'create_notification')
RabbitMQ (notification_queue)
    ↓ (consume)
Notification Service
    ↓ (store + push)
MongoDB + WebSocket Clients
```

#### Pattern 3: Neo4j Sync Flow
```
User Service / API Gateway
    ↓ (emit 'create_user_request' or 'update_user_request')
RabbitMQ (neo4j_sync_queue)
    ↓ (consume)
Neo4j Sync Service
    ↓ (execute Cypher)
Neo4j Database
```

---

### Queue Configuration Details:

- **Durability**: All queues are durable (`durable: true`)
- **Message Acknowledgment**: Automatic acknowledgment (ack on success)
- **Prefetch Count**: Default (1 message per consumer at a time)
- **Message TTL**: Not configured (messages don't expire)
- **Queue TTL**: Not configured (queues persist)
- **Dead Letter Exchange**: Optional (for failed messages)

---

### Error Handling:

1. **Consumer Failure**: Message remains in queue, retried
2. **Max Retries Exceeded**: Message sent to DLQ (if configured)
3. **Queue Full**: Backpressure (messages wait in queue)
4. **Broker Failure**: Durable queues persist, messages preserved

---

### Diagram Annotations:

- Show RabbitMQ broker as central component
- Show queues as boxes with queue names
- Show producers as services with arrows to queues
- Show consumers as services with arrows from queues
- Include message pattern labels
- Show durability indicators
- Include retry and DLQ paths
- Show message structure examples

---

## 3. Caching Strategy Diagram

**Purpose**: Illustrates Redis caching patterns, cache invalidation strategies, and cache warming.

**Diagram Types Recommended**:
- **Cache Layer Diagram** showing cache hierarchy
- **Cache Invalidation Flow** showing trigger points
- **Cache Hit/Miss Flow** showing decision logic

---

### Actors/Components to Include:

1. **Redis** (Port 6379)
   - Single instance (no cluster)
   - Persistence: Optional (RDB snapshots)
2. **Cache Consumers**:
   - API Gateway
   - Notification Service
   - All microservices
3. **Cache Layers**:
   - Session Cache
   - Profile Cache
   - Recommendation Cache
   - Rate Limit Buckets
   - WebSocket Connection Tracking

---

### Cache Layers:

#### Layer 1: Session Cache
- **Key Pattern**: `session:{session_token}`
- **Data Type**: String (JSON)
- **TTL**: 1 hour (3600 seconds)
- **Purpose**: Fast session validation
- **Invalidation Triggers**:
  - Session revoked
  - Session expired
  - User logout
- **Cache Hit Flow**:
  ```
  Request → Check Redis → Cache Hit → Return Session Data
  ```
- **Cache Miss Flow**:
  ```
  Request → Check Redis → Cache Miss → Query MongoDB → Store in Cache → Return Data
  ```

#### Layer 2: Profile Cache
- **Key Pattern**: `user:{user_id}`
- **Data Type**: String (JSON)
- **TTL**: 30 minutes (1800 seconds)
- **Purpose**: Cached user profile data
- **Invalidation Triggers**:
  - Profile update (display_name, bio, avatar)
  - Email change
  - Username change
  - Account deactivation
- **Cache Warming**: On profile fetch, cache is populated

#### Layer 3: Recommendation Cache
- **Key Pattern**: `suggestions:{user_id}`
- **Data Type**: Set (user IDs)
- **TTL**: Configurable (default: 1 hour)
- **Purpose**: Track suggested users to prevent duplicates
- **Invalidation Triggers**:
  - User follows suggested user
  - Cache TTL expires
  - Manual cache clear

#### Layer 4: Rate Limit Buckets
- **Key Pattern**: `rate_limit:user:{user_id}` or `rate_limit:ip:{ip_address}`
- **Data Type**: Sorted Set or String (counter)
- **TTL**: 1 minute (60 seconds) - sliding window
- **Purpose**: Track request counts per time window
- **Algorithm**: Sliding window or token bucket
- **Invalidation**: Automatic TTL expiration

#### Layer 5: WebSocket Connection Tracking
- **Key Pattern**: `user_sockets:{user_id}`
- **Data Type**: Set (socket IDs)
- **TTL**: 24 hours (86400 seconds)
- **Purpose**: Track active WebSocket connections
- **Invalidation Triggers**:
  - User disconnects
  - Socket cleanup
  - TTL expiration

#### Layer 6: Verification Code Cache
- **Key Patterns**:
  - `register_info:{email}` (TTL: 1 hour)
  - `change_password_verification_code:{code}` (TTL: 5 minutes)
  - `email_change_verification:{code}` (TTL: 5 minutes)
  - `new_email_change:{code}` (TTL: 5 minutes)
- **Data Type**: String (JSON)
- **Purpose**: Temporary verification code storage
- **Invalidation Triggers**:
  - Code verified (one-time use)
  - TTL expiration
  - Manual deletion after use

---

### Cache Invalidation Strategies:

#### Strategy 1: Time-Based Expiration (TTL)
- **When Used**: All cache layers
- **Mechanism**: Redis TTL automatically expires keys
- **Advantage**: Automatic cleanup, no manual intervention
- **Disadvantage**: Stale data possible until expiration

#### Strategy 2: Event-Based Invalidation
- **When Used**: Profile cache, session cache
- **Mechanism**: Delete cache key on data update event
- **Triggers**:
  - User profile update → Delete `user:{user_id}`
  - Session revoked → Delete `session:{session_token}`
  - Email changed → Delete `user:{user_id}`
- **Advantage**: Immediate consistency
- **Disadvantage**: Requires event handling

#### Strategy 3: Write-Through Cache
- **When Used**: Session cache (optional)
- **Mechanism**: Write to both cache and database simultaneously
- **Advantage**: Cache always up-to-date
- **Disadvantage**: Slower writes

#### Strategy 4: Cache-Aside Pattern
- **When Used**: Profile cache, recommendation cache
- **Mechanism**:
  1. Check cache
  2. If miss, fetch from database
  3. Store in cache
  4. Return data
- **Advantage**: Simple, flexible
- **Disadvantage**: Cache miss penalty

---

### Cache Warming Strategies:

#### Strategy 1: On-Demand Warming
- **When**: User requests profile
- **Action**: Fetch from database, store in cache
- **Benefit**: Cache populated as needed

#### Strategy 2: Preemptive Warming
- **When**: User logs in
- **Action**: Pre-fetch and cache user profile
- **Benefit**: Faster subsequent requests

#### Strategy 3: Scheduled Warming
- **When**: Periodic job (optional)
- **Action**: Pre-fetch frequently accessed data
- **Benefit**: High cache hit rate

---

### Cache Hit/Miss Flow:

#### Cache Hit Flow:
```
1. Request arrives
2. Check Redis cache
3. Cache Hit → Return cached data
4. Record metric: cache.hit
```

#### Cache Miss Flow:
```
1. Request arrives
2. Check Redis cache
3. Cache Miss → Query database
4. Store in cache with TTL
5. Return data
6. Record metric: cache.miss
```

---

### Cache Metrics:

- `cache.hit` - Cache hit count
- `cache.miss` - Cache miss count
- `cache.hit.rate` - Hit rate percentage
- `cache.size` - Cache size in bytes
- `cache.keys.count` - Number of keys
- `cache.ttl.remaining` - Average TTL remaining

---

### Diagram Annotations:

- Show Redis as central cache store
- Show cache layers as stacked boxes
- Show TTL values for each layer
- Show invalidation triggers as arrows
- Include cache hit/miss decision diamonds
- Show cache warming flows
- Include metrics collection points

---

## 4. WebSocket Architecture Diagram

**Purpose**: Shows real-time communication architecture using WebSocket, Socket.IO, and Redis adapter.

**Diagram Types Recommended**:
- **Connection Lifecycle Diagram** showing connect → authenticate → room join → message → disconnect
- **Scaling Architecture Diagram** showing Redis adapter for multi-instance scaling
- **Message Broadcasting Diagram** showing room-based message delivery

---

### Actors/Components to Include:

1. **WebSocket Clients** (Browser/Mobile Apps)
2. **Notification Gateway** (Port 4006)
   - Socket.IO Server
   - Namespace: `/notifications`
3. **Redis** (Port 6379)
   - Redis Adapter for Socket.IO
   - Connection tracking: `user_sockets:{user_id}`
4. **MongoDB** (Port 27017)
   - Notifications collection
5. **RabbitMQ** (Port 5672)
   - Notification queue

---

### Connection Lifecycle:

#### Step 1: Client Connection
- **Client** initiates WebSocket connection
- **URL**: `ws://notification:4006/notifications`
- **Headers**: `Authorization: Bearer <access_token>`
- **Socket.IO** establishes connection
- **Connection ID**: Generated (e.g., `socket_abc123`)

#### Step 2: Authentication
- **NotificationGateway.handleConnection()** extracts token
- **JwtStrategy** validates access token
- **Extract user_id** from token payload
- **If invalid**: Disconnect client, return error
- **If valid**: Continue to Step 3

#### Step 3: Store Connection
- **NotificationGateway** stores connection in local Map:
  ```typescript
  {
    socketId: "socket_abc123",
    userId: "user123",
    connectedAt: Date,
    lastActivity: Date
  }
  ```
- **Redis** stores socket ID:
  - Key: `user_sockets:{user_id}`
  - Value: Set containing socket IDs
  - TTL: 24 hours
- **Purpose**: Enable multi-instance scaling

#### Step 4: Join User Room
- **NotificationGateway** joins client to room:
  - Room name: `user_{userId}`
  - Example: `user_user123`
- **Socket.IO** manages room membership
- **Client** is now in personal room

#### Step 5: Push Undelivered Notifications
- **NotificationGateway** calls `pushUndeliveredNotifications()`
- **Query MongoDB** for undelivered notifications (`delivered: false`)
- **Send** notifications via WebSocket
- **Mark** as delivered after successful push

#### Step 6: Ready for Messages
- **Client** is authenticated and in room
- **Client** can receive real-time notifications
- **Client** can send events (e.g., `mark_notification_read`)

---

### Message Broadcasting:

#### Pattern 1: User-Specific Broadcast
- **Trigger**: New notification created for user
- **Flow**:
  1. Notification created in MongoDB
  2. Check if user is connected: `isUserConnected(userId)`
  3. If connected: Emit to room `user_{userId}`
  4. Message structure:
     ```json
     {
       "event": "notification_received",
       "data": {
         "id": "notification123",
         "user_id": "user123",
         "type": "follow",
         "title": "New Follower",
         "message": "User A started following you",
         "delivered": true,
         "read": false,
         "createdAt": "2024-01-15T10:30:00Z"
       },
       "timestamp": "2024-01-15T10:30:00Z",
       "userId": "user123"
     }
     ```
- **Delivery**: All sockets in user's room receive message

#### Pattern 2: Broadcast to All (Optional)
- **Trigger**: System-wide announcement
- **Flow**: `server.emit('notification_received', message)`
- **Delivery**: All connected clients receive message

---

### Redis Adapter for Scaling:

#### Purpose:
- Enable WebSocket scaling across multiple Notification Service instances
- Share connection state across instances
- Enable cross-instance message broadcasting

#### Configuration:
- **Adapter**: `@socket.io/redis-adapter`
- **Redis Connection**: Same Redis instance used for caching
- **Pub/Sub Channels**: Socket.IO uses Redis pub/sub for cross-instance communication

#### How It Works:
1. **Instance A** receives notification for user
2. **Instance A** checks local connections (user not connected locally)
3. **Instance A** checks Redis: `user_sockets:{user_id}` (user connected on Instance B)
4. **Instance A** publishes message to Redis pub/sub channel
5. **Instance B** receives message via Redis pub/sub
6. **Instance B** broadcasts to user's room (user is connected on Instance B)

---

### Room Management:

#### Room Types:

1. **User Rooms**: `user_{userId}`
   - Purpose: User-specific notifications
   - Membership: All user's socket connections
   - Example: `user_user123`

2. **System Rooms** (Optional):
   - Purpose: System-wide announcements
   - Membership: All connected clients
   - Example: `system:all`

---

### Connection Tracking:

#### Local Tracking (In-Memory):
- **Storage**: `Map<string, WebSocketConnection>`
- **Key**: Socket ID
- **Value**: Connection metadata
- **Purpose**: Fast local lookups

#### Distributed Tracking (Redis):
- **Storage**: Redis Sets
- **Key Pattern**: `user_sockets:{user_id}`
- **Value**: Set of socket IDs
- **TTL**: 24 hours
- **Purpose**: Cross-instance connection discovery

---

### Message Events:

#### Client → Server Events:

1. **`mark_notification_read`**
   - **Payload**: `{ notificationId: string }`
   - **Action**: Mark notification as read in MongoDB
   - **Response**: Success/error message

#### Server → Client Events:

1. **`user_connected`**
   - **Trigger**: Successful connection
   - **Payload**: `{ userId, socketId }`
   - **Purpose**: Confirm connection

2. **`notification_received`**
   - **Trigger**: New notification created
   - **Payload**: Notification data
   - **Purpose**: Deliver real-time notification

3. **`notification_read`**
   - **Trigger**: Notification marked as read
   - **Payload**: `{ notificationId, read_at }`
   - **Purpose**: Confirm read status

---

### Disconnection Handling:

#### Step 1: Client Disconnects
- **Trigger**: Client closes connection or network error
- **NotificationGateway.handleDisconnect()** called

#### Step 2: Cleanup Local State
- **Remove** connection from local Map
- **Calculate** connection duration

#### Step 3: Cleanup Redis
- **Remove** socket ID from Redis set: `user_sockets:{user_id}`
- **Command**: `SREM user_sockets:{user_id} socket_abc123`

#### Step 4: Leave Room
- **Socket.IO** automatically removes client from rooms
- **Room membership** cleaned up

#### Step 5: Record Metrics
- **Increment**: `websocket.disconnection`
- **Timing**: `websocket.connection.duration`
- **Gauge**: `websocket.connections.active`

---

### Error Handling:

1. **Authentication Failure**: Disconnect client, log error
2. **Redis Connection Failure**: Fall back to local tracking only
3. **Message Send Failure**: Log error, notification remains in MongoDB
4. **Room Join Failure**: Log error, retry or disconnect

---

### Diagram Annotations:

- Show WebSocket clients as browser/mobile icons
- Show Notification Gateway as central server
- Show Redis adapter for scaling
- Show rooms as named boxes
- Show connection lifecycle as state transitions
- Include authentication flow
- Show message broadcasting paths
- Include metrics collection points

---

## 5. Security Architecture Diagram

**Purpose**: Illustrates security layers, authentication mechanisms, and authorization patterns.

**Diagram Types Recommended**:
- **Security Layer Diagram** showing defense in depth
- **Authentication Flow Diagram** showing token validation
- **Authorization Flow Diagram** showing role-based access

---

### Actors/Components to Include:

1. **Client** (Web/Mobile App)
2. **API Gateway** (Port 4000)
   - Security middleware
   - Guards
   - Rate limiting
3. **Auth Service** (Port 4001)
   - JWT token generation
   - Token validation
   - Session management
4. **Microservices** (User, Wallet, Relationship, etc.)
   - Service guards
   - Service token validation
5. **Security Components**:
   - JWT Tokens (Access, Session, Service)
   - Device Fingerprinting
   - Rate Limiting
   - CORS
   - Security Headers

---

### Security Layers:

#### Layer 1: Network Security
- **Docker Network Isolation**: `decode-network` (172.20.0.0/16)
- **Port Exposure**: Only API Gateway (4000), Auth (4001), Notification (4006) exposed
- **Internal Services**: No external port exposure
- **Firewall Rules**: Restrict external access

#### Layer 2: Transport Security
- **HTTPS**: Recommended for production (TLS/SSL)
- **WebSocket Secure (WSS)**: For WebSocket connections
- **Certificate Management**: SSL/TLS certificates

#### Layer 3: Application Security Headers
- **Helmet Middleware**: Adds security headers
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy: default-src 'self'`
- **CORS**: Configured for allowed origins
- **Rate Limiting**: Prevents DDoS and brute force

#### Layer 4: Authentication
- **JWT Access Tokens**: Short-lived (15 minutes)
- **JWT Session Tokens**: Long-lived (30 days)
- **Service JWT Tokens**: For inter-service communication
- **Token Validation**: Signature, expiration, issuer, audience
- **Token Refresh**: Session token used for access token refresh

#### Layer 5: Authorization
- **Role-Based Access Control (RBAC)**: User roles (user, admin, moderator)
- **Guards**: `@UseGuards(AuthGuard)`, `@UseGuards(RolesGuard)`
- **Route Protection**: `@Public()` decorator for public routes
- **Service Guards**: `@UseGuards(AuthServiceGuard)` for service-to-service

#### Layer 6: Device Security
- **Device Fingerprinting**: Unique device identification
- **Device Trust**: Trusted vs untrusted devices
- **Device Verification**: Email verification for new devices
- **Device Revocation**: Revoke device and all associated sessions

#### Layer 7: Input Validation
- **DTO Validation**: Class-validator decorators
- **Sanitization**: Input sanitization
- **Type Checking**: TypeScript type safety
- **SQL Injection Prevention**: NoSQL injection prevention (MongoDB)

---

### JWT Token Types:

#### Token Type 1: Access Token
- **Purpose**: User authentication for API requests
- **Expiration**: 15 minutes (1 day in config, but typically shorter)
- **Payload**:
  ```json
  {
    "user_id": "user123",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "session_token": "session_token_here",
    "iat": 1234567890,
    "exp": 1234571490
  }
  ```
- **Secret**: `JWT_ACCESS_TOKEN_SECRET`
- **Issuer**: `decode-auth-service`
- **Audience**: `decode-frontend`
- **Algorithm**: HS256

#### Token Type 2: Session Token
- **Purpose**: Long-lived session management
- **Expiration**: 30 days
- **Payload**:
  ```json
  {
    "user_id": "user123",
    "session_id": "session123",
    "iat": 1234567890,
    "exp": 1237892490
  }
  ```
- **Secret**: `JWT_SESSION_TOKEN_SECRET`
- **Issuer**: `decode-auth-service`
- **Audience**: `decode-frontend`
- **Algorithm**: HS256
- **Storage**: MongoDB sessions collection

#### Token Type 3: Service Token
- **Purpose**: Inter-service authentication
- **Expiration**: 5 seconds (very short-lived)
- **Payload**:
  ```json
  {
    "from_service": "decode-auth-service",
    "to_service": "decode-user-service",
    "iat": 1234567890,
    "exp": 1234567895
  }
  ```
- **Secret**: `JWT_SERVICE_TOKEN_SECRET`
- **Issuer**: Service-specific (e.g., `decode-auth-service`)
- **Audience**: Target service (e.g., `decode-user-service`)
- **Algorithm**: HS256

---

### Authentication Flow:

#### Step 1: User Login
- **User** provides credentials (email/username + password)
- **Auth Service** validates credentials
- **Auth Service** generates access token and session token
- **Tokens** returned to client

#### Step 2: Token Storage
- **Client** stores tokens (localStorage, sessionStorage, or secure cookie)
- **Access token** used for API requests
- **Session token** used for token refresh

#### Step 3: API Request
- **Client** includes access token in header: `Authorization: Bearer <access_token>`
- **API Gateway** receives request

#### Step 4: Token Validation
- **API Gateway AuthGuard** extracts token
- **AuthGuard** calls Auth Service to validate token
- **Auth Service** validates:
  - Token signature
  - Token expiration
  - Token issuer
  - Token audience
- **If valid**: Attach user to request, continue
- **If invalid**: Return 401 Unauthorized

#### Step 5: Token Refresh
- **When**: Access token expires
- **Client** sends session token to `/auth/session/refresh`
- **Auth Service** validates session token
- **Auth Service** generates new access token
- **New access token** returned to client

---

### Authorization Flow:

#### Step 1: Route Protection
- **Controller** uses `@UseGuards(AuthGuard)`
- **AuthGuard** validates token (from authentication flow)
- **User** attached to request: `request.user`

#### Step 2: Role Check (If Applicable)
- **Controller** uses `@Roles('admin', 'moderator')`
- **RolesGuard** checks user role
- **If authorized**: Continue
- **If not authorized**: Return 403 Forbidden

#### Step 3: Resource Access
- **Controller** executes business logic
- **Service** may perform additional authorization checks
- **Response** returned to client

---

### Device Fingerprinting:

#### Purpose:
- Track and trust devices for enhanced security
- Detect suspicious login attempts
- Enable device-specific security policies

#### Implementation:
- **Fingerprint Generation**: Client-side library generates hash
- **Fingerprint Storage**: MongoDB `device_fingerprints` collection
- **Trust Status**: `is_trusted` field (true/false)
- **Verification**: Email verification for untrusted devices

#### Flow:
1. **User** logs in with device fingerprint
2. **Auth Service** checks if device is trusted
3. **If trusted**: Continue login
4. **If untrusted**: Require email verification
5. **After verification**: Mark device as trusted

---

### Rate Limiting:

#### Implementation:
- **Location**: API Gateway (global guard)
- **Storage**: Redis
- **Algorithm**: Sliding window or token bucket
- **Key Generation**: `rate_limit:user:{user_id}` or `rate_limit:ip:{ip_address}`

#### Rate Limit Tiers:

1. **Login Rate Limit**:
   - **Window**: 15 minutes
   - **Max Requests**: 5
   - **Purpose**: Prevent brute force attacks

2. **Standard Rate Limit**:
   - **Window**: 1 minute
   - **Max Requests**: 100
   - **Purpose**: General API protection

3. **Strict Rate Limit**:
   - **Window**: 1 minute
   - **Max Requests**: 20
   - **Purpose**: Sensitive operations

#### Response Headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Reset time

---

### CORS Configuration:

- **Origin**: Configurable (environment-based)
- **Credentials**: `true` (allows cookies)
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Authorization, Content-Type, Accept
- **Purpose**: Control cross-origin requests

---

### Security Headers (Helmet):

- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filter
- **Strict-Transport-Security**: Forces HTTPS
- **Content-Security-Policy**: Restricts resource loading

---

### Diagram Annotations:

- Show security layers as concentric circles or stacked boxes
- Show token types with expiration times
- Show authentication flow as sequence
- Show authorization checks as decision diamonds
- Include device fingerprinting flow
- Show rate limiting buckets
- Include CORS and security headers
- Show service-to-service authentication

---

## 6. Deployment Architecture Diagram

**Purpose**: Shows the production deployment structure using Docker and Docker Compose.

**Diagram Types Recommended**:
- **Container Topology Diagram** showing all containers and networks
- **Service Dependency Diagram** showing startup order
- **Port Mapping Diagram** showing exposed ports

---

### Actors/Components to Include:

1. **Docker Host** (Server)
2. **Docker Network**: `decode-network` (172.20.0.0/16)
3. **Microservices** (8 containers):
   - api-gateway (Port 4000 - EXPOSED)
   - auth (Port 4001 - EXPOSED)
   - user (Port 4002 - INTERNAL)
   - email-worker (Port 4003 - INTERNAL)
   - relationship (Port 4004 - INTERNAL)
   - wallet (Port 4005 - INTERNAL)
   - notification (Port 4006 - EXPOSED for WebSocket)
   - neo4jdb-sync (Port 4007 - INTERNAL)
4. **Infrastructure Services**:
   - datadog-agent (Ports 8125/UDP, 8126/TCP)
5. **External Services** (Cloud-hosted):
   - MongoDB (Port 27017)
   - Redis (Port 6379)
   - Neo4j (Ports 7474, 7687)
   - RabbitMQ (Port 5672)

---

### Container Details:

#### Container 1: api-gateway
- **Image**: `ghcr.io/pasonnn/decode-api-gateway:latest`
- **Container Name**: `decode-api-gateway`
- **Ports**: `4000:4000` (EXPOSED)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent, auth, user, wallet, relationship, notification
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)
- **Environment Variables**:
  - Service URLs (using Docker service names)
  - Datadog configuration
  - NODE_ENV: production

#### Container 2: auth
- **Image**: `ghcr.io/pasonnn/decode-auth:latest`
- **Container Name**: `decode-auth`
- **Ports**: `4001:4001` (EXPOSED)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 3: user
- **Image**: `ghcr.io/pasonnn/decode-user:latest`
- **Container Name**: `decode-user`
- **Ports**: None (INTERNAL ONLY)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 4: email-worker
- **Image**: `ghcr.io/pasonnn/decode-email-worker:latest`
- **Container Name**: `decode-email-worker`
- **Ports**: None (INTERNAL ONLY)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 5: relationship
- **Image**: `ghcr.io/pasonnn/decode-relationship:latest`
- **Container Name**: `decode-relationship`
- **Ports**: None (INTERNAL ONLY)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 6: wallet
- **Image**: `ghcr.io/pasonnn/decode-wallet:latest`
- **Container Name**: `decode-wallet`
- **Ports**: None (INTERNAL ONLY)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 7: notification
- **Image**: `ghcr.io/pasonnn/decode-notification:latest`
- **Container Name**: `decode-notification`
- **Ports**: `4006:4006` (EXPOSED for WebSocket)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 8: neo4jdb-sync
- **Image**: `ghcr.io/pasonnn/decode-neo4jdb-sync:latest`
- **Container Name**: `decode-neo4jdb-sync`
- **Ports**: None (INTERNAL ONLY)
- **Network**: `decode-network`
- **Dependencies**: datadog-agent
- **Health Check**: `GET /health` (30s interval, 10s timeout, 3 retries)

#### Container 9: datadog-agent
- **Image**: `datadog/agent:latest`
- **Container Name**: `datadog-agent`
- **Ports**: `8125:8125/UDP` (DogStatsD), `8126:8126/TCP` (APM)
- **Network**: `decode-network`
- **Volumes**:
  - `/var/run/docker.sock:/var/run/docker.sock:ro`
  - `/proc/:/host/proc/:ro`
  - `/sys/fs/cgroup/:/host/sys/fs/cgroup:ro`
  - `/opt/datadog-agent/run:/opt/datadog-agent/run:rw`
- **Health Check**: `agent health` (30s interval, 10s timeout, 3 retries)

---

### Docker Network:

#### Network Configuration:
- **Name**: `decode-network`
- **Driver**: `bridge`
- **Subnet**: `172.20.0.0/16`
- **Purpose**: Isolated network for all microservices

#### Service Discovery:
- **Method**: Docker DNS
- **Service Names**: Used as hostnames
- **Example**: `http://auth:4001` resolves to auth container
- **Internal Communication**: All services communicate via service names

---

### Port Exposure Strategy:

#### Exposed Ports (External Access):
- **4000**: API Gateway (main entry point)
- **4001**: Auth Service (direct access for some operations)
- **4006**: Notification Service (WebSocket connections)

#### Internal Ports (No External Access):
- **4002**: User Service
- **4003**: Email Worker
- **4004**: Relationship Service
- **4005**: Wallet Service
- **4007**: Neo4j Sync Service

#### Rationale:
- **Security**: Minimize attack surface
- **Access Control**: Only necessary services exposed
- **Internal Communication**: Services use Docker DNS

---

### Service Dependencies:

#### Startup Order:
1. **datadog-agent** (no dependencies)
2. **auth** (depends on datadog-agent)
3. **user, relationship, wallet, notification** (depend on datadog-agent)
4. **api-gateway** (depends on all services)
5. **email-worker, neo4jdb-sync** (depend on datadog-agent)

#### Health Check Strategy:
- **Start Period**: 40s (allows service to start)
- **Interval**: 30s (check every 30 seconds)
- **Timeout**: 10s (max wait for response)
- **Retries**: 3 (retry 3 times before marking unhealthy)

---

### Environment Configuration:

#### Environment Files:
- **`.env`**: Application configuration (secrets, database URLs)
- **`.env.decode-observe`**: Datadog configuration (API key, site)

#### Environment Variables (Per Service):
- **NODE_ENV**: `production`
- **Service Ports**: `{SERVICE}_PORT: {port}`
- **Service Hosts**: `{SERVICE}_HOST: 0.0.0.0`
- **Service URLs**: Using Docker service names (e.g., `http://auth:4001`)
- **Datadog Configuration**: Service name, version, APM, logs, metrics

---

### Image Management:

#### Image Registry:
- **Registry**: GitHub Container Registry (`ghcr.io`)
- **Organization**: `pasonnn`
- **Image Naming**: `decode-{service-name}:latest`
- **Build Process**: GitHub Actions (CI/CD)

#### Image Updates:
- **Tag Strategy**: `latest` tag for production
- **Versioning**: Optional version tags
- **Pull Policy**: `always` or `if-not-present`

---

### Volume Mounts:

#### Datadog Agent Volumes:
- **Docker Socket**: `/var/run/docker.sock` (read-only)
- **Process Info**: `/proc/` (read-only)
- **CGroup Info**: `/sys/fs/cgroup/` (read-only)
- **Agent Run**: `/opt/datadog-agent/run` (read-write)

#### Application Volumes:
- **None**: Stateless containers (no persistent volumes)
- **Data Storage**: External databases (MongoDB, Redis, Neo4j)

---

### Restart Policies:

- **Policy**: `unless-stopped`
- **Behavior**: Containers restart automatically unless manually stopped
- **Purpose**: High availability and fault tolerance

---

### Scaling Strategy:

#### Horizontal Scaling:
- **API Gateway**: Can scale to multiple instances (load balancer required)
- **Notification Service**: Scales with Redis adapter for WebSocket
- **Email Worker**: Can scale to multiple instances (queue consumers)
- **Other Services**: Can scale independently

#### Load Balancing:
- **External**: Load balancer (Nginx, HAProxy, cloud LB) in front of API Gateway
- **Internal**: Docker network handles service discovery

---

### Diagram Annotations:

- Show Docker host as outer container
- Show Docker network as network boundary
- Show containers as boxes with service names
- Show port mappings (exposed vs internal)
- Show service dependencies as arrows
- Include health check indicators
- Show external services (cloud) separately
- Include network subnet information
- Show image registry and pull process

---

## 7. CI/CD Pipeline Diagram

**Purpose**: Shows the continuous integration and deployment workflow.

**Diagram Types Recommended**:
- **Pipeline Flow Diagram** showing stages and steps
- **GitHub Actions Workflow Diagram** (if using GitHub Actions)
- **Deployment Flow Diagram** showing environments

---

### Actors/Components to Include:

1. **Source Control**: GitHub Repository
2. **CI/CD Platform**: GitHub Actions
3. **Build Stage**: Docker build
4. **Test Stage**: Unit tests, integration tests
5. **Registry**: GitHub Container Registry (ghcr.io)
6. **Deployment Target**: Production Server
7. **Environments**: Development, Staging, Production

---

### Pipeline Stages:

#### Stage 1: Source Control
- **Trigger**: Push to `main` branch or PR
- **Event Types**:
  - `push` to `main`: Full pipeline
  - `pull_request`: Build and test only
  - `workflow_dispatch`: Manual trigger
- **Repository**: `decode-backend-v2`
- **Branch Strategy**: `main` branch for production

#### Stage 2: Build
- **Actions**:
  1. Checkout code
  2. Setup Node.js (version 18.x or latest)
  3. Install dependencies: `npm ci`
  4. Build each microservice:
     - `npm run build:api-gateway`
     - `npm run build:auth`
     - `npm run build:user`
     - `npm run build:wallet`
     - `npm run build:relationship`
     - `npm run build:notification`
     - `npm run build:email-worker`
     - `npm run build:neo4jdb-sync`
  5. Build Docker images for each service
  6. Tag images: `ghcr.io/pasonnn/decode-{service}:latest`

#### Stage 3: Test
- **Actions**:
  1. Run unit tests: `npm test`
  2. Run linting: `npm run lint`
  3. Run type checking: `tsc --noEmit`
  4. (Optional) Integration tests
- **Failure Handling**: Pipeline stops on test failure

#### Stage 4: Docker Image Creation
- **Actions**:
  1. Build Docker images using Dockerfiles
  2. Tag with commit SHA: `ghcr.io/pasonnn/decode-{service}:{sha}`
  3. Tag with `latest`: `ghcr.io/pasonnn/decode-{service}:latest`
- **Dockerfile Location**: Each service has its own Dockerfile
- **Build Context**: Service directory

#### Stage 5: Push to Registry
- **Actions**:
  1. Authenticate to GitHub Container Registry
  2. Push images: `docker push ghcr.io/pasonnn/decode-{service}:latest`
  3. Push tagged images: `docker push ghcr.io/pasonnn/decode-{service}:{sha}`
- **Registry**: `ghcr.io/pasonnn/`
- **Authentication**: `GITHUB_TOKEN` (automatically provided)

#### Stage 6: Deployment
- **Actions**:
  1. SSH to production server
  2. Pull latest images: `docker-compose pull`
  3. Stop existing containers: `docker-compose down`
  4. Start new containers: `docker-compose up -d`
  5. Wait for health checks
- **Deployment Strategy**: Rolling update (zero-downtime if possible)

#### Stage 7: Health Checks
- **Actions**:
  1. Wait for containers to start (start_period: 40s)
  2. Check health endpoints:
     - `GET /health` for each service
  3. Verify services are responding
  4. Check Datadog for errors
- **Failure Handling**: Rollback to previous version if health checks fail

#### Stage 8: Rollback (If Needed)
- **Trigger**: Health checks fail or errors detected
- **Actions**:
  1. Stop new containers
  2. Restart previous containers (using previous image tags)
  3. Verify previous version is working
  4. Alert operations team
- **Rollback Strategy**: Keep previous images tagged for quick rollback

---

### GitHub Actions Workflow Structure:

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:all
      - run: npm test
      - run: npm run lint

  build-and-push:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker images
        # Build and push each service image
```

---

### Deployment Environments:

#### Environment 1: Development
- **Branch**: `develop` or feature branches
- **Deployment**: Automatic on push
- **Purpose**: Development and testing

#### Environment 2: Staging
- **Branch**: `staging` or `release/*`
- **Deployment**: Manual or automatic
- **Purpose**: Pre-production testing

#### Environment 3: Production
- **Branch**: `main`
- **Deployment**: Manual approval required
- **Purpose**: Live production environment

---

### Diagram Annotations:

- Show GitHub repository as source
- Show pipeline stages as sequential boxes
- Show parallel jobs where applicable
- Show Docker registry as storage
- Show deployment server as target
- Include rollback path
- Show environment branches
- Include approval gates for production

---

## 8. Monitoring and Observability Diagram

**Purpose**: Shows monitoring, logging, and observability infrastructure using Datadog.

**Diagram Types Recommended**:
- **Observability Stack Diagram** showing data collection and flow
- **Metrics Flow Diagram** showing metric types and destinations
- **Dashboard Architecture Diagram** showing visualization layers

---

### Actors/Components to Include:

1. **Microservices** (8 services)
   - API Gateway, Auth, User, Wallet, Relationship, Notification, Email Worker, Neo4j Sync
2. **Datadog Agent** (Container)
   - Port 8125/UDP (DogStatsD)
   - Port 8126/TCP (APM)
3. **Datadog Cloud** (External)
   - APM (Application Performance Monitoring)
   - Logs
   - Metrics
   - Dashboards
   - Alerts
4. **Data Sources**:
   - APM Traces (automatic)
   - Custom Metrics (DogStatsD)
   - Container Logs (stdout/stderr)
   - Infrastructure Metrics

---

### Observability Stack:

#### Layer 1: Data Collection

**1.1 APM (Application Performance Monitoring)**
- **Library**: `dd-trace` (v5.76.0)
- **Initialization**: `import 'dd-trace/init'` in `main.ts`
- **Configuration**:
  ```typescript
  DD_APM_ENABLED: true
  DD_TRACE_ENABLED: true
  DD_TRACE_SAMPLE_RATE: 1.0
  DD_AGENT_HOST: datadog-agent
  ```
- **Data Collected**:
  - Distributed traces across services
  - HTTP request/response spans
  - Database query spans
  - Service-to-service call spans
  - Error traces with stack traces
- **Transport**: TCP port 8126 to Datadog Agent

**1.2 Custom Metrics (DogStatsD)**
- **Library**: `hot-shots` (StatsD client)
- **Service**: `MetricsService` in each microservice
- **Configuration**:
  ```typescript
  DD_DOGSTATSD_PORT: 8125
  DD_DOGSTATSD_NON_LOCAL_TRAFFIC: true
  DD_AGENT_HOST: datadog-agent
  ```
- **Data Collected**:
  - Business metrics (user actions, operations)
  - Infrastructure metrics (HTTP requests, database queries)
  - Performance metrics (durations, counts, errors)
- **Transport**: UDP port 8125 to Datadog Agent

**1.3 Logs**
- **Source**: Container stdout/stderr
- **Collection**: Automatic by Datadog Agent
- **Configuration**:
  ```yaml
  DD_LOGS_ENABLED: true
  DD_LOGS_INJECTION: true  # Inject trace IDs
  DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL: true
  ```
- **Data Collected**:
  - Application logs (structured JSON)
  - Error logs with stack traces
  - Access logs
  - Service logs
- **Transport**: Docker socket → Datadog Agent

**1.4 Infrastructure Metrics**
- **Source**: Datadog Agent system collection
- **Data Collected**:
  - CPU usage
  - Memory usage
  - Network I/O
  - Disk I/O
  - Container metrics
- **Transport**: Automatic by Datadog Agent

---

#### Layer 2: Datadog Agent

**Agent Configuration**:
- **Image**: `datadog/agent:latest`
- **Container**: `datadog-agent`
- **Ports**:
  - `8125/UDP`: DogStatsD (metrics)
  - `8126/TCP`: APM (traces)
- **Volumes**:
  - `/var/run/docker.sock`: Container log collection
  - `/proc/`: Process metrics
  - `/sys/fs/cgroup/`: Container metrics
  - `/opt/datadog-agent/run`: Agent runtime data

**Agent Functions**:
1. **Receive APM Traces**: From services via TCP 8126
2. **Receive Metrics**: From services via UDP 8125
3. **Collect Logs**: From Docker containers via socket
4. **Collect Infrastructure Metrics**: System-level metrics
5. **Forward to Datadog Cloud**: HTTPS to `us5.datadoghq.com`

---

#### Layer 3: Datadog Cloud

**Data Processing**:
- **APM**: Trace processing, service map generation, error tracking
- **Metrics**: Metric aggregation, retention, querying
- **Logs**: Log parsing, indexing, search
- **Correlation**: Trace IDs link traces, logs, and metrics

**Visualization**:
- **Dashboards**: Custom dashboards for services and infrastructure
- **Service Map**: Automatic service dependency visualization
- **APM Traces**: Distributed trace viewer
- **Log Explorer**: Log search and analysis
- **Metrics Explorer**: Metric querying and graphing

**Alerting**:
- **Alert Rules**: Based on metrics, logs, or traces
- **Notification Channels**: Email, Slack, PagerDuty
- **Alert Conditions**: Thresholds, anomalies, error rates

---

### Metrics Categories:

#### Category 1: HTTP Request Metrics
- **Metrics**:
  - `http.request.duration` (Timing)
  - `http.request.count` (Counter)
  - `http.request.error` (Counter)
  - `http.request.size` (Histogram)
  - `http.response.size` (Histogram)
- **Tags**: `method`, `route`, `status_code`, `service`, `env`
- **Source**: API Gateway MetricsInterceptor
- **Purpose**: Monitor API performance and errors

#### Category 2: Database Metrics
- **MongoDB Metrics**:
  - `db.mongodb.query.duration` (Timing)
  - `db.mongodb.query.count` (Counter)
  - `db.mongodb.query.errors` (Counter)
  - `db.mongodb.query.slow` (Counter, queries > 100ms)
- **Neo4j Metrics**:
  - `db.neo4j.query.duration` (Timing)
  - `db.neo4j.query.count` (Counter)
  - `db.neo4j.query.errors` (Counter)
  - `db.neo4j.relationships.created` (Counter)
- **Tags**: `operation`, `collection`, `service`, `env`
- **Purpose**: Monitor database performance

#### Category 3: Queue Metrics
- **Metrics**:
  - `queue.message.published` (Counter)
  - `queue.message.consumed` (Counter)
  - `queue.message.processing.duration` (Timing)
  - `queue.message.failed` (Counter)
- **Tags**: `queue_name`, `message_type`, `service`, `env`
- **Source**: RabbitMQ consumers (Email Worker, Notification, Neo4j Sync)
- **Purpose**: Monitor message queue health

#### Category 4: Cache Metrics
- **Metrics**:
  - `cache.redis.operation.duration` (Timing)
  - `cache.redis.operation.count` (Counter)
  - `cache.redis.hit` (Counter)
  - `cache.redis.miss` (Counter)
- **Tags**: `operation`, `key_pattern`, `service`, `env`
- **Purpose**: Monitor cache performance

#### Category 5: WebSocket Metrics
- **Metrics**:
  - `websocket.connection` (Counter)
  - `websocket.disconnection` (Counter)
  - `websocket.connections.active` (Gauge)
  - `websocket.message.sent` (Counter)
  - `websocket.message.received` (Counter)
  - `websocket.message.duration` (Timing)
  - `websocket.message.failed` (Counter)
- **Tags**: `event_type`, `user_id`, `status`, `service`, `env`
- **Source**: Notification Gateway
- **Purpose**: Monitor WebSocket connections and message delivery

#### Category 6: Business Metrics
- **User Service**:
  - `user.search.executed`, `user.profile.viewed`, `user.profile.updated`
- **Relationship Service**:
  - `relationship.follow`, `relationship.block`, `relationship.suggestions.generated`
- **Wallet Service**:
  - `wallet.linked`, `wallet.primary.set`
- **Notification Service**:
  - `notification.created`, `notification.read`
- **Email Worker**:
  - `email.sent`, `email.failed`, `email.processing.duration`
- **Neo4j Sync**:
  - `sync.user.created`, `sync.user.updated`, `sync.duration`
- **Tags**: `operation`, `status`, `service`, `env`
- **Purpose**: Track business operations and KPIs

#### Category 7: Rate Limiting Metrics
- **Metrics**:
  - `rate_limit.requests.allowed` (Counter)
  - `rate_limit.requests.denied` (Counter)
- **Tags**: `user_id`, `ip`, `service`, `env`
- **Source**: API Gateway RateLimitGuard
- **Purpose**: Monitor rate limiting effectiveness

---

### Trace Metrics (Automatic):

**Generated from APM Traces**:
- `trace.http.request.duration` (Distribution)
- `trace.http.request.hits` (Count)
- `trace.http.request.errors` (Count)
- `trace.span.duration` (Distribution)

**Purpose**: Alternative source of performance data, automatically generated from traces

---

### Log Collection:

#### Log Sources:
1. **Application Logs**: Structured JSON logs from services
2. **Error Logs**: Stack traces and error details
3. **Access Logs**: HTTP request/response logs
4. **Service Logs**: Service-specific operation logs

#### Log Processing:
- **Multi-line Detection**: Logs starting with dates are grouped
- **Trace Correlation**: Logs include trace IDs for APM correlation
- **Parsing**: Automatic JSON parsing for structured logs
- **Indexing**: Full-text search on log content

#### Log Fields:
- `timestamp`: Log timestamp
- `level`: Log level (info, warn, error)
- `message`: Log message
- `service`: Service name
- `trace_id`: APM trace ID (if available)
- `span_id`: APM span ID (if available)

---

### Health Checks:

#### Service Health Endpoints:
- **Path**: `GET /health`
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00Z",
    "service": "api-gateway",
    "version": "1.0.0"
  }
  ```
- **Purpose**: Container health monitoring
- **Frequency**: Every 30 seconds (Docker health check)

#### Dependency Health Checks:
- **MongoDB**: Connection check
- **Redis**: Ping check
- **Neo4j**: Query check (`RETURN 1`)
- **RabbitMQ**: Connection check

---

### Alerting Strategy:

#### Alert Types:

**1. Error Rate Alerts**
- **Metric**: `http.request.error` rate
- **Threshold**: > 5% error rate over 5 minutes
- **Action**: Alert operations team

**2. Latency Alerts**
- **Metric**: `http.request.duration` p95
- **Threshold**: > 1000ms over 5 minutes
- **Action**: Alert operations team

**3. Service Down Alerts**
- **Metric**: Health check failures
- **Threshold**: 3 consecutive failures
- **Action**: Page on-call engineer

**4. Queue Backlog Alerts**
- **Metric**: Queue message count
- **Threshold**: > 1000 messages in queue
- **Action**: Alert operations team

**5. Database Performance Alerts**
- **Metric**: `db.mongodb.query.duration` p95
- **Threshold**: > 500ms over 5 minutes
- **Action**: Alert database team

**6. WebSocket Connection Alerts**
- **Metric**: `websocket.connections.active` drop
- **Threshold**: > 50% drop in 5 minutes
- **Action**: Alert operations team

---

### Dashboard Structure:

#### Dashboard 1: System Overview
- **Metrics**: Overall request rate, error rate, latency
- **Services**: All 8 services status
- **Infrastructure**: CPU, memory, network
- **Purpose**: High-level system health

#### Dashboard 2: API Gateway Performance
- **Metrics**: Request duration, count, errors by route
- **Visualizations**: Time series, top routes, error breakdown
- **Purpose**: API Gateway monitoring

#### Dashboard 3: Service Performance
- **Metrics**: Per-service request metrics
- **Visualizations**: Service comparison, latency distribution
- **Purpose**: Service-level monitoring

#### Dashboard 4: Database Performance
- **Metrics**: MongoDB and Neo4j query metrics
- **Visualizations**: Query duration, slow queries, error rates
- **Purpose**: Database health monitoring

#### Dashboard 5: Queue Health
- **Metrics**: Message published/consumed, processing duration
- **Visualizations**: Queue depth, consumer lag, error rates
- **Purpose**: Message queue monitoring

#### Dashboard 6: WebSocket Health
- **Metrics**: Connection counts, message delivery, errors
- **Visualizations**: Active connections, message rates, delivery success
- **Purpose**: Real-time communication monitoring

#### Dashboard 7: Business Metrics
- **Metrics**: User actions, relationship operations, wallet operations
- **Visualizations**: Operation counts, success rates, trends
- **Purpose**: Business KPI tracking

---

### Data Flow:

```
Microservices
    │
    ├─→ dd-trace → APM Traces → Datadog Agent (TCP 8126) → Datadog Cloud
    │
    ├─→ MetricsService → DogStatsD → Datadog Agent (UDP 8125) → Datadog Cloud
    │
    └─→ stdout/stderr → Docker Logs → Datadog Agent (Socket) → Datadog Cloud
            │
            └─→ Datadog Cloud
                ├─→ APM (Traces, Service Map)
                ├─→ Metrics (Dashboards, Alerts)
                └─→ Logs (Log Explorer, Correlation)
```

---

### Trace Correlation:

**Trace ID Injection**:
- **APM Traces**: Automatically include trace IDs
- **Logs**: Trace IDs injected via `DD_LOGS_INJECTION: true`
- **Metrics**: Can be tagged with trace IDs (optional)

**Correlation Benefits**:
- Link logs to traces
- Link metrics to traces
- Full request journey visibility
- Easier debugging and troubleshooting

---

### Diagram Annotations:

- Show microservices as data sources
- Show Datadog Agent as central collector
- Show Datadog Cloud as destination
- Show data flow arrows (APM, Metrics, Logs)
- Include port numbers (8125, 8126)
- Show metric categories
- Include dashboard visualization
- Show alerting paths
- Include trace correlation flow

---

## 9. Rate Limiting Architecture Diagram (Diagram #33)

**Purpose**: Shows how the API Gateway enforces rate limits using Redis-backed buckets, different policies, and standardized responses.

**Diagram Types Recommended**:
- **Component Diagram** showing guards, services, and Redis
- **Flowchart** illustrating request → key generation → allowance check → response headers → outcome

---

### Actors/Components to Include:

1. **Client Request**
2. **API Gateway**
   - `RateLimitGuard` (`apps/api-gateway/src/common/guards/rate-limit.guard.ts`)
   - `RateLimitService`
   - `@RateLimit()` decorator metadata (`windowMs`, `max`, `message`)
3. **Redis** (Port 6379)
   - Key pattern: `rate_limit:user:{user_id}` or `rate_limit:ip:{ip_address}`
4. **Downstream Controllers/Services** (only reached if allowed)

---

### Flow Steps:

1. **Controller Decoration**
   - Controller/route decorated with `@RateLimit({ windowMs: 60_000, max: 100, message: 'Too many requests' })`
   - Metadata stored under `RATE_LIMIT_KEY`

2. **Guard Execution**
   - `RateLimitGuard.canActivate()` runs before controller
   - Retrieves metadata via `Reflector`
   - If no decorator, request passes

3. **Key Generation**
   - Default: if authenticated, `rate_limit:user:{userId}`; otherwise `rate_limit:ip:{clientIp}`
   - Custom `keyGenerator` optional (e.g., per-endpoint keys)

4. **Redis Sliding Window Check**
   - `RateLimitService.isAllowed(key, windowMs, max)`
   - Implementation: uses Redis `INCR` with TTL (`windowMs`) or Lua script for atomicity
   - Returns `{ allowed: boolean, info: { limit, remaining } }`

5. **Response Header Injection**
   - `RateLimitGuard` sets both RFC-compliant (`RateLimit-*`) and legacy (`X-RateLimit-*`) headers:
     - `Limit`: configured `max`
     - `Remaining`: `max - currentCount`
     - `Reset`: `Date.now() + windowMs`

6. **Decision**
   - **Allowed**: Guard returns `true`, controller executes
   - **Exceeded**: Guard throws `429 Too Many Requests` with JSON body:
     ```json
     {
       "success": false,
       "statusCode": 429,
       "message": "Too many requests, please try again later.",
       "error": "Rate limit exceeded"
     }
     ```
   - Redis outage fallback: guard logs error and allows request (fail-open)

7. **Multiple Policies**
   - **Login endpoints**: `windowMs: 15 * 60_000`, `max: 5`
   - **Standard APIs**: `windowMs: 60_000`, `max: 100`
   - **Strict APIs**: `windowMs: 60_000`, `max: 20`

---

### Diagram Annotations:

- Show decorator metadata feeding into guard
- Show guard generating key (user vs IP)
- Show Redis bucket increment and TTL
- Show response headers added
- Highlight failure path returning `429`
- Mention fail-open fallback if Redis unavailable

---

## 10. Service Discovery & Health Checks Diagram (Diagram #34)

**Purpose**: Shows how services discover each other, resolve hostnames, and expose health checks for Docker Compose and external monitoring.

**Diagram Types Recommended**:
- **Network Diagram** showing Docker network, service names, and external dependencies
- **Health Check Flow** showing `/health` endpoints and dependency verification

---

### Actors/Components to Include:

1. **Docker Network**: `decode-network` (`bridge`, `172.20.0.0/16`)
2. **Microservices** (API Gateway, Auth, User, Wallet, Relationship, Notification, Email Worker, Neo4j Sync)
3. **Environment Variables**:
   - `AUTH_SERVICE_URL=http://auth:4001`
   - `USER_SERVICE_URL=http://user:4002`
   - etc. (always Docker service names)
4. **External Managed Services**: MongoDB Atlas, Redis, RabbitMQ, Neo4j Aura (not in Compose)
5. **Health Endpoints**:
   - `GET /health` (all services)
   - Additional dependency checks (MongoDB, Redis, RabbitMQ)
6. **Docker Compose Healthchecks** (interval 30s, timeout 10s, retries 3, start_period 40s)

---

### Service Discovery Flow:

1. **Container Startup**
   - Each service attaches to `decode-network`
   - Docker DNS automatically registers service name (`auth`, `user`, etc.)

2. **Configuration**
   - Services read `.env` values (via `ConfigService`)
   - HTTP clients (e.g., `UserServiceClient`) reference `http://user:4002`
   - API Gateway forward calls using these URLs

3. **DNS Resolution**
   - Service name resolves to container IP inside network
   - No external load balancer needed for internal calls

4. **External Dependency Resolution**
   - Services use environment secrets for managed databases (MongoDB URI, Redis URI, etc.)
   - Credentials injected via `.env` (never hard-coded)

---

### Health Check Flow:

1. **Docker Health Checks**
   - Each container exposes `GET /health`
   - Compose command:
     ```bash
     node -e "require('http').get('http://localhost:4001/health', ... )"
     ```
   - If fails 3 times, container marked unhealthy and restarted

2. **Endpoint Content**
   - Returns JSON with `status`, `timestamp`, `service`, `version`
   - Optionally includes dependency statuses

3. **Dependency Validation**
   - Services may expose `GET /health/dependencies` to check:
     - MongoDB connectivity (`mongoose.connection.readyState`)
     - Redis `PING`
     - RabbitMQ channel status
     - Neo4j driver `session.run('RETURN 1')`

4. **External Monitoring**
   - Datadog monitors `/health`
   - Alerts triggered on repeated failures

---

### Diagram Annotations:

- Show Docker network boundary with service nodes inside
- Show environment variables mapping service URLs
- Show `/health` endpoints with check intervals
- Show dependency checks (MongoDB, Redis, etc.)
- Indicate restart policy on failure (`unless-stopped`, automatic restart)

---

## 11. Data Consistency Model Diagram (Diagram #35)

**Purpose**: Shows how MongoDB (source of truth) stays consistent with Neo4j (graph), Redis (caches), and follower snapshots, plus eventual consistency guarantees.

**Diagram Types Recommended**:
- **State Machine Diagram** for data lifecycle
- **Event Flow Diagram** for MongoDB → RabbitMQ → Neo4j
- **Consistency Table** showing guarantees per subsystem

---

### Components:

1. **MongoDB** (primary data store for users, sessions, wallets, notifications)
2. **Neo4j** (graph relationships, interests)
3. **Redis** (caches and transient verification data)
4. **RabbitMQ** (`neo4j_sync_queue`)
5. **Neo4j Sync Service** (`apps/neo4jdb-sync`)
6. **Follower Snapshot Job** (Relationship Service)

---

### Consistency Flows:

#### Flow 1: MongoDB → Neo4j Sync
1. User data changes (create/update) in MongoDB via Auth/User services
2. Event published:
   - `create_user_request` or `update_user_request`
   - Message sent via RabbitMQ `neo4j_sync_queue`
3. Neo4j Sync Service consumes message
4. Executes Cypher queries to create/update Neo4j `User` nodes
5. API Gateway `UsersService.syncNeo4jUser()` verifies Neo4j state during profile fetch:
   - If node missing or out of date, emits additional sync event and waits (1 second)
6. Consistency Guarantee: **Eventual** (MongoDB authoritative; Neo4j updated asynchronously)

#### Flow 2: Redis Cache Invalidation
1. Data fetched → stored in Redis (`user:{user_id}`, `session:{session_token}`)
2. On updates (profile change, session revoke), services delete relevant keys
3. TTL ensures stale data expires even if invalidation missed
4. Consistency Guarantee: **Cache-aside** with TTL and event-based invalidation

#### Flow 3: Follower Snapshots
1. Relationship Service periodically runs snapshot job
2. Queries Neo4j for follower counts
3. Stores snapshots in MongoDB `follower_snapshots` (analytics)
4. Consistency Guarantee: **Lagging analytic view** (timestamped snapshots)

---

### Conflict Resolution Strategy:

- MongoDB authoritative for user attributes; in case of divergence:
  - API Gateway triggers sync to Neo4j
  - Neo4j updates overwritten with MongoDB values
- Neo4j authoritative for real-time relationships; MongoDB stores snapshots only
- Redis never authoritative; caches cleared when conflict detected

---

### Diagram Annotations:

- Show MongoDB at center with arrows to:
  - RabbitMQ → Neo4j Sync → Neo4j
  - Redis caches (with TTL)
- Label each arrow with “eventual consistency” or “cache-aside”
- Include timeline for sync (publish, consume, apply)
- Show fallback path (API Gateway forcing sync)
- Mention follower snapshots as scheduled job

---

## 12. API Gateway Request Transformation Diagram (Diagram #36)

**Purpose**: Shows end-to-end request lifecycle inside API Gateway: middleware, validation, guards, interceptors, and response shaping.

**Diagram Types Recommended**:
- **Sequence Diagram** for request pipeline
- **Layered Diagram** highlighting middleware/guard/controller layers

---

### Pipeline Layers:

1. **Express Middleware (Global)**
   - `CorsMiddleware`: config from `.env` (allowed origins, credentials)
   - `HelmetMiddleware`: security headers
   - `RequestIdMiddleware`: attaches `requestId` UUID to `req` and response headers
   - `RequestLoggerMiddleware`: logs method, url, ip, requestId

2. **NestJS Pipes**
   - Global `ValidationPipe` (`transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`)
   - Transforms JSON into DTO instances, strips unknown fields, throws `400` on validation failures

3. **Guards**
   - `AuthGuard`: Validates JWT via Auth Service (`/auth/info/by-access-token`), caches verdicts
   - `AuthGuardWithFingerprint`: Validates device fingerprint for sensitive routes
   - `RateLimitGuard`: Enforces rate limits (section 9)
   - `RolesGuard` (if used) for RBAC

4. **Interceptors**
   - `MetricsInterceptor`: Records `http.request.duration/count/error`
   - `RequestIdInterceptor`: Ensures `requestId` header flows through responses
   - `ResponseTransformInterceptor`: Standardizes response format:
     ```json
     {
       "success": true,
       "statusCode": 200,
       "message": "OK",
       "data": {...},
       "requestId": "uuid"
     }
     ```

5. **Controller & Service Layer**
   - Controller receives DTO (already validated)
   - Calls service (e.g., `UsersService`)
   - Service uses HTTP clients (`BaseHttpClient`) to call downstream services with Datadog tracing, retry, error translation

6. **Exception Filters**
   - `ValidationExceptionFilter`: Formats DTO errors
   - `HttpExceptionFilter`: Converts thrown exceptions to standard JSON with `success: false`

---

### Diagram Flow (Sequence):

1. Client → API Gateway (`Express`)
2. Middleware stack adds security headers, requestId, logging
3. `ValidationPipe` transforms/validates body
4. Guards run (rate limit → auth → role)
5. Controller executes, service calls downstream HTTP clients (with Datadog trace headers)
6. Downstream response returns (success/error)
7. Interceptors record metrics, shape response payload
8. Exception filters catch errors and format response

---

### Diagram Annotations:

- Show each layer as a box; arrows flow sequentially
- Highlight where requestId is created and attached
- Show guard order (RateLimit → Auth → Role)
- Show `BaseHttpClient` injecting headers (`x-datadog-trace-id`, etc.)
- Show standardized response schema
- Include alternate error path (exception filter)

---

## 13. Inter-Service Communication Patterns Diagram (Diagram #47)

**Purpose**: Shows all communication patterns across the Decode backend: synchronous HTTP, asynchronous messaging, WebSocket, and service-to-service authentication.

**Diagram Types Recommended**:
- **Hybrid Communication Diagram** combining synchronous and asynchronous flows
- **Matrix/Table** summarizing pattern + purpose + security

---

### Communication Patterns:

#### 1. Synchronous HTTP (REST)
- **Initiator**: API Gateway (primary)
- **Targets**: Auth, User, Wallet, Relationship, Notification REST endpoints
- **Transport**: HTTP over Docker network
- **Security**:
  - User authentication via `Authorization: Bearer <access_token>`
  - Service-to-service auth via `ServicesJwtStrategy` tokens (Auth ↔ User, Wallet ↔ Auth)
- **Observability**: Datadog trace headers in `BaseHttpClient`
- **Use Cases**: Login, profile fetch, wallet linking, follow/block operations

#### 2. Asynchronous Messaging (RabbitMQ)
- **Publishers**: Auth, User, Relationship, API Gateway
- **Queues**:
  - `email_queue` (`email_request`)
  - `notification_queue` (`create_notification`)
  - `neo4j_sync_queue` (`create_user_request`, `update_user_request`)
- **Consumers**: Email Worker, Notification Service, Neo4j Sync Service
- **Security**: RabbitMQ credentials from `.env`, durable queues
- **Use Cases**: Email delivery, notification fan-out, Neo4j synchronization

#### 3. WebSocket (Socket.IO)
- **Server**: Notification Service (`/notifications`, port 4006)
- **Clients**: Browsers/mobile apps
- **Security**: Access token validated on connection; Redis adapter for scaling
- **Use Cases**: Real-time notifications, read acknowledgements

#### 4. Redis Pub/Sub & Data Sharing
- **Use**: Socket.IO Redis adapter, cache invalidation, rate limiting
- **Security**: Redis URI with credentials, TLS if available
- **Patterns**:
  - Pub/Sub for WebSocket events across instances
  - Key-value for caches, session tokens, verification codes

#### 5. Service-to-Service JWT Authentication
- **Generator**: `ServicesJwtStrategy`
- **Consumers**: `AuthServiceGuard`, `WalletServiceGuard`
- **Flow**:
  1. Service A needs Service B → creates short-lived (5s) service token
  2. HTTP request with `Authorization: Bearer <service_token>`
  3. Service B guard validates issuer/audience/expiration
  4. Request allowed; otherwise `401`
- **Use Cases**: Auth ↔ User, Wallet ↔ Auth, API Gateway ↔ downstream services

---

### Diagram Annotations:

- Draw lanes for synchronous HTTP, RabbitMQ, WebSocket, Redis, service tokens
- Show API Gateway at center for HTTP calls
- Show RabbitMQ broker with queues and consumers
- Show Notification Service handling WebSocket connections with Redis adapter
- Show service-to-service JWT generation/validation flow
- Include security considerations (tokens, credentials)
- Annotate typical payloads (JSON schemas)

---

## Summary

All eight diagrams cover critical infrastructure and operational aspects:

1. **Database Architecture**: MongoDB, Neo4j, Redis data models and relationships
2. **Message Queue Architecture**: RabbitMQ queues, routing, and consumers
3. **Caching Strategy**: Redis cache layers, invalidation, and warming
4. **WebSocket Architecture**: Real-time communication, scaling, and room management
5. **Security Architecture**: Multi-layer security, JWT tokens, rate limiting
6. **Deployment Architecture**: Docker containers, networks, and service discovery
7. **CI/CD Pipeline**: GitHub Actions workflow, build, test, deploy, rollback
8. **Monitoring and Observability**: Datadog APM, metrics, logs, dashboards, alerts

Key architectural patterns:
- **Multi-database Strategy**: MongoDB (documents), Neo4j (graph), Redis (cache)
- **Asynchronous Processing**: RabbitMQ for decoupled operations
- **Caching Layers**: Multiple cache strategies for performance
- **Real-time Communication**: WebSocket with Redis adapter for scaling
- **Security in Depth**: Multiple security layers and mechanisms
- **Container Orchestration**: Docker Compose for service management
- **Continuous Deployment**: Automated CI/CD pipeline
- **Comprehensive Observability**: APM, metrics, logs, and dashboards

---

**Last Updated**: 2024
**Maintained By**: Decode Development Team
