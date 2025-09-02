# Email Worker Service

This service handles email sending operations for the Decode backend system. It supports both direct email sending and queued email processing via RabbitMQ.

## Supported Email Types

### 1. Account Management
- **`create-account`** - Email verification for new account creation
- **`welcome-message`** - Welcome email after account verification

### 2. Security & Verification
- **`fingerprint-verify`** - New device login verification
- **`forgot-password-verify`** - Password reset verification

### 3. Profile Updates
- **`username-change-verify`** - Username change verification
- **`email-change-verify`** - Email change verification
- **`new-email-change-verify`** - New email address confirmation for email change

## Usage Examples

### Direct Email Sending

```typescript
// Username change verification
const usernameChangeRequest: EmailRequestDto = {
  type: 'username-change-verify',
  data: {
    email: 'user@example.com',
    otpCode: '123456'
  }
};

await emailService.sendEmail(usernameChangeRequest);
```

### Queued Email Processing

```typescript
// Email change verification
const emailChangeRequest: EmailRequestDto = {
  type: 'email-change-verify',
  data: {
    email: 'user@example.com',
    otpCode: '789012'
  }
};

await rabbitMQService.sendEmailRequest(emailChangeRequest);
```

### New Email Change Verification

```typescript
// New email change verification
const newEmailChangeRequest: EmailRequestDto = {
  type: 'new-email-change-verify',
  data: {
    email: 'newemail@example.com',
    otpCode: '345678'
  }
};

await emailService.sendEmail(newEmailChangeRequest);
```

## API Endpoints

- `POST /email-worker/send` - Send email directly
- `POST /email-worker/queue` - Queue email for processing
- `POST /email-worker/new-email-change-verify` - Send new email change verification email
- `GET /email-worker/health` - Health check

## RabbitMQ Integration

The service automatically processes queued email requests from the `email_request` queue. Other services can emit to this queue using the `email_request` event pattern.

## Configuration

Required environment variables:
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `RABBITMQ_URL` - RabbitMQ connection URL
