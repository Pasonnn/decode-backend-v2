# API Gateway Rate Limiting

This document explains how rate limiting works in the API Gateway and how to use it.

## 🎯 **Overview**

Rate limiting prevents abuse by limiting the number of requests a user can make within a specific time window. The implementation uses Redis for distributed rate limiting across multiple API Gateway instances.

## 🏗️ **Architecture**

### **Components:**
1. **Rate Limit Decorators** - Define rate limiting rules on endpoints
2. **Rate Limit Guard** - Enforces rate limiting rules
3. **Rate Limit Service** - Redis-based implementation
4. **Configuration** - Environment-based settings

### **Storage:**
- **Redis** - Stores rate limit counters with automatic expiration
- **Sliding Window** - More accurate than fixed windows
- **Atomic Operations** - Prevents race conditions

## 🚀 **Usage**

### **Basic Rate Limiting**

```typescript
import { RateLimit } from '../common/decorators/rate-limit.decorator';

@Post('login')
@RateLimit({ windowMs: 60000, max: 5 })
async login() {
  // 5 requests per minute
}
```

### **Predefined Rate Limits**

```typescript
import { AuthRateLimit, UserRateLimit, AdminRateLimit } from '../common/decorators/rate-limit.decorator';

// Authentication endpoints
@Post('login')
@AuthRateLimit.login() // 5 attempts per 15 minutes

@Post('register')
@AuthRateLimit.register() // 3 attempts per hour

@Post('password/forgot/initiate')
@AuthRateLimit.forgotPassword() // 3 attempts per hour

@Post('register/verify-email')
@AuthRateLimit.verifyEmail() // 5 attempts per 5 minutes

// User endpoints (requires authentication)
@Get('me')
@UseGuards(AuthGuard)
@UserRateLimit.standard() // 60 requests per minute

@Get('sessions/active')
@UseGuards(AuthGuard)
@UserRateLimit.strict() // 30 requests per minute

// Admin endpoints
@Post('admin/users')
@UseGuards(AuthGuard)
@AdminRateLimit.standard() // 100 requests per minute
```

### **Custom Rate Limiting**

```typescript
@Post('api/expensive-operation')
@RateLimit({
  windowMs: 300000, // 5 minutes
  max: 10,
  message: 'Too many expensive operations, please try again later.',
  keyGenerator: (req) => `expensive:${req.user?.userId || req.ip}`,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
})
async expensiveOperation() {
  // Custom rate limiting logic
}
```

## ⚙️ **Configuration**

### **Environment Variables**

```env
# Global Rate Limiting
RATE_LIMIT_GLOBAL_ENABLED=true
RATE_LIMIT_GLOBAL_WINDOW_MS=900000
RATE_LIMIT_GLOBAL_MAX=100
RATE_LIMIT_GLOBAL_MESSAGE=Too many requests from this IP, please try again later.

# Auth Rate Limiting
RATE_LIMIT_AUTH_LOGIN_WINDOW_MS=900000
RATE_LIMIT_AUTH_LOGIN_MAX=5
RATE_LIMIT_AUTH_REGISTER_WINDOW_MS=3600000
RATE_LIMIT_AUTH_REGISTER_MAX=3
RATE_LIMIT_AUTH_FORGOT_PASSWORD_WINDOW_MS=3600000
RATE_LIMIT_AUTH_FORGOT_PASSWORD_MAX=3
RATE_LIMIT_AUTH_VERIFY_EMAIL_WINDOW_MS=300000
RATE_LIMIT_AUTH_VERIFY_EMAIL_MAX=5

# User Rate Limiting
RATE_LIMIT_USER_WINDOW_MS=60000
RATE_LIMIT_USER_MAX=60

# Admin Rate Limiting
RATE_LIMIT_ADMIN_WINDOW_MS=60000
RATE_LIMIT_ADMIN_MAX=100

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=rate_limit:
```

### **Configuration Structure**

```typescript
// environment.config.ts
export default registerAs('environment', () => ({
  rateLimit: {
    global: {
      enabled: true,
      windowMs: 900000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP',
    },
    auth: {
      login: { windowMs: 900000, max: 5 },
      register: { windowMs: 3600000, max: 3 },
      forgotPassword: { windowMs: 3600000, max: 3 },
      verifyEmail: { windowMs: 300000, max: 5 },
    },
    user: { windowMs: 60000, max: 60 },
    admin: { windowMs: 60000, max: 100 },
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: undefined,
    db: 0,
    keyPrefix: 'rate_limit:',
  },
}));
```

## 🔧 **Rate Limit Options**

### **RateLimitOptions Interface**

```typescript
interface RateLimitOptions {
  windowMs: number;           // Time window in milliseconds
  max: number;                // Maximum requests per window
  message?: string;           // Custom error message
  keyGenerator?: (request: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;        // Skip successful requests
  skipFailedRequests?: boolean;            // Skip failed requests
  standardHeaders?: boolean;               // RFC 6585 headers
  legacyHeaders?: boolean;                 // X-RateLimit-* headers
  handler?: (request: any, response: any) => void; // Custom handler
}
```

### **Key Generation**

```typescript
// Default key generation
keyGenerator: (req) => {
  if (req.user?.userId) {
    return `rate_limit:user:${req.user.userId}`;
  }
  return `rate_limit:ip:${req.ip}`;
}

// Custom key generation
keyGenerator: (req) => `api:${req.user?.userId || req.ip}:${req.path}`

// Role-based key generation
keyGenerator: (req) => `${req.user?.role || 'anonymous'}:${req.ip}`
```

## 📊 **Response Headers**

When rate limiting is active, the following headers are added to responses:

### **Standard Headers (RFC 6585)**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 2023-12-01T12:00:00.000Z
```

### **Legacy Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701436800
```

## 🚨 **Error Responses**

When rate limit is exceeded:

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many login attempts, please try again later.",
  "error": "Rate limit exceeded"
}
```

## 🔍 **Monitoring**

### **Rate Limit Service Methods**

```typescript
// Get rate limit info
const info = await rateLimitService.getInfo(key, windowMs, maxRequests);

// Reset rate limit for a key
await rateLimitService.reset(key);

// Get all rate limit keys
const keys = await rateLimitService.getAllKeys();

// Get statistics
const stats = await rateLimitService.getStats();

// Clean up expired entries
const cleaned = await rateLimitService.cleanup();
```

### **Statistics Response**

```typescript
{
  totalKeys: 150,
  memoryUsage: 1024000,
  connected: true
}
```

## 🛡️ **Security Features**

### **Fail-Open Strategy**
- If Redis is unavailable, requests are allowed
- Prevents service disruption due to Redis issues
- Logs errors for monitoring

### **IP Address Detection**
- Supports `X-Forwarded-For` header
- Supports `X-Real-IP` header
- Falls back to connection remote address

### **User-Based Limiting**
- Authenticated users get higher limits
- User ID is used for key generation
- Prevents IP-based evasion

## 🚀 **Best Practices**

### **1. Choose Appropriate Limits**
```typescript
// Sensitive operations - strict limits
@AuthRateLimit.login() // 5 attempts per 15 minutes

// Regular operations - moderate limits
@UserRateLimit.standard() // 60 requests per minute

// Admin operations - higher limits
@AdminRateLimit.standard() // 100 requests per minute
```

### **2. Use Descriptive Messages**
```typescript
@RateLimit({
  windowMs: 900000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
})
```

### **3. Monitor and Adjust**
```typescript
// Regular monitoring
const stats = await rateLimitService.getStats();
console.log(`Active rate limit keys: ${stats.totalKeys}`);

// Clean up expired entries
await rateLimitService.cleanup();
```

### **4. Test Rate Limiting**
```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}'
done
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Redis Connection Failed**
   - Check Redis is running
   - Verify connection settings
   - Check firewall rules

2. **Rate Limits Too Strict**
   - Adjust `max` values in configuration
   - Increase `windowMs` for longer windows
   - Use different limits for different user types

3. **Rate Limits Not Working**
   - Check decorators are applied correctly
   - Verify Redis is connected
   - Check logs for errors

### **Debug Mode**

```typescript
// Enable debug logging
this.logger.debug(`Rate limit check for key: ${key}`);
this.logger.debug(`Rate limit result: ${allowed}`);
```

## 📚 **Examples**

### **Complete Auth Controller Example**

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @Public()
  @AuthRateLimit.login()
  async login(@Body() loginDto: LoginDto): Promise<Response> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  @AuthRateLimit.register()
  async register(@Body() registerDto: RegisterInfoDto): Promise<Response> {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @UserRateLimit.standard()
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<Response> {
    return { success: true, data: user };
  }

  @Post('password/change')
  @UseGuards(AuthGuard)
  @UserRateLimit.strict()
  async changePassword(@Body() dto: ChangePasswordDto): Promise<Response> {
    return this.authService.changePassword(dto);
  }
}
```

This rate limiting system provides comprehensive protection against abuse while maintaining flexibility for different use cases.
