# Session Management, Device Management, and SSO Login Flow Diagrams

This document provides detailed step-by-step instructions for drawing session management, device management, and SSO login flow diagrams for the Decode Network Backend system.

---

## 1. SSO (Single Sign-On) Login Flow Diagram

### Overview
SSO allows users to authenticate once and access multiple applications without re-entering credentials. The SSO token is a short-lived, one-time-use token that enables seamless authentication across different applications.

### Diagram Types Required:
1. **Sequence Diagram** - Shows the complete SSO flow with all actors
2. **Flowchart** - Shows decision points and alternative paths

---

### Diagram 1A: SSO Login Flow - Sequence Diagram

#### Actors/Components to Include:
1. **User/Client** (Web/Mobile App)
2. **App A** (Source Application - where user is logged in)
3. **API Gateway** (Port 4000)
4. **Auth Service** (Port 4001)
5. **Device Fingerprint Service**
6. **Session Service**
7. **Redis** (Port 6379)
8. **MongoDB** (Port 27017)
9. **App B** (Target Application - where user wants to login)

#### Flow Steps:

**Step 1: User Initiates SSO from App A**
- **User** is already logged into **App A** with valid access token
- **User** clicks "Login with Decode" or similar SSO button in **App B**
- **App B** redirects to **App A** with SSO request

**Step 2: App A Requests SSO Token**
- **App A** sends POST request to `/auth/sso/create`
- Request includes:
  - `Authorization: Bearer <access_token>` (from App A session)
  - Body: `{ "app": "app-b", "fingerprint_hashed": "..." }`
- **API Gateway** receives request
- **API Gateway** validates access token via **AuthGuard**
- **API Gateway** forwards request to **Auth Service**

**Step 3: Validate User Authentication**
- **Auth Service** validates access token
- Extracts `user_id` from token payload
- Verifies user is authenticated and active

**Step 4: Get Device Fingerprint**
- **Auth Service** calls `DeviceFingerprintService.getDeviceFingerprint()`
- Query **MongoDB** device_fingerprints collection
- Search for: `user_id` + `fingerprint_hashed`
- If device fingerprint not found → return error
- If found, get `device_fingerprint_id`

**Step 5: Generate SSO Token**
- **Auth Service** calls `SsoService.createSsoToken()`
- Generate UUID-based SSO token (6 characters from UUID)
- Create SSO data structure:
  ```json
  {
    "user_id": "user123",
    "app": "app-b",
    "device_fingerprint_id": "device123"
  }
  ```

**Step 6: Store SSO Token in Redis**
- **Auth Service** stores SSO token in **Redis**
- Key format: `sso:{sso_token}`
- Value: JSON stringified SSO data
- TTL: 60 seconds (1 minute) - short-lived for security
- Purpose: Temporary storage until token is consumed

**Step 7: Return SSO Token to App A**
- **Auth Service** returns SSO token to **API Gateway**
- Response:
  ```json
  {
    "success": true,
    "data": "abc123"  // SSO token
  }
  ```
- **API Gateway** forwards response to **App A**

**Step 8: App A Redirects to App B with SSO Token**
- **App A** receives SSO token
- **App A** redirects **User** to **App B** with SSO token
- Redirect URL: `https://app-b.com/auth/callback?sso_token=abc123`

**Step 9: App B Validates SSO Token**
- **App B** receives SSO token from redirect
- **App B** sends POST request to `/auth/sso/validate`
- Request includes: `{ "sso_token": "abc123" }`
- **API Gateway** receives request
- **API Gateway** forwards to **Auth Service**

**Step 10: Validate and Consume SSO Token**
- **Auth Service** calls `SsoService.validateSsoToken()`
- Query **Redis** for SSO token: `sso:{sso_token}`
- If token not found or expired → return error "Invalid or expired SSO token"
- If found, extract SSO data:
  - `user_id`
  - `app`
  - `device_fingerprint_id`

**Step 11: Delete SSO Token from Redis**
- **Auth Service** deletes SSO token from **Redis** immediately
- Purpose: One-time use token (prevents replay attacks)
- Key deleted: `sso:{sso_token}`

**Step 12: Create Session for App B**
- **Auth Service** calls `SessionService.createSession()`
- Create session document in **MongoDB**:
  - `user_id`: From SSO data
  - `device_fingerprint_id`: From SSO data
  - `app`: "app-b" (from SSO data)
  - `session_token`: Generated JWT session token
  - `expires_at`: 30 days from now
  - `is_active`: true

**Step 13: Generate Access Token**
- **Auth Service** generates JWT access token
- Token includes: `user_id`, `email`, `username`, `role`, `session_token`
- Expires in: 15 minutes

**Step 14: Return Session Data to App B**
- **Auth Service** returns session data to **API Gateway**
- Response includes:
  ```json
  {
    "success": true,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "session_token": "session_token_here",
      "user": {
        "user_id": "user123",
        "email": "user@example.com",
        "username": "johndoe"
      }
    }
  }
  ```
- **API Gateway** forwards response to **App B**

**Step 15: App B Authenticates User**
- **App B** receives access token and session token
- **App B** stores tokens in client storage
- **User** is now logged into **App B** without entering credentials

### Error Paths:
1. **Invalid Access Token**: Return 401 error
2. **Device Fingerprint Not Found**: Return error, user may need to verify device
3. **SSO Token Expired**: Return error, user needs to request new SSO token
4. **SSO Token Already Used**: Return error (token deleted after first use)
5. **Session Creation Failed**: Return error, log for investigation

---

### Diagram 1B: SSO Login Flow - Flowchart

#### Flowchart Steps:

**Start**: User clicks "Login with Decode" in App B

**Decision 1**: Is user logged into App A?
- **No** → Redirect to login page → End
- **Yes** → Continue

**Process 1**: App A requests SSO token from Auth Service

**Decision 2**: Is access token valid?
- **No** → Return error → End
- **Yes** → Continue

**Process 2**: Get device fingerprint

**Decision 3**: Device fingerprint found?
- **No** → Return error → End
- **Yes** → Continue

**Process 3**: Generate SSO token (UUID)

**Process 4**: Store SSO token in Redis (TTL: 60 seconds)

**Process 5**: Return SSO token to App A

**Process 6**: App A redirects to App B with SSO token

**Process 7**: App B validates SSO token

**Decision 4**: SSO token valid and not expired?
- **No** → Return error → End
- **Yes** → Continue

**Process 8**: Delete SSO token from Redis (one-time use)

**Process 9**: Create session for App B

**Process 10**: Generate access token

**Process 11**: Return tokens to App B

**End**: User logged into App B

---

## 2. Session Management Flow Diagrams

### Overview
Session management allows users to view, manage, and revoke their active sessions across different devices and applications.

### Diagram Types Required:
1. **Sequence Diagram** - Get active sessions and revoke session flows
2. **State Diagram** - Session lifecycle states

---

### Diagram 2A: Get Active Sessions - Sequence Diagram

#### Actors/Components to Include:
1. **User/Client**
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
4. **Session Service**
5. **MongoDB** (Port 27017)

#### Flow Steps:

**Step 1: User Requests Active Sessions**
- **User** sends GET request to `/auth/session/active`
- Request includes: `Authorization: Bearer <access_token>`
- **API Gateway** receives request
- **API Gateway** validates access token via **AuthGuard**
- Extracts `user_id` from token

**Step 2: Query Active Sessions**
- **API Gateway** forwards request to **Auth Service**
- **Auth Service** calls `SessionService.getUserActiveSessions(user_id)`
- **Session Service** queries **MongoDB** sessions collection:
  ```javascript
  {
    $and: [
      { user_id: user_id },
      { is_active: true },
      { revoked_at: null }
    ]
  }
  ```

**Step 3: Filter Valid Sessions**
- **Session Service** filters sessions:
  - `is_active = true`
  - `revoked_at = null`
  - `expires_at > now()`
- Returns array of active session documents

**Step 4: Format Session Data**
- **Session Service** formats each session:
  - Session ID
  - Device information (from device_fingerprint_id)
  - App name
  - Created at timestamp
  - Last used at timestamp
  - Expires at timestamp
  - IP address (if available)

**Step 5: Return Active Sessions**
- **Session Service** returns sessions array
- **Auth Service** forwards response to **API Gateway**
- **API Gateway** returns to **User**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "session1",
        "app": "Decode",
        "device": "iPhone 12",
        "browser": "Safari 14",
        "createdAt": "2024-01-01T00:00:00Z",
        "last_used_at": "2024-01-15T10:30:00Z",
        "expires_at": "2024-01-31T00:00:00Z"
      },
      {
        "_id": "session2",
        "app": "app-b",
        "device": "Windows 10",
        "browser": "Chrome 120",
        "createdAt": "2024-01-10T00:00:00Z",
        "last_used_at": "2024-01-15T09:15:00Z",
        "expires_at": "2024-02-09T00:00:00Z"
      }
    ]
  }
  ```

---

### Diagram 2B: Revoke Session - Sequence Diagram

#### Actors/Components to Include:
1. **User/Client**
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
4. **Session Service**
5. **MongoDB** (Port 27017)
6. **Redis** (Port 6379) - Optional cache invalidation

#### Flow Steps:

**Step 1: User Requests Session Revocation**
- **User** sends POST request to `/auth/session/revoke`
- Request includes:
  - `Authorization: Bearer <access_token>`
  - Body: `{ "session_id": "session123" }`
- **API Gateway** receives request
- **API Gateway** validates access token via **AuthGuard**
- Extracts `user_id` from token

**Step 2: Validate Session Ownership**
- **API Gateway** forwards request to **Auth Service**
- **Auth Service** calls `SessionService.revokeSessionBySessionId()`
- **Session Service** queries **MongoDB** to verify:
  - Session exists
  - Session belongs to the user (`user_id` matches)
  - Session is currently active

**Step 3: Revoke Session**
- **Session Service** updates session document in **MongoDB**:
  ```javascript
  {
    $set: {
      is_active: false,
      revoked_at: new Date()
    }
  }
  ```
- Session is marked as revoked

**Step 4: Invalidate Cache (If Applicable)**
- If session was cached in **Redis**, delete cache entry
- Key format: `session:{session_token}` or similar

**Step 5: Return Success Response**
- **Session Service** returns success response
- **Auth Service** forwards to **API Gateway**
- **API Gateway** returns to **User**:
  ```json
  {
    "success": true,
    "message": "Session revoked successfully"
  }
  ```

**Step 6: Future Token Validation**
- When revoked session token is used:
  - **AuthGuard** validates access token
  - **Auth Service** checks session in **MongoDB**
  - Session found with `is_active = false` or `revoked_at != null`
  - Returns 401 Unauthorized error

### Error Paths:
1. **Session Not Found**: Return 404 error
2. **Session Doesn't Belong to User**: Return 403 Forbidden
3. **Session Already Revoked**: Return success (idempotent operation)
4. **Database Update Failed**: Return 500 error

---

### Diagram 2C: Session Lifecycle - State Diagram

#### States:
1. **Created** - Session just created
2. **Active** - Session is active and valid
3. **Expired** - Session has passed expiration time
4. **Revoked** - Session manually revoked by user
5. **Terminated** - Session cleaned up

#### State Transitions:

**Created → Active**
- Trigger: Session created successfully
- Condition: `is_active = true`, `revoked_at = null`, `expires_at > now()`

**Active → Active**
- Trigger: Token refresh or request with valid token
- Action: Update `last_used_at` timestamp

**Active → Expired**
- Trigger: Time-based expiration
- Condition: `expires_at < now()`
- Action: Automatic cleanup (or on next validation)

**Active → Revoked**
- Trigger: User revokes session
- Action: Set `is_active = false`, `revoked_at = new Date()`

**Expired → Terminated**
- Trigger: Cleanup job
- Action: Delete or archive session

**Revoked → Terminated**
- Trigger: Cleanup job
- Action: Delete or archive session

---

## 3. Device Management Flow Diagrams

### Overview
Device management allows users to view and revoke trusted devices. Revoking a device automatically revokes all sessions associated with that device.

### Diagram Types Required:
1. **Sequence Diagram** - Get devices and revoke device flows
2. **Flowchart** - Device revocation decision flow

---

### Diagram 3A: Get Device Fingerprints - Sequence Diagram

#### Actors/Components to Include:
1. **User/Client**
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
4. **Device Fingerprint Service**
5. **Session Service**
6. **MongoDB** (Port 27017)

#### Flow Steps:

**Step 1: User Requests Device List**
- **User** sends GET request to `/auth/fingerprints`
- Request includes: `Authorization: Bearer <access_token>`
- **API Gateway** receives request
- **API Gateway** validates access token via **AuthGuard**
- Extracts `user_id` from token

**Step 2: Query Trusted Devices**
- **API Gateway** forwards request to **Auth Service**
- **Auth Service** calls `DeviceFingerprintService.getDeviceFingerprints()`
- **Device Fingerprint Service** queries **MongoDB** device_fingerprints collection:
  ```javascript
  {
    $and: [
      { user_id: user_id },
      { is_trusted: true }
    ]
  }
  ```
- Returns array of trusted device fingerprints

**Step 3: Get Active Sessions for Each Device**
- **Device Fingerprint Service** calls `SessionService.getUserActiveSessions(user_id)`
- Gets all active sessions for the user
- Matches sessions to devices by `device_fingerprint_id`

**Step 4: Combine Device and Session Data**
- For each device fingerprint:
  - Device information (device, browser, fingerprint_hashed)
  - Associated active sessions
  - Device creation timestamp
  - Last session activity timestamp

**Step 5: Return Device List**
- **Device Fingerprint Service** returns combined data
- **Auth Service** forwards to **API Gateway**
- **API Gateway** returns to **User**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "device1",
        "device": "iPhone 12",
        "browser": "Safari 14",
        "fingerprint_hashed": "abc123...",
        "is_trusted": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "sessions": [
          {
            "_id": "session1",
            "app": "Decode",
            "last_used_at": "2024-01-15T10:30:00Z"
          }
        ]
      },
      {
        "_id": "device2",
        "device": "Windows 10",
        "browser": "Chrome 120",
        "fingerprint_hashed": "def456...",
        "is_trusted": true,
        "createdAt": "2024-01-10T00:00:00Z",
        "sessions": [
          {
            "_id": "session2",
            "app": "app-b",
            "last_used_at": "2024-01-15T09:15:00Z"
          }
        ]
      }
    ]
  }
  ```

---

### Diagram 3B: Revoke Device Fingerprint - Sequence Diagram

#### Actors/Components to Include:
1. **User/Client**
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
4. **Device Fingerprint Service**
5. **Session Service**
6. **MongoDB** (Port 27017)
7. **Redis** (Port 6379) - Optional cache invalidation

#### Flow Steps:

**Step 1: User Requests Device Revocation**
- **User** sends POST request to `/auth/fingerprints/revoke`
- Request includes:
  - `Authorization: Bearer <access_token>`
  - Body: `{ "device_fingerprint_id": "device123" }`
- **API Gateway** receives request
- **API Gateway** validates access token via **AuthGuard**
- Extracts `user_id` from token

**Step 2: Validate Device Ownership**
- **API Gateway** forwards request to **Auth Service**
- **Auth Service** calls `DeviceFingerprintService.revokeDeviceFingerprint()`
- **Device Fingerprint Service** queries **MongoDB** to verify:
  - Device fingerprint exists
  - Device belongs to the user (`user_id` matches)
  - Device is currently trusted (`is_trusted = true`)

**Step 3: Revoke Device Fingerprint**
- **Device Fingerprint Service** updates device fingerprint in **MongoDB**:
  ```javascript
  {
    $set: {
      is_trusted: false
    }
  }
  ```
- Device is marked as untrusted

**Step 4: Revoke All Sessions for Device**
- **Device Fingerprint Service** calls `SessionService.revokeSessionByDeviceFingerprintId()`
- **Session Service** updates all sessions for this device in **MongoDB**:
  ```javascript
  {
    $set: {
      is_active: false,
      revoked_at: new Date()
    }
  }
  ```
- Query: `{ device_fingerprint_id: device_fingerprint_id }`
- All sessions associated with this device are revoked

**Step 5: Invalidate Caches**
- If sessions were cached in **Redis**, delete cache entries
- Clear any device-related caches

**Step 6: Return Success Response**
- **Device Fingerprint Service** returns success response
- **Auth Service** forwards to **API Gateway**
- **API Gateway** returns to **User**:
  ```json
  {
    "success": true,
    "message": "Device fingerprint revoked successfully"
  }
  ```

**Step 7: Future Login Attempts**
- When user tries to login from revoked device:
  - Device fingerprint check finds `is_trusted = false`
  - User must verify device again via email
  - New device fingerprint created or existing one re-trusted

### Error Paths:
1. **Device Not Found**: Return 404 error
2. **Device Doesn't Belong to User**: Return 403 Forbidden
3. **Device Already Revoked**: Return success (idempotent operation)
4. **Session Revocation Failed**: Log error but continue (device still revoked)

---

### Diagram 3C: Device Revocation - Flowchart

#### Flowchart Steps:

**Start**: User clicks "Revoke Device" for a specific device

**Decision 1**: Is user authenticated?
- **No** → Return 401 Unauthorized → End
- **Yes** → Continue

**Process 1**: Validate device fingerprint ownership

**Decision 2**: Device exists and belongs to user?
- **No** → Return 404 Not Found → End
- **Yes** → Continue

**Decision 3**: Is device currently trusted?
- **No** → Return success (already revoked) → End
- **Yes** → Continue

**Process 2**: Set `is_trusted = false` in MongoDB

**Process 3**: Find all sessions for this device

**Process 4**: Revoke all sessions (set `is_active = false`, `revoked_at = now()`)

**Decision 4**: Session revocation successful?
- **No** → Log error but continue
- **Yes** → Continue

**Process 5**: Invalidate caches (Redis)

**Process 6**: Return success response

**End**: Device revoked, all sessions terminated

---

## 4. Complete Session and Device Management State Diagram

### Overview
Shows the complete lifecycle of sessions and devices and their relationships.

### Diagram Type: **State Diagram with Swimlanes**

#### Swimlanes:
1. **Device Fingerprint Lifecycle**
2. **Session Lifecycle**
3. **User Actions**

#### States and Transitions:

**Device Fingerprint States:**
- **Untrusted** → Created but not verified
- **Trusted** → Verified and active
- **Revoked** → User revoked device

**Session States:**
- **Created** → Session just created
- **Active** → Session is active
- **Revoked** → Session revoked
- **Expired** → Session expired

**Transitions:**
- **Device: Untrusted → Trusted**: Email verification successful
- **Device: Trusted → Revoked**: User revokes device
- **Session: Created → Active**: Session validated
- **Session: Active → Revoked**: User revokes session OR device revoked
- **Session: Active → Expired**: Time-based expiration
- **Device: Revoked → All Sessions: Revoked**: Cascade revocation

---

## Diagram Creation Guidelines

### Recommended Tools:
- **Sequence Diagrams**: PlantUML, Mermaid, Draw.io, Lucidchart
- **Flowcharts**: Draw.io, Lucidchart, Miro
- **State Diagrams**: PlantUML, Mermaid, Draw.io

### Color Coding Standards:
- **Blue**: Normal operations, data flow
- **Green**: Success operations, valid states
- **Red**: Error paths, invalid operations
- **Yellow**: Validation/verification steps
- **Orange**: Revocation/termination operations
- **Purple**: Token generation/validation
- **Gray**: Infrastructure components (Redis, MongoDB)

### Symbols to Use:
- **Rectangle**: Process/Service
- **Diamond**: Decision point
- **Cylinder**: Database
- **Cloud**: External service
- **Arrow**: Data flow
- **Dashed Arrow**: Async operation or optional flow
- **Double Arrow**: Request/Response pair
- **Note/Sticky Note**: Additional information
- **State Box**: State in state diagram
- **Transition Arrow**: State transition

### Information to Include:
- Port numbers for all services
- HTTP methods and endpoints
- Request/response payloads (simplified)
- Error codes and messages
- Timing information (TTL, expiry)
- Database collection names
- Redis key formats
- Token structures
- State conditions

### Best Practices:
1. Start with high-level flow, then add details
2. Show all error paths clearly
3. Include retry mechanisms where applicable
4. Show parallel operations where applicable
5. Use consistent naming conventions
6. Add legends for symbols and colors
7. Include version information
8. Document assumptions and constraints
9. Show cascade effects (device revocation → session revocation)
10. Include timing information (TTL values, expiration)

---

## Summary of Diagrams to Create

### SSO Login Flow:
1. **Sequence Diagram**: Complete SSO flow from App A to App B
2. **Flowchart**: Decision points and alternative paths

### Session Management:
1. **Sequence Diagram**: Get active sessions flow
2. **Sequence Diagram**: Revoke session flow
3. **State Diagram**: Session lifecycle states

### Device Management:
1. **Sequence Diagram**: Get device fingerprints flow
2. **Sequence Diagram**: Revoke device fingerprint flow
3. **Flowchart**: Device revocation decision flow

### Combined:
1. **State Diagram with Swimlanes**: Complete session and device lifecycle

**Total: 8 diagrams** to fully document these features

---

**Last Updated**: 2024
**Maintained By**: Decode Development Team
