# Error Handling Documentation

## Overview

The API Gateway now implements a comprehensive error handling system that ensures all errors are returned to the frontend with consistent formatting, proper HTTP status codes, and detailed error information.

## Problem Solved

Previously, when authentication failed or other errors occurred, the frontend would receive generic 500 Internal Server Error responses without proper status codes, messages, or error details. This made debugging and user experience difficult.

## Solution

### 1. Exception Filters

Two global exception filters have been implemented:

#### HttpExceptionFilter
- Catches all exceptions and formats them consistently
- Handles different types of errors (HttpException, AxiosError, general Error)
- Provides proper HTTP status codes
- Includes detailed error information

#### ValidationExceptionFilter
- Specifically handles validation errors (BadRequestException)
- Formats validation details in a structured way
- Provides field-level error information

### 2. Enhanced AuthGuard Error Handling

All AuthGuard implementations have been updated to:
- Throw properly formatted exceptions with error codes
- Provide specific error messages for different scenarios
- Include error codes for frontend handling

## Error Response Format

All errors now follow this consistent format:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Access token is required",
  "error": "MISSING_TOKEN",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/users/profile"
}
```

### Field Descriptions

- `success`: Always `false` for error responses
- `statusCode`: HTTP status code (401, 403, 400, 500, etc.)
- `message`: Human-readable error message
- `error`: Error code for programmatic handling
- `timestamp`: ISO timestamp of when the error occurred
- `path`: The API endpoint that generated the error

## Authentication Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `MISSING_TOKEN` | No authorization header or token provided | 401 |
| `INVALID_TOKEN` | Token format is invalid or malformed | 401 |
| `TOKEN_EXPIRED` | Token has expired | 401 |
| `INVALID_SESSION` | Session is invalid or expired | 401 |
| `SERVICE_UNAVAILABLE` | Authentication service is down | 401 |
| `VALIDATION_ERROR` | Token validation failed | 401 |
| `AUTHENTICATION_ERROR` | General authentication error | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required role/permissions | 403 |

## Validation Error Format

Validation errors include additional details:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "type": "validation",
    "details": [
      {
        "field": "email",
        "message": "email must be an email",
        "value": "invalid-email"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/auth/register"
}
```

## Implementation Details

### Files Modified

1. **Exception Filters**:
   - `apps/api-gateway/src/common/filters/http-exception.filter.ts`
   - `apps/api-gateway/src/common/filters/validation-exception.filter.ts`
   - `apps/user/src/common/filters/http-exception.filter.ts`
   - `apps/user/src/common/filters/validation-exception.filter.ts`
   - `apps/auth/src/common/filters/http-exception.filter.ts`
   - `apps/auth/src/common/filters/validation-exception.filter.ts`

2. **Auth Guards**:
   - `apps/api-gateway/src/common/guards/auth.guard.ts`
   - `apps/user/src/common/guards/auth.guard.ts`
   - `apps/auth/src/common/guards/auth.guard.ts`

3. **Main Application Files**:
   - `apps/api-gateway/src/main.ts`
   - `apps/user/src/main.ts`
   - `apps/auth/src/main.ts`

### Registration

Exception filters are registered globally in each service's `main.ts`:

```typescript
app.useGlobalFilters(
  new ValidationExceptionFilter(),
  new HttpExceptionFilter(),
);
```

## Testing

A comprehensive test suite has been added to verify error handling:

```bash
# Run error handling tests
npm run test:e2e -- --testPathPattern=error-handling.test.ts
```

## Frontend Integration

The frontend can now:

1. **Check error codes** for specific handling:
   ```javascript
   if (error.error === 'TOKEN_EXPIRED') {
     // Redirect to login
   }
   ```

2. **Display user-friendly messages**:
   ```javascript
   showNotification(error.message);
   ```

3. **Handle validation errors**:
   ```javascript
   if (error.error?.type === 'validation') {
     // Display field-specific errors
     error.error.details.forEach(detail => {
       setFieldError(detail.field, detail.message);
     });
   }
   ```

## Benefits

1. **Consistent Error Format**: All services return errors in the same format
2. **Proper Status Codes**: Frontend receives correct HTTP status codes
3. **Detailed Error Information**: Error codes and messages for better debugging
4. **Better User Experience**: Clear, actionable error messages
5. **Easier Debugging**: Structured error responses with timestamps and paths
6. **Frontend Integration**: Error codes enable programmatic error handling

## Migration Notes

- Existing frontend code will need to be updated to handle the new error format
- Error handling should check for `success: false` and use the structured error information
- Validation errors now provide field-specific details for better UX
