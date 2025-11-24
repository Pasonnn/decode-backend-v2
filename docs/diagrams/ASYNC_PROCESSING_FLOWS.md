# Async Processing Flows

This document provides detailed instructions for drawing three critical asynchronous processing flow diagrams in the Decode Network Backend system.

---

## 1. Notification Delivery Flow

**Purpose**: Shows how notifications are created, queued, and delivered to users through RabbitMQ, MongoDB storage, and WebSocket push.

**Diagram Types Recommended**:
- **Sequence Diagram** (Primary): Shows the chronological flow of events across services
- **Flowchart** (Secondary): Shows decision points and alternative paths

---

### Sequence Diagram: Notification Delivery Flow

#### Actors/Components to Include:
1. **Event Source Services** (Auth Service, Relationship Service, etc.)
2. **RabbitMQ** (Port 5672)
   - Queue: `notification_queue`
   - Pattern: `create_notification`
3. **Notification Service** (Port 4005)
   - RabbitMQController (MessagePattern handler)
   - RabbitMQInfrastructure (message processor)
   - NotificationService (database operations)
   - NotificationGateway (WebSocket server)
4. **MongoDB** (Port 27017)
   - Collection: `notifications`
5. **Redis** (Port 6379)
   - Stores active WebSocket connections
6. **Client/User** (WebSocket connection)
7. **REST API** (fallback for offline users)

---

### Detailed Flow Steps:

**Step 1: Event Generation**
- **Event Source Service** (e.g., Auth Service, Relationship Service) generates a notification event
- Example: User follows another user → Relationship Service creates follow notification
- Example: User logs in → Auth Service creates login notification
- Notification payload structure:
  ```typescript
  {
    user_id: string,
    type: string, // e.g., "follow", "login", "like"
    title: string,
    message: string
  }
  ```

**Step 2: Publish to RabbitMQ**
- **Event Source Service** uses RabbitMQ ClientProxy
- Emits message to `notification_queue`:
  ```typescript
  client.emit('create_notification', notificationPayload)
  ```
- Queue configuration:
  - Queue name: `notification_queue`
  - Durable: `true` (persists across broker restarts)
  - Message pattern: `create_notification`
- Message is queued asynchronously

**Step 3: RabbitMQ Message Consumption**
- **Notification Service** is configured as RabbitMQ microservice
- **RabbitMQController** receives message via `@MessagePattern('create_notification')`
- Controller calls `RabbitMQInfrastructure.processCreateNotificationRequest()`
- Metrics recorded: `queue.message.consumed`

**Step 4: Create Notification in MongoDB**
- **NotificationService.create()** is called with notification DTO
- Creates new notification document:
  ```javascript
  {
    user_id: ObjectId,
    type: string,
    title: string,
    message: string,
    delivered: false,
    read: false,
    createdAt: Date,
    updatedAt: Date
  }
  ```
- Saves to MongoDB `notifications` collection
- Metrics recorded: `notification.created` (status: success/failed)
- Returns saved notification document

**Step 5: Check User WebSocket Connection**
- **NotificationGateway.sendNotificationToUser()** is called
- Checks if user is connected via WebSocket:
  - Queries Redis for active socket connections
  - Checks local `connections` Map (in-memory)
  - Uses `isUserConnected(userId)` method
- If user is NOT connected:
  - Logs warning: "User not connected via WebSocket"
  - Records metric: `websocket.message.failed` (reason: user_not_connected)
  - Returns `false` (notification stored but not delivered in real-time)
  - Notification remains in MongoDB for later retrieval via REST API

**Step 6: Send via WebSocket (If Connected)**
- If user IS connected:
  - Gets user room: `user_${userId}`
  - Constructs WebSocket message:
    ```typescript
    {
      event: 'notification_received',
      data: {
        id: string,
        user_id: string,
        type: string,
        title: string,
        message: string,
        delivered: boolean,
        read: boolean,
        createdAt: Date,
        updatedAt: Date
      },
      timestamp: Date,
      userId: string
    }
    ```
  - Emits to all sockets in user's room:
    ```typescript
    this.server.to(userRoom).emit('notification_received', message)
    ```
  - Records metrics:
    - `websocket.message.duration` (timing)
    - `websocket.message.sent` (increment)
  - Returns `true` (delivered successfully)

**Step 7: Mark as Delivered (Optional)**
- If WebSocket delivery successful, notification can be marked as `delivered: true`
- Updates `delivered_at` timestamp in MongoDB

**Step 8: REST API Fallback**
- If user was offline during Step 5:
  - User can retrieve notifications via REST API:
    ```
    GET /notifications?page=0&limit=10
    ```
  - **NotificationService.getUserNotifications()** queries MongoDB
  - Returns paginated list sorted by `createdAt` (newest first)
  - User can mark notifications as read via:
    ```
    POST /notifications/:id/read
    ```

**Step 9: Mark as Read**
- User marks notification as read (via WebSocket or REST API)
- **NotificationService.markAsRead()** updates MongoDB:
  ```javascript
  {
    read: true,
    read_at: new Date()
  }
  ```
- If via WebSocket: Client emits `mark_notification_read` event
- Gateway handles event and updates database
- Records metric: `notification.read`

**Step 10: Push Undelivered Notifications on Reconnect**
- When user reconnects via WebSocket:
  - **NotificationGateway.handleConnection()** is called
  - Calls `notificationPushService.pushUndeliveredNotifications()`
  - Queries MongoDB for undelivered notifications (`delivered: false`)
  - Sends all undelivered notifications via WebSocket
  - Marks as delivered after successful push

---

### Error Paths to Include:
1. **RabbitMQ Connection Failure**: Log error, message may be lost (if not durable)
2. **MongoDB Save Failure**: Log error, record metric `notification.created` (status: failed), throw error
3. **WebSocket Send Failure**: Notification still saved in MongoDB, user can retrieve via REST API
4. **User Not Connected**: Notification queued in MongoDB, delivered on next connection
5. **Redis Connection Failure**: Falls back to local in-memory connection tracking

---

### Technical Details to Highlight:
- **Queue Durability**: Queue is durable, messages persist across broker restarts
- **Message Pattern**: Uses NestJS `@MessagePattern` decorator for RabbitMQ consumption
- **WebSocket Rooms**: Users are joined to personal rooms (`user_${userId}`) for targeted delivery
- **Connection Tracking**: Uses both Redis (for scalability) and in-memory Map (for performance)
- **Metrics**: Comprehensive Datadog metrics for queue consumption, processing duration, WebSocket delivery
- **Idempotency**: Notification creation is idempotent (can be safely retried)

---

### Diagram Annotations:
- Show RabbitMQ queue as a message broker component
- Indicate durable queue with persistence icon
- Show WebSocket connection as bidirectional arrow
- Highlight Redis for connection tracking
- Show MongoDB as persistent storage
- Include REST API as fallback path
- Annotate metrics collection points

---

## 2. Email Processing Flow

**Purpose**: Illustrates the asynchronous email processing workflow from job creation through template rendering to SMTP delivery.

**Diagram Types Recommended**:
- **Sequence Diagram** (Primary): Shows the chronological flow from request to delivery
- **Flowchart** (Secondary): Shows decision points (template selection, retry logic, DLQ handling)

---

### Sequence Diagram: Email Processing Flow

#### Actors/Components to Include:
1. **Requesting Service** (Auth Service, User Service, etc.)
2. **RabbitMQ** (Port 5672)
   - Queue: `email_queue`
   - Pattern: `email_request`
3. **Email Worker Service** (Port 4003)
   - EmailWorkerController (MessagePattern handler)
   - RabbitMQService (message processor)
   - EmailService (template rendering and SMTP delivery)
4. **Email Templates** (in-memory template engine)
5. **SMTP Server** (External)
   - Configuration: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
6. **Dead Letter Queue (DLQ)** (RabbitMQ, optional)

---

### Detailed Flow Steps:

**Step 1: Email Request Generation**
- **Requesting Service** (e.g., Auth Service, User Service) needs to send an email
- Example scenarios:
  - User registration → Email verification code
  - Password reset → Password reset code
  - Email change → New email verification code
  - Device trust → Device verification code
  - Welcome message → Welcome email
- Constructs email request DTO:
  ```typescript
  {
    type: string, // e.g., "create-account", "forgot-password-verify", "email-change-verify"
    data: {
      email: string,
      otpCode?: string, // for verification emails
      // ... other template-specific data
    }
  }
  ```

**Step 2: Publish to RabbitMQ**
- **Requesting Service** uses RabbitMQ ClientProxy
- Emits message to `email_queue`:
  ```typescript
  client.emit('email_request', emailRequestDto)
  ```
- Queue configuration:
  - Queue name: `email_queue`
  - Durable: `true`
  - Message pattern: `email_request`
- Message is queued asynchronously (non-blocking)

**Step 3: RabbitMQ Message Consumption**
- **Email Worker Service** is configured as RabbitMQ microservice
- **EmailWorkerController** receives message via `@MessagePattern('email_request')`
- Controller calls `RabbitMQService.processEmailRequest()`
- Records metric: `queue.message.consumed` (queue_name: email_queue, message_type: request.type)

**Step 4: Process Email Request**
- **RabbitMQService.processEmailRequest()** calls `EmailService.sendEmail()`
- Records processing start time for duration metrics

**Step 5: Extract Recipient Email**
- **EmailService.getEmailFromRequest()** extracts recipient email based on request type:
  ```typescript
  switch (request.type) {
    case 'create-account':
    case 'forgot-password-verify':
    case 'email-change-verify':
    case 'new-email-change-verify':
      return request.data.email;
    default:
      return 'unknown';
  }
  ```

**Step 6: Select Email Template**
- **EmailService.getEmailTemplate()** selects template based on request type:
  ```typescript
  switch (request.type) {
    case 'create-account':
      return EmailTemplates.createAccount(email, otpCode);
    case 'welcome-message':
      return EmailTemplates.welcomeMessage(email);
    case 'fingerprint-verify':
      return EmailTemplates.fingerprintVerify(email, otpCode);
    case 'forgot-password-verify':
      return EmailTemplates.forgotPasswordVerify(email, otpCode);
    case 'username-change-verify':
      return EmailTemplates.usernameChangeVerify(email, otpCode);
    case 'email-change-verify':
      return EmailTemplates.emailChangeVerify(email, otpCode);
    case 'new-email-change-verify':
      return EmailTemplates.newEmailChangeVerify(email, otpCode);
    default:
      throw new Error('Unknown email type');
  }
  ```
- Template returns object with:
  ```typescript
  {
    subject: string,
    html: string,
    text: string
  }
  ```

**Step 7: Render Email Content**
- Template engine renders HTML and plain text content
- Variables are interpolated (e.g., `{email}`, `{otpCode}`)
- Email is ready for sending

**Step 8: Initialize SMTP Transporter**
- **EmailService** uses Nodemailer with SMTP configuration:
  ```typescript
  {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  }
  ```
- Transporter is initialized on service creation
- Connection is verified via `transporter.verify()`

**Step 9: Send Email via SMTP**
- **EmailService.sendEmailWithTemplate()** constructs mail options:
  ```typescript
  {
    from: SMTP_USER,
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  }
  ```
- Calls `transporter.sendMail(mailOptions)`
- SMTP server processes and delivers email

**Step 10: Record Success Metrics**
- If email sent successfully:
  - Records timing: `email.processing.duration` (status: success)
  - Records increment: `email.sent` (status: success, email_type: request.type)
  - Records increment: `email.template.used` (email_type: request.type, template: request.type)
  - Records increment: `queue.message.processing.duration` (queue_name: email_queue)
  - Logs success message

**Step 11: Handle Errors (If Any)**
- If email sending fails:
  - Records timing: `email.processing.duration` (status: failed)
  - Records increment: `email.failed` (status: failed, email_type: request.type)
  - Records increment: `queue.message.failed` (queue_name: email_queue)
  - Logs error with stack trace
  - Throws error (may trigger retry or DLQ)

**Step 12: Retry Logic (If Configured)**
- RabbitMQ can be configured with retry logic:
  - Max retries: 3 (configurable)
  - Retry delay: exponential backoff
  - After max retries: message sent to Dead Letter Queue (DLQ)

**Step 13: Dead Letter Queue (DLQ) Handling**
- Failed messages after max retries are sent to DLQ
- DLQ messages can be:
  - Manually reprocessed
  - Analyzed for patterns
  - Alerted to operations team

---

### Error Paths to Include:
1. **RabbitMQ Connection Failure**: Log error, message may be lost (if not durable)
2. **Template Selection Failure**: Unknown email type → throws error, message fails
3. **SMTP Connection Failure**: Transporter verification fails → throws error, retry
4. **SMTP Authentication Failure**: Invalid credentials → throws error, retry
5. **Email Delivery Failure**: Invalid recipient, server rejection → throws error, retry
6. **Max Retries Exceeded**: Message sent to DLQ, alert operations

---

### Technical Details to Highlight:
- **Queue Durability**: Queue is durable, messages persist across broker restarts
- **Template Engine**: In-memory template rendering (no external service)
- **SMTP Configuration**: Environment-based (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- **Email Types**: 7 different email types with specific templates
- **Metrics**: Comprehensive Datadog metrics for queue consumption, processing duration, email delivery
- **Retry Mechanism**: Configurable retry with exponential backoff
- **DLQ**: Dead Letter Queue for failed messages after max retries

---

### Email Types to Document:
1. **create-account**: User registration email verification
2. **welcome-message**: Welcome email after successful registration
3. **fingerprint-verify**: Device fingerprint verification
4. **forgot-password-verify**: Password reset verification
5. **username-change-verify**: Username change verification
6. **email-change-verify**: Email change verification (old email)
7. **new-email-change-verify**: Email change verification (new email)

---

### Diagram Annotations:
- Show RabbitMQ queue as a message broker component
- Indicate durable queue with persistence icon
- Show template selection as a decision diamond
- Highlight SMTP server as external service
- Show DLQ as separate queue
- Include retry loop with max retry limit
- Annotate metrics collection points

---

## 3. MongoDB to Neo4j Synchronization Flow

**Purpose**: Shows how user data is synchronized from MongoDB (document database) to Neo4j (graph database) for relationship queries.

**Diagram Types Recommended**:
- **Sequence Diagram** (Primary): Shows the chronological flow from event trigger to Neo4j update
- **Flowchart** (Secondary): Shows decision points (user exists check, create vs update)

---

### Sequence Diagram: MongoDB to Neo4j Synchronization Flow

#### Actors/Components to Include:
1. **Event Source Services** (User Service, API Gateway)
2. **RabbitMQ** (Port 5672)
   - Queue: `neo4j_sync_queue`
   - Patterns: `create_user_request`, `update_user_request`
3. **Neo4j Sync Service** (Port 4006)
   - Neo4jdbSyncController (MessagePattern handlers)
   - RabbitMQInfrastructure (message processor)
   - UserSyncService (sync logic)
   - Neo4jInfrastructure (Cypher query executor)
4. **MongoDB** (Port 27017)
   - Collection: `users` (source of truth)
5. **Neo4j** (Port 7687)
   - Graph database (target for sync)
   - Node label: `User`
   - Properties: `user_id`, `username`, `role`, `display_name`, `avatar_ipfs_hash`, `following_number`, `followers_number`

---

### Detailed Flow Steps:

**Step 1: User Lifecycle Event**
- **Event Source Service** (User Service or API Gateway) detects user data change
- Example scenarios:
  - User registration → New user created in MongoDB
  - User profile update → Display name, avatar, username changed
  - User profile fetch → API Gateway detects Neo4j inconsistency
- User document structure (from MongoDB):
  ```typescript
  {
    _id: ObjectId,
    username: string,
    email: string,
    role: string,
    display_name: string,
    avatar_ipfs_hash: string,
    // ... other fields
  }
  ```

**Step 2: Emit Sync Request to RabbitMQ**
- **Event Source Service** uses RabbitMQ ClientProxy
- For new user: Emits `create_user_request` pattern
- For user update: Emits `update_user_request` pattern
- Example from API Gateway:
  ```typescript
  await this.neo4jdbUpdateUserService
    .emit('create_user_request', user)
    .toPromise();
  ```
- Queue configuration:
  - Queue name: `neo4j_sync_queue`
  - Durable: `true`
  - Message patterns: `create_user_request`, `update_user_request`

**Step 3: RabbitMQ Message Consumption**
- **Neo4j Sync Service** is configured as RabbitMQ microservice
- **Neo4jdbSyncController** receives message:
  - `@MessagePattern('create_user_request')` → calls `createUser()`
  - `@MessagePattern('update_user_request')` → calls `updateUser()`
- Controller calls `RabbitMQInfrastructure.processCreateUserRequest()` or `processUpdateUserRequest()`
- Records metric: `queue.message.consumed` (queue_name: neo4j_sync_queue, message_type: create_user/update_user)

**Step 4: Process Sync Request**
- **RabbitMQInfrastructure** calls `UserSyncService.createUser()` or `UserSyncService.updateUser()`
- Records processing start time for duration metrics

**Step 5: Check User Existence in Neo4j**
- **UserSyncService** calls `Neo4jInfrastructure.findUserNode(user_id)`
- **Neo4jInfrastructure** executes Cypher query:
  ```cypher
  MATCH (u:User {user_id: $user_id})
  RETURN u
  ```
- Returns `true` if user exists, `false` if not found

**Step 6A: Create User Flow (If Not Exists)**
- If user does NOT exist in Neo4j:
  - **UserSyncService.createUser()** is called
  - Calls `Neo4jInfrastructure.createUserNode(user)`
  - **Neo4jInfrastructure** executes Cypher CREATE query:
    ```cypher
    CREATE (u:User {
      user_id: $user_id,
      username: $username,
      role: $role,
      display_name: $display_name,
      avatar_ipfs_hash: $avatar_ipfs_hash,
      following_number: 0,
      followers_number: 0
    })
    ```
  - User node is created in Neo4j graph
  - Records metrics:
    - `sync.duration` (operation: createUser, status: success)
    - `sync.user.created` (operation: createUser, status: success, sync_type: user_creation)
  - Returns success response

**Step 6B: Update User Flow (If Exists)**
- If user EXISTS in Neo4j:
  - **UserSyncService.updateUser()** is called
  - Calls `Neo4jInfrastructure.updateUserNode(user)`
  - **Neo4jInfrastructure** executes Cypher UPDATE query:
    ```cypher
    MATCH (u:User {user_id: $user_id})
    SET u.username = $username,
        u.role = $role,
        u.display_name = $display_name,
        u.avatar_ipfs_hash = $avatar_ipfs_hash
    ```
  - User node properties are updated in Neo4j
  - Records metrics:
    - `sync.duration` (operation: updateUser, status: success)
    - `sync.user.updated` (operation: updateUser, status: success, sync_type: user_update)
  - Returns success response

**Step 7: Handle Update When User Doesn't Exist**
- If `updateUser()` is called but user doesn't exist:
  - **UserSyncService.updateUser()** detects missing user
  - Automatically calls `createUser()` instead
  - Creates user node (same as Step 6A)
  - Returns create response

**Step 8: Consistency Validation (Optional)**
- After sync, system can validate consistency:
  - Compare MongoDB user document with Neo4j user node
  - Check property values match
  - Log inconsistencies for investigation

**Step 9: Error Handling**
- If Neo4j operation fails:
  - Records metrics:
    - `sync.duration` (status: failed)
    - `sync.user.created/updated` (status: failed)
    - `sync.errors` (operation: createUser/updateUser)
  - Logs error with details
  - Returns error response
  - Message may be retried by RabbitMQ

**Step 10: Retry Logic (If Configured)**
- RabbitMQ can be configured with retry logic:
  - Max retries: 3 (configurable)
  - Retry delay: exponential backoff
  - After max retries: message sent to Dead Letter Queue (DLQ)

---

### Trigger Points for Sync:

**1. User Registration**
- User Service creates new user in MongoDB
- Emits `create_user_request` to RabbitMQ
- Neo4j Sync Service creates user node

**2. User Profile Update**
- User Service updates user in MongoDB (display_name, avatar, username)
- Emits `update_user_request` to RabbitMQ
- Neo4j Sync Service updates user node

**3. Profile Fetch with Inconsistency Detection**
- API Gateway fetches user profile
- Compares MongoDB user with Neo4j user node
- If differences detected (username, role, display_name, avatar_ipfs_hash):
  - Emits `update_user_request` to RabbitMQ
  - Waits 1 second for sync to complete
  - Re-fetches Neo4j user node

**4. Manual Sync Trigger**
- Admin or system can manually trigger sync
- Useful for:
  - Initial data migration
  - Recovery from sync failures
  - Bulk updates

---

### Error Paths to Include:
1. **RabbitMQ Connection Failure**: Log error, message may be lost (if not durable)
2. **Neo4j Connection Failure**: Driver initialization fails → throws error, retry
3. **User Already Exists (Create)**: Returns CONFLICT status, records metric (status: already_exists)
4. **User Not Found (Update)**: Automatically creates user instead
5. **Cypher Query Failure**: Invalid query syntax → throws error, retry
6. **Neo4j Transaction Failure**: Database constraint violation → throws error, retry
7. **Max Retries Exceeded**: Message sent to DLQ, alert operations

---

### Technical Details to Highlight:
- **Queue Durability**: Queue is durable, messages persist across broker restarts
- **Neo4j Driver**: Uses official Neo4j JavaScript driver with basic authentication
- **Cypher Queries**: Native Cypher queries for graph operations
- **User Node Properties**: Maps MongoDB user fields to Neo4j node properties
- **Metrics**: Comprehensive Datadog metrics for queue consumption, processing duration, sync operations
- **Idempotency**: Sync operations are idempotent (can be safely retried)
- **Consistency Check**: API Gateway can detect and trigger sync for inconsistencies
- **Automatic Create on Update**: If user doesn't exist during update, automatically creates user

---

### Neo4j User Node Schema:
```cypher
(:User {
  user_id: string,        // Primary identifier (matches MongoDB _id)
  username: string,       // User's username
  role: string,           // User's role (e.g., "user", "admin")
  display_name: string,   // User's display name
  avatar_ipfs_hash: string, // IPFS hash for avatar
  following_number: int,  // Number of users this user follows
  followers_number: int   // Number of users following this user
})
```

---

### MongoDB to Neo4j Field Mapping:
| MongoDB Field | Neo4j Property | Notes |
|--------------|----------------|-------|
| `_id` | `user_id` | Converted to string |
| `username` | `username` | Direct mapping |
| `role` | `role` | Direct mapping |
| `display_name` | `display_name` | Direct mapping |
| `avatar_ipfs_hash` | `avatar_ipfs_hash` | Direct mapping |
| N/A | `following_number` | Initialized to 0, updated by Relationship Service |
| N/A | `followers_number` | Initialized to 0, updated by Relationship Service |

---

### Diagram Annotations:
- Show RabbitMQ queue as a message broker component
- Indicate durable queue with persistence icon
- Show Neo4j as graph database with node visualization
- Highlight MongoDB as source of truth
- Show decision diamond for "User Exists?" check
- Include create vs update paths
- Show consistency check loop
- Annotate metrics collection points
- Show retry mechanism with max retry limit

---

## Summary

All three flows follow a similar asynchronous pattern:
1. **Event Generation**: Service detects event or receives request
2. **Message Publishing**: Event published to RabbitMQ queue
3. **Message Consumption**: Worker service consumes message from queue
4. **Processing**: Worker processes message (creates notification, sends email, syncs data)
5. **Storage/Delivery**: Result stored in database or delivered to external service
6. **Metrics & Logging**: Comprehensive observability throughout

Key architectural patterns:
- **Asynchronous Processing**: Non-blocking message queues
- **Durability**: Queues persist across broker restarts
- **Retry Logic**: Failed messages can be retried
- **Dead Letter Queues**: Failed messages after max retries
- **Observability**: Metrics and logging at every step
- **Idempotency**: Operations can be safely retried
