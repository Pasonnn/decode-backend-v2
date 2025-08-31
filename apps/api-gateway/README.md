# API Gateway - Auth Module

This module provides authentication endpoints that proxy requests to the Auth microservice.

## Endpoints

### Authentication

#### POST `/auth/login`
Authenticate user with email/username and password.

**Request Body:**
```json
{
  "email_or_username": "user@example.com",
  "password": "SecurePassword123!",
  "fingerprint_hashed": "abc123def456..."
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "session_token": "session_token_here",
    "user": {
      "_id": "user_id",
      "username": "username",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### POST `/auth/login/fingerprint/email-verification`
Verify device fingerprint through email verification.

**Request Body:**
```json
{
  "code": "123456"
}
```

#### POST `/auth/register`
Register new user with email verification.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePassword123!"
}
```

#### POST `/auth/register/verify-email`
Verify email for registration.

**Request Body:**
```json
{
  "code": "123456"
}
```

#### POST `/auth/refresh`
Refresh session token.

**Request Body:**
```json
{
  "session_token": "session_token_here"
}
```

#### POST `/auth/logout`
Logout user (requires authentication).

**Request Body:**
```json
{
  "session_token": "session_token_here"
}
```

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User information retrieved successfully",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  }
}
```

#### GET `/auth/validate`
Validate access token.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Session Management

#### GET `/auth/sessions/active`
Get active sessions for current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/auth/sessions/revoke-all`
Revoke all sessions for current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/auth/sessions/validate-access`
Validate access token with detailed response.

**Request Body:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/auth/sessions/sso`
Create SSO token for current user (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/auth/sessions/sso/validate`
Validate SSO token.

**Request Body:**
```json
{
  "sso_token": "sso_token_here"
}
```

### Password Management

#### POST `/auth/password/change`
Change user password (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

#### POST `/auth/password/forgot/initiate`
Initiate forgot password process (sends email verification) - **Requires authentication**.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/auth/password/forgot/verify-email`
Verify email for forgot password process - **Requires authentication**.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "code": "123456"
}
```

#### POST `/auth/password/forgot/change`
Change password using forgot password flow - **Requires authentication**.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "code": "123456",
  "new_password": "NewPassword123!"
}
```

## Environment Variables

Make sure to set these environment variables:

```env
# API Gateway
API_GATEWAY_PORT=4000
API_GATEWAY_HOST=0.0.0.0

# Auth Service
AUTH_HOST=http://localhost
AUTH_PORT=4001

# Other services...
EMAIL_HOST=http://localhost
EMAIL_PORT=4003
USER_HOST=http://localhost
USER_PORT=4002
RELATIONSHIP_HOST=http://localhost
RELATIONSHIP_PORT=4004
WALLET_HOST=http://localhost
WALLET_PORT=4005

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars

# Cache
CACHE_TTL=300
```

## Running the Service

```bash
# Development
npm run start:dev api-gateway

# Production
npm run build api-gateway
npm run start:prod api-gateway
```

## Testing

The service includes comprehensive error handling and logging. All endpoints return standardized responses with proper HTTP status codes.

### Example Usage with curl

```bash
# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "user@example.com",
    "password": "SecurePassword123!",
    "fingerprint_hashed": "abc123def456..."
  }'

# Get user info (with token from login)
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get active sessions
curl -X GET http://localhost:4000/auth/sessions/active \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Revoke all sessions
curl -X POST http://localhost:4000/auth/sessions/revoke-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create SSO token
curl -X POST http://localhost:4000/auth/sessions/sso \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Change password
curl -X POST http://localhost:4000/auth/password/change \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "OldPassword123!",
    "new_password": "NewPassword123!"
  }'

# Initiate forgot password
curl -X POST http://localhost:4000/auth/password/forgot/initiate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Endpoint Summary

### Authentication Required Endpoints
| Method | Endpoint | Description | User ID Source |
|--------|----------|-------------|----------------|
| `POST` | `/auth/logout` | User logout | From access token |
| `GET` | `/auth/me` | Get current user | From access token |
| `GET` | `/auth/sessions/active` | Get active sessions | From access token |
| `POST` | `/auth/sessions/revoke-all` | Revoke all sessions | From access token |
| `POST` | `/auth/sessions/sso` | Create SSO token | From access token |
| `POST` | `/auth/password/change` | Change password | From access token |
| `POST` | `/auth/password/forgot/initiate` | Initiate forgot password | From access token |
| `POST` | `/auth/password/forgot/verify-email` | Verify email for forgot password | From access token |
| `POST` | `/auth/password/forgot/change` | Change password via forgot flow | From access token |

### Public Endpoints (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/login/fingerprint/email-verification` | Verify device fingerprint |
| `POST` | `/auth/register` | User registration |
| `POST` | `/auth/register/verify-email` | Verify email |
| `POST` | `/auth/refresh` | Refresh token |
| `GET` | `/auth/validate` | Validate token |
| `POST` | `/auth/sessions/validate-access` | Validate access token |
| `POST` | `/auth/sessions/sso/validate` | Validate SSO token |
