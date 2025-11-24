# Authentication and Registration Flow Diagrams

This document provides detailed step-by-step instructions for drawing authentication and registration flow diagrams for the Decode Network Backend system.

---

## 1. User Registration Flow Diagram

### Overview
The registration flow is a two-step process: email verification followed by account creation. This ensures that only users with valid email addresses can create accounts.

### Diagram Type
**Sequence Diagram** (recommended) or **Flowchart**

### Step-by-Step Drawing Instructions

#### Actors/Components to Include:
1. **User/Client** (Web/Mobile App)
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
4. **User Service** (Port 4002) - via Auth Service
5. **Redis** (Port 6379)
6. **RabbitMQ** (Port 5672)
7. **Email Worker** (Port 4003)
8. **SMTP Server** (External)
9. **MongoDB** (Port 27017)
10. **Neo4j DB Sync Service** (Port 4007)

#### Flow Steps:

**Step 1: Initial Registration Request**
- **User** sends POST request to `/auth/register/email-verification`
- Request includes: `username`, `email`, `password`
- **API Gateway** receives request
- **API Gateway** validates request (DTO validation, rate limiting)
- **API Gateway** forwards request to **Auth Service**

**Step 2: Password Validation**
- **Auth Service** receives registration request
- **RegisterService.emailVerificationRegister()** is called
- **PasswordService** validates password strength:
  - Minimum length check
  - Complexity requirements (uppercase, lowercase, numbers, special chars)
  - Password is hashed using bcrypt
- If validation fails → return error to user

**Step 3: Duplicate Check**
- **Auth Service** calls **User Service** (via UserServiceClient)
- Check if email already exists: `checkUserExistsByEmailOrUsername(email)`
- Check if username already exists: `checkUserExistsByEmailOrUsername(username)`
- If either exists → return error "Email or username already exists"

**Step 4: Store Registration Data in Redis**
- **Auth Service** stores registration data temporarily in **Redis**
- Key format: `register_info:{email}`
- Value: JSON containing `username`, `email`, `password_hashed`
- TTL: 1 hour (3600 seconds)
- Purpose: Temporary storage until email verification

**Step 5: Generate Email Verification Code**
- **Auth Service** generates UUID-based verification code
- Code length: 6 characters (from UUID slice)
- Store code in **Redis** with email as key
- TTL: 5 minutes (300 seconds)

**Step 6: Publish Email Job to RabbitMQ**
- **Auth Service** publishes email job to **RabbitMQ**
- Exchange: `email.events`
- Queue: `email_queue`
- Message payload:
  ```json
  {
    "type": "email_verification",
    "email": "user@example.com",
    "code": "abc123",
    "username": "johndoe"
  }
  ```

**Step 7: Email Worker Processes Email**
- **Email Worker** consumes message from **RabbitMQ**
- Selects appropriate email template (registration verification)
- Renders template with verification code
- Sends email via **SMTP Server** (Gmail/configured SMTP)

**Step 8: Response to User**
- **Auth Service** returns success response
- Message: "Registration initiated. Please check your email for verification code."
- **API Gateway** forwards response to **User**
- User receives confirmation

**Step 9: Email Verification Request**
- **User** receives email with verification code
- **User** sends POST request to `/auth/register/verify-email`
- Request includes: `code` (verification code)
- **API Gateway** validates and forwards to **Auth Service**

**Step 10: Verify Email Code**
- **Auth Service** calls `RegisterService.verifyEmailRegister(code)`
- **Auth Service** retrieves code from **Redis**
- Validates code matches and hasn't expired
- If invalid → return error "Invalid or expired verification code"

**Step 11: Retrieve Registration Data**
- **Auth Service** retrieves registration data from **Redis** using email
- Data includes: `username`, `email`, `password_hashed`
- If data not found → return error "Registration data not found"

**Step 12: Create User Account**
- **Auth Service** calls **User Service** to create user
- **User Service** creates user document in **MongoDB**
- User document includes:
  - `username` (unique, indexed)
  - `email` (unique, indexed)
  - `password_hashed` (bcrypt hash)
  - `display_name` (optional)
  - `bio` (default: "Hi, i am a new Decode User")
  - `avatar_ipfs_hash` (default avatar)
  - `role` (default: "user")
  - `is_active` (default: true)
  - `createdAt`, `updatedAt` (timestamps)

**Step 13: Publish User Created Event**
- **User Service** publishes user creation event to **RabbitMQ**
- Exchange: `user.sync.events`
- Queue: `user_sync_queue`
- Message payload includes user data

**Step 14: Neo4j Sync**
- **Neo4j DB Sync Service** consumes user creation event
- Creates User node in **Neo4j** graph database
- Node properties: `user_id`, `username`, `email`, `display_name`, etc.

**Step 15: Send Welcome Email**
- **Auth Service** publishes welcome email job to **RabbitMQ**
- **Email Worker** sends welcome email via **SMTP**
- Email template: Welcome message for new users

**Step 16: Cleanup Redis Data**
- **Auth Service** deletes registration data from **Redis**
- Deletes verification code from **Redis**

**Step 17: Success Response**
- **Auth Service** returns success response
- Message: "User created successfully"
- **API Gateway** forwards response to **User**
- User can now proceed to login

### Error Paths to Include:
1. **Invalid Password**: Return error before Redis storage
2. **Duplicate Email/Username**: Return error after User Service check
3. **Redis Storage Failure**: Return error, user can retry
4. **Email Service Failure**: Log error but continue (non-blocking)
5. **Invalid Verification Code**: Return error, allow resend
6. **Expired Verification Code**: Return error, allow resend
7. **User Creation Failure**: Return error, cleanup Redis data

### Visual Elements:
- Use different colors for:
  - Success paths (green)
  - Error paths (red)
  - Async operations (blue)
  - Database operations (yellow)
- Show timing information (TTL values)
- Include retry mechanisms
- Show parallel operations (email sending, Neo4j sync)

---

## 2. User Authentication (Login) Flow Diagram

### Overview
The authentication flow includes device fingerprinting, optional 2FA, and session management. It supports both trusted and untrusted devices with different verification requirements.

### Diagram Type
**Sequence Diagram** (recommended) or **Flowchart with Decision Points**

### Step-by-Step Drawing Instructions

#### Actors/Components to Include:
1. **User/Client** (Web/Mobile App)
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
4. **User Service** (Port 4002) - via Auth Service
5. **Redis** (Port 6379)
6. **RabbitMQ** (Port 5672)
7. **Email Worker** (Port 4003)
8. **SMTP Server** (External)
9. **MongoDB** (Port 27017) - Sessions, Device Fingerprints, OTP

#### Flow Steps:

**Step 1: Login Request**
- **User** sends POST request to `/auth/login`
- Request includes:
  - `email_or_username`: User's email or username
  - `password`: Plain text password
  - `fingerprint_hashed`: Hashed device fingerprint
  - `browser`: Browser information (e.g., "Chrome 120.0.0.0")
  - `device`: Device information (e.g., "Windows 10")
- **API Gateway** receives request
- **API Gateway** validates request (DTO validation, rate limiting)
- **API Gateway** forwards request to **Auth Service**

**Step 2: Retrieve User Information**
- **Auth Service** calls `LoginService.login()`
- **Auth Service** calls **User Service** (via UserServiceClient)
- Query: `getInfoWithPasswordByUserEmailOrUsername(email_or_username)`
- **User Service** queries **MongoDB** users collection
- Returns user document including `password_hashed`
- If user not found → return error "Invalid email/username or password"

**Step 3: Password Verification**
- **Auth Service** calls `PasswordService.checkPassword()`
- Compares plain text password with `password_hashed` using bcrypt
- If password doesn't match → return error "Invalid email/username or password"
- Log failed login attempt (for security monitoring)

**Step 4: Device Fingerprint Check**
- **Auth Service** calls `DeviceFingerprintService.checkDeviceFingerprint()`
- Query **MongoDB** device_fingerprints collection
- Search for: `user_id` + `fingerprint_hashed`
- Two possible outcomes:
  - **Device Found & Trusted**: Continue to Step 5A
  - **Device Not Found or Not Trusted**: Continue to Step 5B

**Step 5A: Trusted Device Path - Check 2FA**
- If device is trusted, check if 2FA is enabled
- **Auth Service** calls `TwoFactorAuthService.checkAndInitOtpLoginSession()`
- Query **MongoDB** otps collection for user
- Check `otp_enable` flag
- Two sub-paths:
  - **2FA Enabled**: Continue to Step 6A (OTP Required)
  - **2FA Disabled**: Continue to Step 7 (Direct Login)

**Step 6A: 2FA Required (Trusted Device)**
- **Auth Service** creates temporary login session in **Redis**
- Key: `login_session:{session_token}`
- Value: User ID, device fingerprint ID, browser, device
- TTL: 10 minutes
- Returns response with `login_session_token`
- Message: "OTP verification required"
- **User** must call `/auth/2fa/login` with OTP code

**Step 6B: OTP Verification (Trusted Device)**
- **User** sends POST request to `/auth/2fa/login`
- Request includes:
  - `login_session_token`: From previous step
  - `otp`: 6-digit OTP code from authenticator app
- **Auth Service** validates OTP using TOTP algorithm
- If OTP invalid → return error
- If OTP valid → Continue to Step 7

**Step 5B: Untrusted Device Path**
- If device not found or not trusted:
- **Auth Service** creates untrusted device fingerprint record
- Stores in **MongoDB** device_fingerprints collection
- `is_trusted`: false
- Creates temporary session in **Redis** for device verification
- Key: `verify_device_fingerprint_session:{session_token}`
- TTL: 30 minutes

**Step 5C: Send Device Verification Email**
- **Auth Service** publishes email job to **RabbitMQ**
- **Email Worker** sends device verification email via **SMTP**
- Email contains verification code
- **User** receives email

**Step 5D: Device Verification**
- **User** sends POST request to `/auth/login/fingerprint/email-verification`
- Request includes: `code` (from email)
- **Auth Service** validates verification code from **Redis**
- If valid:
  - Updates device fingerprint: `is_trusted = true`
  - Continue to Step 7
- If invalid → return error, allow resend

**Step 7: Create Session**
- **Auth Service** calls `SessionService.createSession()`
- Creates session document in **MongoDB** sessions collection:
  - `user_id`: User's ObjectId
  - `device_fingerprint_id`: Device fingerprint ObjectId
  - `session_token`: Generated JWT session token (30 days expiry)
  - `app`: "Decode" (default)
  - `expires_at`: 30 days from now
  - `is_active`: true
  - `last_used_at`: Current timestamp
- Stores session in **Redis** for fast lookup (optional cache)

**Step 8: Generate Tokens**
- **Auth Service** generates JWT tokens:
  - **Access Token**: Short-lived (15 minutes)
    - Contains: `user_id`, `email`, `username`, `role`, `session_token`
    - Signed with access token secret
  - **Session Token**: Long-lived (30 days)
    - Used for token refresh
    - Stored in session document

**Step 9: Update User Last Login**
- **Auth Service** calls **User Service** to update `last_login` timestamp
- **User Service** updates user document in **MongoDB**
- Field: `last_login = new Date()`

**Step 10: Send Login Notification**
- **Auth Service** publishes notification to **RabbitMQ**
- Exchange: `notification.events`
- Queue: `notification_queue`
- **Notification Service** creates notification in **MongoDB**
- Notification type: "session_created" or "new_login"
- Title: "New Login Detected"
- Message: "You logged in from [device] on [browser]"

**Step 11: Return Success Response**
- **Auth Service** returns success response to **API Gateway**
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
        "username": "johndoe",
        "display_name": "John Doe"
      }
    }
  }
  ```
- **API Gateway** forwards response to **User**
- **User** stores tokens and proceeds to authenticated state

### Alternative Flows:

#### Flow A: Resend Device Verification Email
- **User** sends POST to `/auth/login/fingerprint/resend-email-verification`
- **Auth Service** resends verification email
- New code generated and stored in **Redis**

#### Flow B: Resend Email Verification (Registration)
- Similar to registration flow
- **User** can request new verification code

### Error Paths to Include:
1. **Invalid Credentials**: Return error after password check
2. **User Not Found**: Return error after User Service query
3. **Invalid OTP**: Return error, allow retry
4. **Expired Verification Code**: Return error, allow resend
5. **Session Creation Failure**: Return error, log for investigation
6. **Rate Limiting**: Return 429 error if too many attempts

### Decision Points to Highlight:
1. **Device Trust Status**: Trusted vs Untrusted
2. **2FA Status**: Enabled vs Disabled
3. **Verification Code Validity**: Valid vs Invalid/Expired
4. **Password Match**: Match vs No Match

### Visual Elements:
- Use swimlanes for different services
- Use different colors for:
  - Trusted device path (green)
  - Untrusted device path (orange)
  - 2FA path (blue)
  - Error paths (red)
- Show decision diamonds for:
  - Device trust check
  - 2FA enabled check
  - OTP validation
- Include timing information (token expiry, TTL values)
- Show parallel operations (notifications, email sending)

---

## 3. Session Refresh Flow Diagram

### Overview
Users can refresh their access tokens using session tokens without re-authenticating.

### Diagram Type
**Sequence Diagram**

### Step-by-Step Drawing Instructions

#### Flow Steps:

**Step 1: Refresh Request**
- **User** sends POST request to `/auth/session/refresh`
- Request includes: `session_token` (from login)
- **API Gateway** validates and forwards to **Auth Service**

**Step 2: Validate Session Token**
- **Auth Service** calls `SessionService.refreshSession()`
- Validates session token signature
- Queries **MongoDB** sessions collection
- Checks:
  - Session exists
  - `is_active = true`
  - `expires_at > now()`
  - `revoked_at = null`

**Step 3: Generate New Tokens**
- If session valid:
  - Generate new **Access Token** (15 minutes)
  - Keep same **Session Token** (30 days)
  - Update `last_used_at` in session document

**Step 4: Return New Tokens**
- **Auth Service** returns new access token
- **User** updates stored access token

### Error Paths:
- Invalid session token
- Expired session
- Revoked session

---

## 4. Logout Flow Diagram

### Overview
Users can logout by invalidating their session.

### Diagram Type
**Sequence Diagram**

### Step-by-Step Drawing Instructions

#### Flow Steps:

**Step 1: Logout Request**
- **User** sends POST request to `/auth/session/logout`
- Request includes: `session_token`
- **API Gateway** validates and forwards to **Auth Service**

**Step 2: Invalidate Session**
- **Auth Service** calls `SessionService.logout()`
- Updates session in **MongoDB**:
  - `is_active = false`
  - `revoked_at = new Date()`
- Removes session from **Redis** cache (if cached)

**Step 3: Return Success**
- **Auth Service** returns success response
- **User** clears tokens from client storage

---

## 5. Password Forgot Flow Diagram

### Overview
The password forgot flow allows users to reset their password when they've forgotten it. It's a three-step process: initiate reset (email verification), verify email code, and change password.

### Diagram Type
**Sequence Diagram** (recommended) or **Flowchart with Decision Points**

### Step-by-Step Drawing Instructions

#### Actors/Components to Include:
1. **User/Client**
2. **API Gateway** (Port 4000)
3. **Auth Service** (Port 4001)
   - Password Service
   - Info Service
   - UserServiceClient (HTTP client to User Service)
   - ServicesJwtStrategy (for service token generation)
4. **User Service** (Port 4002)
   - Service Guard (validates service JWT tokens)
5. **Redis** (Port 6379)
6. **RabbitMQ** (Port 5672)
7. **Email Worker** (Port 4003)
8. **SMTP Server** (External)
9. **MongoDB** (Port 27017)

#### Flow Steps:

**Step 1: User Initiates Password Reset**
- **User** navigates to "Forgot Password" page
- **User** enters email or username
- **User** sends POST request to `/auth/password/forgot/initiate`
- Request body: `{ "email_or_username": "user@example.com" }`
- **API Gateway** receives request
- **API Gateway** validates request (DTO validation, rate limiting)
- **API Gateway** forwards request to **Auth Service**

**Step 2: Find User by Email/Username**
- **Auth Service** calls `PasswordService.emailVerificationChangePassword()`
- **Password Service** calls `InfoService.getUserInfoByEmailOrUsername()`
- **Info Service** calls `UserServiceClient.getInfoByEmailOrUsername()`
- **UserServiceClient** generates service JWT token using `ServicesJwtStrategy`
- **UserServiceClient** makes HTTP request to **User Service**:
  ```
  GET http://user:4002/users/services/user/get-info-by-email-or-username?email_or_username=user@example.com
  Headers: {
    Authorization: Bearer <service_jwt_token>,
    Content-Type: application/json,
    User-Agent: Auth-Service/1.0
  }
  ```
- **User Service** receives request with service JWT token
- **User Service** validates service token via **ServiceGuard**
- **User Service** queries **MongoDB** users collection:
  ```javascript
  {
    $or: [
      { email: email_or_username },
      { username: email_or_username }
    ]
  }
  ```
- **User Service** returns user document to **UserServiceClient**
- **UserServiceClient** returns user data to **Info Service**
- **Info Service** returns user data to **Password Service**
- If user not found → return error "User not found"
- If user found, extract `user_id` and `email`

**Step 3: Generate Password Reset Code**
- **Password Service** calls `sendEmailVerification()`
- Generate UUID-based verification code (6 characters from UUID)
- Create verification data structure:
  ```json
  {
    "user_id": "user123",
    "verification_code": "abc123"
  }
  ```

**Step 4: Store Verification Code in Redis**
- **Password Service** stores verification code in **Redis**
- Key format: `change_password_verification_code:{code}`
- Value: JSON stringified verification data
- TTL: 5 minutes (300 seconds)
- Purpose: Temporary storage until code is verified

**Step 5: Publish Email Job to RabbitMQ**
- **Password Service** publishes email job to **RabbitMQ**
- Exchange: `email.events`
- Queue: `email_queue`
- Message payload:
  ```json
  {
    "type": "forgot-password-verify",
    "data": {
      "email": "user@example.com",
      "otpCode": "abc123"
    }
  }
  ```

**Step 6: Email Worker Processes Email**
- **Email Worker** consumes message from **RabbitMQ**
- Selects password reset email template
- Renders template with verification code
- Sends email via **SMTP Server**

**Step 7: Response to User**
- **Password Service** returns success response
- Message: "Password reset code sent to your email"
- **Auth Service** forwards to **API Gateway**
- **API Gateway** returns to **User**
- User receives confirmation

**Step 8: User Verifies Email Code**
- **User** receives email with verification code
- **User** sends POST request to `/auth/password/forgot/verify-email`
- Request body: `{ "code": "abc123" }`
- **API Gateway** validates and forwards to **Auth Service**

**Step 9: Verify Email Code**
- **Auth Service** calls `PasswordService.verifyEmailChangePassword()`
- **Password Service** calls `verifyEmailVerificationCode()`
- Query **Redis** for verification code:
  - Key: `change_password_verification_code:{code}`
  - Value: `{ user_id, verification_code }`
- If code not found or expired → return error "Invalid or expired verification code"
- If code valid, retrieve `user_id`

**Step 10: Get User Info**
- **Password Service** calls `InfoService.getUserInfoByUserId()`
- **Info Service** calls `UserServiceClient.getInfoByUserId()`
- **UserServiceClient** generates service JWT token
- **UserServiceClient** makes HTTP request to **User Service**:
  ```
  GET http://user:4002/users/services/user/get-info-by-user-id?user_id=user123
  Headers: {
    Authorization: Bearer <service_jwt_token>
  }
  ```
- **User Service** validates service token via **ServiceGuard**
- **User Service** queries **MongoDB** users collection:
  ```javascript
  { _id: user_id }
  ```
- Returns user document to **UserServiceClient**
- **UserServiceClient** returns user data to **Info Service**
- **Info Service** returns user data to **Password Service**
- Purpose: Verify user exists and is active

**Step 11: Return Success**
- **Password Service** returns success response
- Message: "Password reset code verified"
- **Auth Service** forwards to **API Gateway**
- **API Gateway** returns to **User**
- User can now proceed to change password

**Step 12: User Changes Password**
- **User** enters new password
- **User** sends POST request to `/auth/password/forgot/change`
- Request body:
  ```json
  {
    "code": "abc123",
    "new_password": "NewSecurePassword123!"
  }
  ```
- **API Gateway** validates and forwards to **Auth Service**

**Step 13: Verify Code Again**
- **Auth Service** calls `PasswordService.changeForgotPassword()`
- **Password Service** calls `verifyEmailVerificationCode()` again
- Query **Redis** for verification code
- If code invalid → return error
- If code valid, extract `user_id`

**Step 14: Delete Verification Code**
- **Password Service** deletes verification code from **Redis**
- Key deleted: `change_password_verification_code:{code}`
- Purpose: One-time use code (prevents reuse)

**Step 15: Validate and Hash New Password**
- **Password Service** calls `passwordVerificationAndHashing()`
- Validates password strength:
  - Minimum length: 8 characters
  - Complexity requirements (uppercase, lowercase, numbers, special chars)
- If validation fails → return error "Weak password"
- If validation passes, hash password using bcrypt

**Step 16: Update Password in Database**
- **Password Service** calls `passwordChange()`
- **Password Service** calls `UserServiceClient.changePassword()`
- **UserServiceClient** generates service JWT token
- **UserServiceClient** makes HTTP request to **User Service**:
  ```
  PUT http://user:4002/users/services/user/change-password
  Headers: {
    Authorization: Bearer <service_jwt_token>,
    Content-Type: application/json
  }
  Body: {
    user_id: "user123",
    password_hashed: "bcrypt_hashed_password"
  }
  ```
- **User Service** validates service token via **ServiceGuard**
- **User Service** updates user document in **MongoDB**:
  ```javascript
  {
    $set: {
      password_hashed: new_password_hashed
    }
  }
  ```
- **User Service** returns success response to **UserServiceClient**
- **UserServiceClient** returns to **Password Service**
- Password is updated

**Step 17: Return Success**
- **Password Service** returns success response
- Message: "Password changed successfully"
- **Auth Service** forwards to **API Gateway**
- **API Gateway** returns to **User**
- User can now login with new password

### Service Call Chain:

```
User Request
    ↓
API Gateway
    ↓
Auth Service
    ↓
Password Service
    ↓
Info Service
    ↓
UserServiceClient (in Auth Service)
    ├─→ Generate Service JWT Token
    └─→ HTTP Request to User Service
        ↓
User Service
    ├─→ ServiceGuard (validates service token)
    └─→ Query MongoDB
        ↓
MongoDB (users collection)
```

### Service-to-Service Authentication:
- **UserServiceClient** generates service JWT token using `ServicesJwtStrategy`
- Token includes:
  - `from_service`: "decode-auth-service"
  - `to_service`: "decode-user-service"
  - `iat`, `exp` (issued at, expires)
- Token is signed with `JWT_SERVICE_TOKEN_SECRET`
- **User Service** validates token via **ServiceGuard** before processing request

### Error Paths to Include:
1. **User Not Found**: Return error after User Service check
2. **Invalid Service Token**: Return 401 error (service-to-service auth failed)
3. **User Service Unavailable**: Return 503 error, log for investigation
4. **Invalid Verification Code**: Return error, allow resend
5. **Expired Verification Code**: Return error, allow resend
6. **Weak Password**: Return error with password requirements
7. **Code Already Used**: Return error (code deleted after first use)
8. **Password Update Failed**: Return error, log for investigation

### Alternative Flows:

#### Resend Password Reset Code
- **User** sends POST request to `/auth/password/forgot/initiate` again
- New verification code generated
- Old code in Redis expires or is replaced
- New email sent

---

## 6. Account Deactivation Flow Diagram

### Overview
Users can deactivate their accounts, which marks them as inactive but preserves their data. Deactivated accounts cannot login but can be reactivated later.

### Diagram Type
**Sequence Diagram** (recommended) or **Flowchart**

### Step-by-Step Drawing Instructions

#### Actors/Components to Include:
1. **User/Client**
2. **API Gateway** (Port 4000)
3. **User Service** (Port 4002)
4. **Deactivate Service**
5. **MongoDB** (Port 27017)
6. **Neo4j DB Sync Service** (Port 4007) - via RabbitMQ
7. **RabbitMQ** (Port 5672)
8. **Neo4j** (Port 7474/7687) - Optional, for user node update

#### Flow Steps:

**Step 1: User Initiates Account Deactivation**
- **User** navigates to Account Settings
- **User** clicks "Deactivate Account" button
- **User** may be asked to confirm action
- **User** sends PATCH request to `/users/account/deactivate`
- Request includes: `Authorization: Bearer <access_token>`
- **API Gateway** receives request
- **API Gateway** validates access token via **AuthGuard**
- Extracts `user_id` from token

**Step 2: Forward to User Service**
- **API Gateway** forwards request to **User Service**
- **User Service** calls `DeactivateService.deactivateAccount()`
- **Deactivate Service** receives `user_id`

**Step 3: Query User Document**
- **Deactivate Service** queries **MongoDB** users collection:
  ```javascript
  { _id: user_id }
  ```
- If user not found → return error "User not found"
- If user found, retrieve user document

**Step 4: Check Current Status**
- **Deactivate Service** checks `user.is_active` field
- If `is_active = false` → return error "Account already deactivated"
- If `is_active = true` → continue

**Step 5: Deactivate Account**
- **Deactivate Service** updates user document in **MongoDB**:
  ```javascript
  {
    $set: {
      is_active: false,
      last_account_deactivation: new Date()
    }
  }
  ```
- Account is marked as inactive
- Deactivation timestamp is recorded

**Step 6: Publish User Update Event (Optional)**
- **User Service** may publish user update event to **RabbitMQ**
- Exchange: `user.sync.events`
- Queue: `user_sync_queue`
- Message payload includes updated user data

**Step 7: Neo4j Sync (Optional)**
- **Neo4j DB Sync Service** consumes user update event
- Updates User node in **Neo4j** graph database:
  ```cypher
  MATCH (u:User {user_id: "user123"})
  SET u.is_active = false
  ```
- Keeps graph database in sync with MongoDB

**Step 8: Return Success Response**
- **Deactivate Service** returns success response
- **User Service** forwards to **API Gateway**
- **API Gateway** returns to **User**:
  ```json
  {
    "success": true,
    "message": "Account deactivated successfully",
    "data": {
      "_id": "user123",
      "username": "johndoe",
      "email": "user@example.com",
      "is_active": false,
      "last_account_deactivation": "2024-01-15T10:30:00Z"
    }
  }
  ```

**Step 9: Account Deactivated**
- **User** receives confirmation
- Account is now inactive
- User cannot login with this account
- All active sessions should be invalidated (optional, can be done separately)

### Future Login Attempts:
- When deactivated user tries to login:
  - **Auth Service** checks `user.is_active` field
  - If `is_active = false` → return error "Account is deactivated"
  - User must reactivate account first

### Account Reactivation Flow:

**Step 1: User Requests Reactivation**
- **User** sends PATCH request to `/users/account/reactivate`
- Request includes: `Authorization: Bearer <access_token>` (if session still valid)
- Or user may need to go through email verification

**Step 2: Reactivate Account**
- **User Service** calls `DeactivateService.reactivateAccount()`
- **Deactivate Service** queries **MongoDB** for user
- Updates user document:
  ```javascript
  {
    $set: {
      is_active: true
    }
  }
  ```
- Note: `last_account_deactivation` is not cleared (preserves history)

**Step 3: Sync to Neo4j**
- **User Service** publishes user update event
- **Neo4j DB Sync Service** updates User node:
  ```cypher
  MATCH (u:User {user_id: "user123"})
  SET u.is_active = true
  ```

**Step 4: Return Success**
- **Deactivate Service** returns success response
- Account is reactivated
- User can now login normally

### Data Preservation:
- **User data is NOT deleted** when account is deactivated:
  - User profile (username, email, bio, avatar)
  - Wallets
  - Sessions (marked as inactive)
  - Relationships (FOLLOWING, BLOCKED in Neo4j)
  - Notifications
  - All data is preserved for potential reactivation

### Error Paths to Include:
1. **User Not Found**: Return 404 error
2. **Account Already Deactivated**: Return error "Account already deactivated"
3. **Database Update Failed**: Return 500 error
4. **Neo4j Sync Failed**: Log error but continue (non-critical)

### Security Considerations:
1. **Session Invalidation**: Consider invalidating all active sessions on deactivation
2. **Email Verification**: May require email verification before reactivation
3. **Rate Limiting**: Prevent abuse of deactivation/reactivation
4. **Audit Trail**: `last_account_deactivation` timestamp provides audit trail

---

## Diagram Creation Guidelines

### Recommended Tools:
- **Sequence Diagrams**: PlantUML, Mermaid, Draw.io, Lucidchart
- **Flowcharts**: Draw.io, Lucidchart, Miro

### Color Coding Standards:
- **Green**: Success paths, valid operations
- **Red**: Error paths, invalid operations
- **Blue**: Async operations, message queues
- **Yellow**: Database operations
- **Orange**: Verification/validation steps
- **Purple**: Token generation/validation

### Symbols to Use:
- **Rectangle**: Process/Service
- **Diamond**: Decision point
- **Cylinder**: Database
- **Cloud**: External service (SMTP)
- **Arrow**: Data flow
- **Dashed Arrow**: Async operation
- **Note/Sticky Note**: Additional information

### Information to Include:
- Port numbers for services
- HTTP methods and endpoints
- Request/response payloads (simplified)
- Error codes and messages
- Timing information (TTL, expiry)
- Database collection names
- Queue/exchange names

### Best Practices:
1. Start with high-level flow, then add details
2. Show all error paths clearly
3. Include retry mechanisms
4. Show parallel operations where applicable
5. Use consistent naming conventions
6. Add legends for symbols and colors
7. Include version information
8. Document assumptions and constraints

---

**Last Updated**: 2024
**Maintained By**: Decode Development Team
