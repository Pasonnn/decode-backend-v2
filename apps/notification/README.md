# Notification Service

A professional, scalable notification service built with NestJS that provides real-time notifications via WebSocket and HTTP API endpoints.

## Architecture

The service follows clean architecture principles with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RabbitMQ      │    │   HTTP API      │    │   WebSocket     │
│   (Input Flow)  │    │   (REST API)    │    │   (Real-time)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Notification Service                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Controllers │  │  Services   │  │ Gateways    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   DTOs      │  │  Schemas    │  │ Interfaces  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │     Redis       │    │   Frontend      │
│   (Persistence) │    │  (Socket Mgmt)  │    │   (Clients)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

### 🚀 Core Features

- **Real-time Notifications**: WebSocket-based real-time notification delivery
- **RabbitMQ Integration**: Asynchronous notification processing
- **HTTP API**: RESTful endpoints for notification management
- **Pagination**: Efficient pagination for large notification lists
- **Authentication**: JWT-based authentication and authorization
- **Scalability**: Redis-based socket management for horizontal scaling

### 📡 Input Flows

#### 1. RabbitMQ Flow

- Receives notification requests via RabbitMQ
- Creates notification in database
- Automatically sends via WebSocket to connected users
- Updates `delivered` status based on WebSocket delivery success

#### 2. HTTP Flow

- **GET** `/notifications` - Get paginated notifications (newest first)
- **PATCH** `/notifications/:id/read` - Mark notification as read
- **GET** `/notifications/unread/count` - Get unread count
- **GET** `/notifications/health` - Health check

## API Endpoints

### Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### GET /notifications

Get paginated notifications for the authenticated user.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439011",
        "user_id": "507f1f77bcf86cd799439012",
        "type": "message",
        "title": "New Message",
        "message": "You have a new message from John",
        "delivered": true,
        "delivered_at": "2024-01-15T10:30:00Z",
        "read": false,
        "read_at": null,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    }
  }
}
```

### PATCH /notifications/:id/read

Mark a notification as read.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "type": "message",
    "title": "New Message",
    "message": "You have a new message from John",
    "delivered": true,
    "delivered_at": "2024-01-15T10:30:00Z",
    "read": true,
    "read_at": "2024-01-15T10:35:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

### GET /notifications/unread/count

Get unread notifications count.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Unread count retrieved successfully",
  "data": {
    "count": 5
  }
}
```

## WebSocket Events

### Connection

Connect to WebSocket namespace: `/notifications`

**Authentication:**

```javascript
const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

### Events

#### Server to Client

**notification_received**

```json
{
  "event": "notification_received",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "type": "message",
    "title": "New Message",
    "message": "You have a new message from John",
    "delivered": true,
    "delivered_at": "2024-01-15T10:30:00Z",
    "read": false,
    "read_at": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "507f1f77bcf86cd799439012"
}
```

**user_connected**

```json
{
  "event": "user_connected",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "socketId": "socket_123"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Client to Server

**mark_notification_read**

```javascript
socket.emit('mark_notification_read', {
  notificationId: '507f1f77bcf86cd799439011',
});
```

## RabbitMQ Integration

### Message Format

```json
{
  "user_id": "507f1f77bcf86cd799439012",
  "type": "message",
  "title": "New Message",
  "message": "You have a new message from John",
  "delivered": false,
  "delivered_at": null,
  "read": false,
  "read_at": null
}
```

### Queue Configuration

- **Queue Name**: `notification_queue`
- **Pattern**: `create_notification`
- **Durability**: `true`

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/notifications

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-jwt-secret-key

# RabbitMQ
RABBITMQ_URI=amqp://localhost:5672

# Application
PORT=3000
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB
- Redis
- RabbitMQ

### Installation

```bash
# Install dependencies
npm install

# Start the service
npm run start:dev:notification
```

### Docker Setup

```bash
# Start dependencies
docker-compose up -d mongodb redis rabbitmq

# Start the service
npm run start:dev:notification
```

## Development

### Project Structure

```
src/
├── controllers/           # HTTP and RabbitMQ controllers
├── dto/                  # Data Transfer Objects
├── gateways/             # WebSocket gateways
├── infrastructure/       # External service integrations
├── interfaces/           # TypeScript interfaces
├── schema/              # MongoDB schemas
├── services/            # Business logic services
├── common/              # Shared utilities
└── main.ts              # Application entry point
```

### Code Quality

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Swagger**: API documentation

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Production Deployment

### Environment Setup

```bash
# Set production environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb://prod-mongo:27017/notifications
export REDIS_HOST=prod-redis
export RABBITMQ_URI=amqp://prod-rabbitmq:5672
export JWT_SECRET=your-production-secret
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Health Checks

- **HTTP**: `GET /notifications/health`
- **WebSocket**: Connection status
- **Database**: MongoDB connection
- **Redis**: Redis connection
- **RabbitMQ**: Queue connectivity

## Monitoring & Logging

### Logging

- **Structured Logging**: JSON format
- **Log Levels**: ERROR, WARN, LOG, DEBUG
- **Context**: Request ID, User ID, Timestamp

### Metrics

- **Connection Count**: Active WebSocket connections
- **Message Throughput**: Notifications per second
- **Error Rate**: Failed operations percentage
- **Response Time**: API endpoint performance

## Security

### Authentication

- **JWT Tokens**: Stateless authentication
- **Token Expiration**: 24-hour default
- **Secure Headers**: CORS, Helmet

### Authorization

- **User Isolation**: Users can only access their notifications
- **Input Validation**: DTO validation with class-validator
- **SQL Injection**: MongoDB ODM protection

## Performance

### Optimization

- **Connection Pooling**: MongoDB and Redis
- **Pagination**: Efficient data retrieval
- **Caching**: Redis for socket management
- **Async Processing**: RabbitMQ for scalability

### Scaling

- **Horizontal Scaling**: Redis-based socket management
- **Load Balancing**: Multiple service instances
- **Queue Processing**: Distributed message handling

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**

```bash
# Check JWT token validity
# Verify CORS configuration
# Check Redis connectivity
```

**RabbitMQ Message Not Processed**

```bash
# Check queue configuration
# Verify message format
# Check service logs
```

**Database Connection Issues**

```bash
# Verify MongoDB URI
# Check network connectivity
# Verify authentication
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=notification:*

# Start with debug
npm run start:debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
