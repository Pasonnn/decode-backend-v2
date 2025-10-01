# 🚀 Decode Backend v2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red.svg)](https://nestjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

A modern, scalable microservices backend built with NestJS, featuring authentication, user management, real-time notifications, social relationships, and Web3 wallet integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Services](#services)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Configuration](#configuration)
- [Security](#security)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Overview

Decode Backend v2 is a comprehensive microservices architecture designed for modern Web3 applications. It provides a robust foundation for building scalable social platforms with integrated wallet functionality, real-time notifications, and advanced user management.

### Key Highlights

- **🔐 Advanced Authentication**: JWT-based auth with device fingerprinting and session management
- **👥 Social Features**: User relationships, following, blocking, and mutual connections
- **💰 Web3 Integration**: Wallet management with Ethereum support
- **📱 Real-time Notifications**: WebSocket-based notifications with RabbitMQ queuing
- **📧 Email System**: Comprehensive email templates and SMTP integration
- **🔄 Graph Database**: Neo4j integration for complex relationship queries
- **🐳 Docker Ready**: Complete containerization with production-ready configurations
- **🚀 CI/CD Pipeline**: Automated deployment with zero-downtime capabilities

## 🏛️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Auth Service  │    │  User Service   │
│   Port: 4000    │    │   Port: 4001    │    │   Port: 4002    │
│   (Entry Point) │    │ (Authentication)│    │ (User Management)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Email Worker    │    │ Relationship    │    │ Wallet Service  │
│ Port: 4003      │    │ Port: 4004      │    │ Port: 4005      │
│ (Email System)  │    │ (Social Graph)  │    │ (Web3 Wallets)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Notification    │    │ Neo4j DB Sync   │    │    MongoDB      │
│ Port: 4006      │    │ Port: 4007      │    │ Port: 27017     │
│ (Real-time)     │    │ (Graph Sync)    │    │ (Primary DB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │     Neo4j       │    │   RabbitMQ      │
│ Port: 6379      │    │ Port: 7474/7687 │    │ Port: 5672/15672│
│ (Cache/Sessions)│    │ (Graph Database)│    │ (Message Queue) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### 🔐 Authentication & Security

- **JWT-based Authentication** with access and session tokens
- **Device Fingerprinting** for enhanced security
- **Multi-factor Authentication** via email verification
- **Session Management** with active session tracking
- **Password Security** with bcrypt hashing
- **Rate Limiting** and request validation

### 👥 User Management

- **User Profiles** with comprehensive profile management
- **Account Settings** including username and email changes
- **Account Deactivation** with data retention policies
- **Profile Privacy** controls and visibility settings

### 🌐 Social Features

- **User Relationships** with follow/unfollow functionality
- **Blocking System** for user safety
- **Mutual Connections** discovery
- **Follower Snapshots** for analytics
- **Graph-based Queries** using Neo4j

### 💰 Web3 Integration

- **Wallet Management** with Ethereum support
- **Wallet Linking** to user accounts
- **Primary Wallet** designation
- **Crypto Utilities** for address validation
- **Secure Wallet Operations** with authentication

### 📱 Real-time Notifications

- **WebSocket Integration** for real-time delivery
- **Notification Queuing** via RabbitMQ
- **Multiple Notification Types** (messages, alerts, updates)
- **Read/Unread Status** tracking
- **Pagination** for large notification lists

### 📧 Email System

- **Comprehensive Email Templates** for all user actions
- **SMTP Integration** with Gmail support
- **Email Verification** for account security
- **Password Reset** via email
- **Device Verification** notifications

### 🔄 Data Synchronization

- **MongoDB to Neo4j Sync** for graph relationships
- **Real-time Data Consistency** across services
- **Automated Sync Jobs** with error handling
- **Data Validation** and integrity checks

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **Docker** 20.10+ and Docker Compose 2.0+
- **MongoDB** (cloud or local)
- **Redis** (cloud or local)
- **Neo4j** (cloud or local)
- **RabbitMQ** (cloud or local)

### 1. Clone the Repository

```bash
git clone https://github.com/Decode-Labs-Web3/decode-backend-v2.git
cd decode-backend-v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy the environment template
cp docker.env.example .env

# Edit with your configuration
nano .env
```

### 4. Start with Docker (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 5. Verify Installation

```bash
# Test API Gateway
curl http://localhost:4000/health

# Test Auth Service
curl http://localhost:4001/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f api-gateway
```

## 🛠️ Services

### API Gateway (Port 4000)

- **Main entry point** for all client requests
- **Request routing** to appropriate microservices
- **Authentication middleware** and request validation
- **Rate limiting** and security headers
- **Swagger documentation** at `/docs`

### Auth Service (Port 4001)

- **User authentication** and authorization
- **JWT token management** (access & session tokens)
- **Device fingerprinting** and security
- **Password management** and reset functionality
- **Session tracking** and management

### User Service (Port 4002)

- **User profile management**
- **Account settings** and preferences
- **Email and username changes**
- **Account deactivation**
- **Profile privacy controls**

### Email Worker (Port 4003)

- **Email template management**
- **SMTP integration** and sending
- **Email verification** workflows
- **Password reset** notifications
- **Device verification** emails

### Relationship Service (Port 4004)

- **Social relationship management**
- **Follow/unfollow** functionality
- **User blocking** system
- **Mutual connections** discovery
- **Graph-based queries** with Neo4j

### Wallet Service (Port 4005)

- **Web3 wallet integration**
- **Ethereum wallet management**
- **Wallet linking** to user accounts
- **Primary wallet** designation
- **Crypto address validation**

### Notification Service (Port 4006)

- **Real-time notifications** via WebSocket
- **Notification queuing** with RabbitMQ
- **Read/unread status** tracking
- **Pagination** and filtering
- **Multiple notification types**

### Neo4j DB Sync (Port 4007)

- **MongoDB to Neo4j synchronization**
- **Real-time data consistency**
- **Graph relationship management**
- **Automated sync jobs**
- **Data validation** and integrity

## 📚 API Documentation

### Authentication Endpoints

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email_or_username": "user@example.com",
  "password": "SecurePassword123!",
  "fingerprint_hashed": "abc123def456..."
}
```

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePassword123!"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <access_token>
```

### User Management

#### Get User Profile

```http
GET /users/profile/:user_id
Authorization: Bearer <access_token>
```

#### Update Profile

```http
PATCH /users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "display_name": "New Display Name",
  "bio": "Updated bio"
}
```

### Social Features

#### Follow User

```http
POST /relationship/follow
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id": "target_user_id"
}
```

#### Get Followers

```http
GET /relationship/followers/:user_id?page=0&limit=10
Authorization: Bearer <access_token>
```

### Wallet Management

#### Link Wallet

```http
POST /wallet/link
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "wallet_address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

#### Get User Wallets

```http
GET /wallet/list
Authorization: Bearer <access_token>
```

### Notifications

#### Get Notifications

```http
GET /notifications?page=0&limit=10
Authorization: Bearer <access_token>
```

#### Mark as Read

```http
PATCH /notifications/:id/read
Authorization: Bearer <access_token>
```

### WebSocket Events

#### Connect to Notifications

```javascript
const socket = io('http://localhost:4006/notifications', {
  auth: {
    token: 'your-jwt-token',
  },
});

// Listen for notifications
socket.on('notification_received', (data) => {
  console.log('New notification:', data);
});
```

## 🛠️ Development

### Local Development Setup

```bash
# Start only infrastructure services
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Start services in development mode
npm run start:dev:api-gateway
npm run start:dev:auth
npm run start:dev:user
# ... etc
```

### Available Scripts

```bash
# Build all services
npm run build:all

# Start individual services
npm run start:api-gateway
npm run start:auth
npm run start:user

# Development mode with hot reload
npm run start:dev:api-gateway
npm run start:dev:auth

# Testing
npm run test
npm run test:cov
npm run test:e2e

# Linting and formatting
npm run lint
npm run format
```

### Project Structure

```
decode-backend-v2/
├── apps/                          # Microservices
│   ├── api-gateway/              # Main API gateway
│   ├── auth/                     # Authentication service
│   ├── user/                     # User management
│   ├── email-worker/             # Email processing
│   ├── relationship/             # Social features
│   ├── wallet/                   # Web3 wallet management
│   ├── notification/             # Real-time notifications
│   └── neo4jdb-sync/            # Graph database sync
├── scripts/                      # Deployment and utility scripts
├── .github/workflows/            # CI/CD pipelines
├── docker-compose.prod.yml       # Production Docker setup
├── docker-compose.dev.yml        # Development Docker setup
└── docs/                         # Documentation
```

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Development with Docker

```bash
# Start only databases
docker-compose -f docker-compose.dev.yml up -d

# Run services locally
npm run start:dev:all
```

### Docker Commands

```bash
# Build specific service
docker-compose -f docker-compose.prod.yml build api-gateway

# Restart service
docker-compose -f docker-compose.prod.yml restart auth

# Scale service
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3

# Clean up
docker-compose -f docker-compose.prod.yml down -v
```

## 🚀 CI/CD Pipeline

### Automated Deployment

The project includes a comprehensive CI/CD pipeline with:

- **GitHub Actions** workflows for automated testing and deployment
- **Docker image building** and registry management
- **Zero-downtime deployments** with blue-green strategy
- **Health checks** and automated rollback
- **Security scanning** with Trivy
- **Multi-environment** support (staging/production)

### Deployment Scripts

```bash
# Deploy to production
./scripts/deploy.sh production latest --zero-downtime

# Health check
./scripts/health-check.sh production

# Rollback if needed
./scripts/rollback.sh production

# Monitor services
./scripts/monitor.sh
```

### GitHub Secrets Configuration

Configure these secrets in your GitHub repository:

```bash
# Server Access
STAGING_HOST=staging.yourdomain.com
STAGING_USER=deploy
STAGING_SSH_KEY=your-private-key

PRODUCTION_HOST=yourdomain.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=your-private-key

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## ⚙️ Configuration

### Environment Variables

Key configuration variables:

```bash
# Database URLs
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/
REDIS_URI=redis://:password@host:6379/0
NEO4J_URI=neo4j+s://host:7687
RABBITMQ_URI=amqp://user:pass@host:5672/

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=your-secret
JWT_SESSION_TOKEN_SECRET=your-secret
JWT_SERVICE_TOKEN_SECRET=your-secret

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Service URLs (Docker)
AUTH_SERVICE_URL=http://auth:4001
USER_SERVICE_URL=http://user:4002
EMAIL_SERVICE_URL=http://email-worker:4003
RELATIONSHIP_SERVICE_URL=http://relationship:4004
WALLET_SERVICE_URL=http://wallet:4005
NOTIFICATION_SERVICE_URL=http://notification:4006
```

### Service Ports

| Service      | Port | Description             |
| ------------ | ---- | ----------------------- |
| API Gateway  | 4000 | Main API endpoint       |
| Auth Service | 4001 | Authentication          |
| User Service | 4002 | User management         |
| Email Worker | 4003 | Email processing        |
| Relationship | 4004 | Social features         |
| Wallet       | 4005 | Web3 wallets            |
| Notification | 4006 | Real-time notifications |
| Neo4j Sync   | 4007 | Graph sync              |

## 🔒 Security

### Authentication & Authorization

- **JWT tokens** with configurable expiration
- **Device fingerprinting** for enhanced security
- **Rate limiting** on all endpoints
- **Input validation** with class-validator
- **CORS configuration** for cross-origin requests

### Data Protection

- **Password hashing** with bcrypt
- **Environment variable encryption**
- **Secure headers** with Helmet
- **SQL injection protection** via MongoDB ODM
- **XSS protection** with input sanitization

### Infrastructure Security

- **Container security** with non-root users
- **Network isolation** with Docker networks
- **SSL/TLS encryption** for all communications
- **Firewall configuration** with UFW
- **Intrusion prevention** with Fail2ban

## 📊 Monitoring

### Health Checks

All services expose health check endpoints:

```bash
# Check service health
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Auth Service
curl http://localhost:4002/health  # User Service
# ... etc
```

### Logging

- **Structured logging** with JSON format
- **Request tracing** with unique request IDs
- **Error tracking** with stack traces
- **Performance metrics** and timing
- **Security event logging**

### Monitoring Tools

```bash
# Real-time monitoring
./scripts/monitor.sh

# Health check report
./scripts/health-check.sh production --report

# View service logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes with proper tests
4. **Run** the test suite: `npm run test`
5. **Commit** your changes: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Code Standards

- **TypeScript** for type safety
- **ESLint** and **Prettier** for code formatting
- **Jest** for testing
- **Conventional Commits** for commit messages
- **Comprehensive documentation** for new features

### Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run specific service tests
npm run test -- --testPathPattern=auth
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- [Docker Deployment Guide](DOCKER.md)
- [CI/CD Pipeline Documentation](DOCKER_CICD.md)
- [API Documentation](http://localhost:4000/docs) (when running)

### Getting Help

1. **Check the logs**: `docker-compose logs <service-name>`
2. **Run health checks**: `./scripts/health-check.sh production`
3. **Review documentation**: Check the docs folder
4. **Open an issue**: Use GitHub Issues for bugs and feature requests

### Community

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and community support
- **Pull Requests**: For code contributions

---

**Built with ❤️ by the Decode Labs Web3 Team**

_Empowering the future of decentralized social platforms_
