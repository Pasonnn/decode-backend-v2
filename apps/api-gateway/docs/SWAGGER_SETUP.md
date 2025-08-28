# Swagger API Documentation Setup

## Overview

This document describes the Swagger API documentation setup for the Decode API Gateway. The documentation is available at `http://localhost:4000/docs` when the service is running.

## Features

### 🔧 **Complete API Documentation**
- **Interactive API Explorer**: Test endpoints directly from the browser
- **Request/Response Examples**: Detailed examples for all endpoints
- **Authentication Support**: JWT Bearer token authentication
- **Rate Limiting Documentation**: Clear indication of rate-limited endpoints
- **Error Response Documentation**: Comprehensive error scenarios

### 🏷️ **Organized by Tags**
- **auth**: Authentication and authorization endpoints
- **users**: User management endpoints (when implemented)
- **email**: Email service endpoints (when implemented)
- **health**: Health check endpoints

### 🔐 **Security Features**
- **JWT Authentication**: Bearer token support with proper documentation
- **Public Endpoints**: Clearly marked endpoints that don't require authentication
- **Rate Limiting**: Visual indicators for rate-limited endpoints

## Configuration

### Main Configuration (`main.ts`)

```typescript
// Swagger Configuration
const config = new DocumentBuilder()
  .setTitle('Decode API Gateway')
  .setDescription('API Gateway for Decode Backend Services')
  .setVersion('1.0')
  .addTag('auth', 'Authentication and authorization endpoints')
  .addTag('users', 'User management endpoints')
  .addTag('email', 'Email service endpoints')
  .addTag('health', 'Health check endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addServer('http://localhost:4000', 'Development server')
  .addServer('https://api.decode.com', 'Production server')
  .build();
```

### Swagger UI Options

```typescript
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,  // Keep auth token between requests
    tagsSorter: 'alpha',        // Sort tags alphabetically
    operationsSorter: 'alpha',  // Sort operations alphabetically
  },
  customSiteTitle: 'Decode API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .info .description { color: #34495e; }
  `,
});
```

## API Endpoints Documentation

### Authentication Endpoints (`/auth`)

#### Public Endpoints
- `POST /auth/login` - User login with credentials
- `POST /auth/login/fingerprint/email-verification` - Device fingerprint verification
- `POST /auth/register` - User registration
- `POST /auth/register/verify-email` - Email verification for registration
- `POST /auth/refresh` - Refresh session token
- `GET /auth/validate` - Validate access token
- `POST /auth/session/sso/validate` - Validate SSO token

#### Protected Endpoints (Require JWT)
- `GET /auth/me` - Get current user information
- `POST /auth/logout` - User logout
- `GET /auth/session/active` - Get active sessions
- `POST /auth/session/revoke-all` - Revoke all sessions
- `POST /auth/session/sso` - Create SSO token
- `POST /auth/password/change` - Change password
- `POST /auth/password/forgot/initiate` - Initiate forgot password
- `POST /auth/password/forgot/verify-email` - Verify email for password reset
- `POST /auth/password/forgot/change` - Complete password reset

### Health Endpoints (`/health`)
- `GET /health/healthz` - Service health check

## DTOs with Swagger Decorators

All DTOs include comprehensive Swagger documentation:

### Login DTO
```typescript
export class LoginDto {
    @ApiProperty({
        description: 'User email or username for authentication',
        example: 'user@example.com',
        minLength: 1,
        maxLength: 255
    })
    email_or_username: string;

    @ApiProperty({
        description: 'User password (must be 8-128 characters)',
        example: 'SecurePass123!',
        minLength: 8,
        maxLength: 128
    })
    password: string;

    @ApiProperty({
        description: 'Device fingerprint hash for security verification',
        example: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        minLength: 32,
        maxLength: 64
    })
    fingerprint_hashed: string;
}
```

### Register DTO
```typescript
export class RegisterInfoDto {
    @ApiProperty({
        description: 'Username (3-30 characters, letters, numbers, and underscores only)',
        example: 'john_doe',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    })
    username: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        maxLength: 255
    })
    email: string;

    @ApiProperty({
        description: 'Password (8-128 characters, must contain uppercase, lowercase, number, and special character)',
        example: 'SecurePass123!',
        minLength: 8,
        maxLength: 128,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
    })
    password: string;
}
```

## Response Documentation

### Standard Response Format
```typescript
export class ApiResponseDto<T = unknown> {
    @ApiProperty({
        description: 'Indicates if the request was successful',
        example: true
    })
    success: boolean;

    @ApiProperty({
        description: 'HTTP status code',
        example: 200
    })
    statusCode: number;

    @ApiProperty({
        description: 'Response message',
        example: 'Operation completed successfully'
    })
    message: string;

    @ApiProperty({
        description: 'Response data payload',
        required: false
    })
    data?: T;

    @ApiProperty({
        description: 'Error details if request failed',
        required: false
    })
    error?: string | Record<string, unknown>;
}
```

### Error Response Format
```typescript
export class ErrorResponseDto {
    @ApiProperty({
        description: 'Indicates if the request was successful',
        example: false
    })
    success: boolean;

    @ApiProperty({
        description: 'HTTP status code',
        example: 400
    })
    statusCode: number;

    @ApiProperty({
        description: 'Error message',
        example: 'Bad Request'
    })
    message: string;

    @ApiProperty({
        description: 'Error details',
        example: 'Validation failed'
    })
    error: string | Record<string, unknown>;
}
```

## Usage

### Starting the Service
```bash
npm run start:dev
```

### Accessing Documentation
1. Start the API Gateway service
2. Open your browser and navigate to `http://localhost:4000/docs`
3. Explore the interactive API documentation

### Testing Endpoints
1. **Public Endpoints**: Can be tested directly without authentication
2. **Protected Endpoints**: 
   - Click the "Authorize" button at the top
   - Enter your JWT token in the format: `Bearer <your-token>`
   - Click "Authorize"
   - Now you can test protected endpoints

### Example API Calls

#### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "user@example.com",
    "password": "SecurePass123!",
    "fingerprint_hashed": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
  }'
```

#### Get Current User (with auth)
```bash
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Dependencies

The following packages are required for Swagger:

```json
{
  "@nestjs/swagger": "^7.0.0",
  "swagger-ui-express": "^5.0.0"
}
```

## Best Practices

### 1. **Consistent Documentation**
- All endpoints should have `@ApiOperation` with summary and description
- All DTOs should have `@ApiProperty` decorators
- All responses should be documented with `@ApiResponse`

### 2. **Security Documentation**
- Use `@ApiBearerAuth('JWT-auth')` for protected endpoints
- Use `@Public()` decorator for public endpoints
- Document rate limiting with appropriate descriptions

### 3. **Error Handling**
- Document all possible error responses (400, 401, 403, 404, 429, 500)
- Provide meaningful error messages and examples
- Use consistent error response format

### 4. **Examples and Validation**
- Provide realistic examples for all properties
- Include validation rules (minLength, maxLength, pattern)
- Use descriptive property names and descriptions

## Troubleshooting

### Common Issues

1. **Swagger UI not loading**
   - Check if the service is running on the correct port
   - Verify that `@nestjs/swagger` is properly installed
   - Check browser console for JavaScript errors

2. **Missing endpoint documentation**
   - Ensure all controllers have `@ApiTags` decorator
   - Verify all endpoints have `@ApiOperation` decorator
   - Check that DTOs have `@ApiProperty` decorators

3. **Authentication not working**
   - Verify the JWT token format: `Bearer <token>`
   - Check that the token is valid and not expired
   - Ensure the endpoint requires authentication

4. **TypeScript compilation errors**
   - Run `npx tsc --noEmit` to check for type errors
   - Verify all imports are correct
   - Check that all decorators are properly imported

### Debug Mode

To enable debug mode for Swagger:

```typescript
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
  customSiteTitle: 'Decode API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .info .description { color: #34495e; }
  `,
  // Enable debug mode
  explorer: true,
});
```

## Future Enhancements

1. **OpenAPI 3.1 Support**: Upgrade to latest OpenAPI specification
2. **Custom Themes**: Implement custom Swagger UI themes
3. **API Versioning**: Add support for multiple API versions
4. **Webhook Documentation**: Document webhook endpoints
5. **GraphQL Support**: Add GraphQL schema documentation
6. **Performance Metrics**: Add response time documentation
7. **Rate Limiting Details**: Detailed rate limiting documentation
8. **WebSocket Documentation**: Document WebSocket endpoints

## Contributing

When adding new endpoints:

1. Add `@ApiTags` to the controller
2. Add `@ApiOperation` to each endpoint
3. Add `@ApiResponse` for all possible responses
4. Add `@ApiProperty` to all DTO properties
5. Update this documentation
6. Test the endpoint in Swagger UI

## Support

For issues with Swagger documentation:

1. Check the troubleshooting section above
2. Review the NestJS Swagger documentation
3. Check the OpenAPI specification
4. Create an issue in the project repository
