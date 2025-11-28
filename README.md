# Decode Backend v2

A production-ready microservices architecture built with NestJS, providing authentication, user management, social relationships, wallet integration, and real-time notifications for the Decode Network platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

Decode Backend v2 is a comprehensive microservices platform designed to power social networking features with Web3 wallet integration. The system is built using NestJS 11 and follows modern microservices patterns with clear service boundaries, asynchronous messaging, and comprehensive observability.

### Key Features

- **Authentication & Authorization**: Multi-factor authentication, device fingerprinting, session management, and JWT-based security
- **User Management**: Profile management, username/email workflows, privacy controls, and account deactivation
- **Social Graph**: Follow/unfollow relationships, blocking, mutual connections, and interest-based recommendations using Neo4j
- **Wallet Integration**: Web3 wallet linking, signature verification, and primary wallet management
- **Real-time Notifications**: WebSocket-based push notifications with RabbitMQ-backed message queue
- **Email Processing**: Asynchronous email delivery with template rendering and SMTP integration
- **Data Synchronization**: Automatic synchronization between MongoDB (document store) and Neo4j (graph database)
- **Observability**: Comprehensive Datadog APM integration with distributed tracing, custom metrics, and logging

## Architecture

### Core Microservices

| Service | Port | Description | Key Responsibilities |
|---------|------|-------------|---------------------|
| **API Gateway** | 4000 | Single entry point | Request routing, authentication, rate limiting, Swagger docs |
| **Auth Service** | 4001 | Authentication & authorization | Registration, login, MFA, device fingerprinting, session management |
| **User Service** | 4002 | User management | Profile CRUD, username/email updates, search, account deactivation |
| **Email Worker** | 4003 | Email processing | Consumes RabbitMQ email jobs, renders templates, sends SMTP emails |
| **Relationship Service** | 4004 | Social graph | Follow/unfollow, blocking, mutual connections, recommendations |
| **Wallet Service** | 4005 | Wallet management | Wallet linking, signature verification, primary wallet selection |
| **Notification Service** | 4006 | Real-time notifications | Notification storage, WebSocket push, RabbitMQ consumer |
| **Neo4j DB Sync** | 4007 | Data synchronization | Syncs MongoDB user documents to Neo4j graph nodes |

### Infrastructure Services

| Service | Port | Description | Used By |
|---------|------|-------------|---------|
| **MongoDB** | 27017 | Primary document database | All services (users, wallets, notifications, sessions) |
| **Redis** | 6379 | Caching & session storage | API Gateway, Auth, User, Wallet, Notification, Relationship |
| **Neo4j** | 7474/7687 | Graph database | Relationship Service, Neo4j DB Sync |
| **RabbitMQ** | 5672/15672 | Message broker | Auth, Email Worker, Notification, Relationship, Neo4j Sync |

For detailed architecture documentation, see [C4 Architecture Documentation](docs/C4.md).

## Technology Stack

### Backend Framework
- **NestJS 11** - Progressive Node.js framework
- **TypeScript 5.7** - Type-safe development
- **Node.js 18** - Runtime environment

### Databases & Storage
- **MongoDB** - Primary document database
- **Neo4j** - Graph database for social relationships
- **Redis** - Caching and session storage

### Message Queue
- **RabbitMQ** - Asynchronous message processing

### Authentication & Security
- **JWT** - Token-based authentication
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **speakeasy** - Two-factor authentication (TOTP)

### Web3 Integration
- **ethers.js** - Ethereum wallet integration

### Real-time Communication
- **Socket.IO** - WebSocket server for real-time notifications

### Observability
- **Datadog APM** - Application performance monitoring
- **dd-trace** - Distributed tracing
- **hot-shots** - DogStatsD client for custom metrics

### Email
- **Nodemailer** - SMTP email delivery

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **ts-jest** - TypeScript preprocessor for Jest

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Git** for version control

### System Requirements

- **RAM**: 8GB+ recommended
- **Disk Space**: 20GB+ for Docker images and volumes
- **OS**: Linux, macOS, or Windows (with WSL2)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd decode-backend-v2
```

### 2. Environment Configuration

```bash
# Copy the environment template
cp docker.env.example .env

# Edit the .env file with your configuration
nano .env
```

Required environment variables:
- Database connection strings (MongoDB, Redis, Neo4j, RabbitMQ)
- JWT secrets (access token, session token, service token)
- SMTP configuration (host, port, user, password)
- Datadog API key (for observability)

### 3. Start All Services with Docker

```bash
# Start all services in production mode
docker-compose up -d

# Or start only infrastructure services for local development
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f api-gateway

# Test API Gateway health endpoint
curl http://localhost:4000/health

# Access Swagger documentation
open http://localhost:4000/docs
```

For detailed Docker deployment instructions, see [Docker Deployment Guide](docs/DOCKER.md).

## Development Setup

### Local Development (Without Docker)

1. **Start Infrastructure Services Only**

```bash
# Start databases and message queues
docker-compose -f docker-compose.dev.yml up -d
```

2. **Install Dependencies**

```bash
npm install
```

3. **Run Individual Services**

```bash
# Start API Gateway in watch mode
npm run start:dev:api-gateway

# Start Auth Service in watch mode
npm run start:dev:auth

# Start User Service in watch mode
npm run start:dev:user

# ... and so on for other services
```

4. **Run All Services (Development)**

```bash
# Start all services in watch mode (parallel)
npm run start:dev:all
```

### Development URLs

- **API Gateway**: http://localhost:4000
- **Swagger Documentation**: http://localhost:4000/docs
- **Auth Service**: http://localhost:4001
- **User Service**: http://localhost:4002
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379
- **Neo4j Browser**: http://localhost:7474
- **RabbitMQ Management**: http://localhost:15672 (admin/password)

### Available Scripts

```bash
# Build
npm run build                    # Build all services
npm run build:api-gateway        # Build specific service

# Development
npm run start:dev:api-gateway    # Start service in watch mode
npm run start:dev:all            # Start all services in watch mode

# Production
npm run start:api-gateway        # Start service in production mode
npm run start:all                # Start all services

# Code Quality
npm run lint                     # Run ESLint
npm run format                   # Format code with Prettier

# Testing
npm run test                     # Run all tests
npm run test:unit                # Run unit tests
npm run test:e2e:new             # Run E2E tests
npm run test:cov                 # Run tests with coverage
npm run test:watch               # Run tests in watch mode
```

## Testing

The project includes comprehensive test coverage across all microservices.

### Running Tests

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run E2E tests
npm run test:e2e:new

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

Current test coverage targets:
- **Auth Service**: ≥ 70% (critical paths)
- **API Gateway**: ≥ 60% (guards/interceptors)
- **User & Relationship Services**: ≥ 60% (service logic)
- **Other Services**: ≥ 50% (growing as features stabilize)

### Test Results

- **Total Test Suites**: 32
- **Total Test Cases**: 487
- **Pass Rate**: 100%
- **Overall Coverage**: 69.3% (statements), 64.0% (branches), 72.2% (functions)

For detailed testing strategy and guidelines, see [Testing & QA Strategy](docs/TESTING_STRATEGY.md).

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Architecture & Design
- [C4 Architecture Documentation](docs/C4.md) - Container and component views
- [Diagram Reference](docs/diagrams/DECODE_DIAGRAM.md) - Complete list of system diagrams

### Deployment & Operations
- [Docker Deployment Guide](docs/DOCKER.md) - Docker setup and deployment
- [Docker CI/CD Pipeline](docs/DOCKER_CICD.md) - CI/CD pipeline documentation
- [GitHub Secrets Configuration](docs/GITHUB_SECRETS.md) - Required GitHub secrets

### Observability
- [Datadog Implementation](docs/DD_IMPLEMENTATION.md) - APM, metrics, and logging setup
- [Datadog Dashboard Setup](docs/DD_DASHBOARD.md) - Dashboard configuration guide
- [Datadog APM Troubleshooting](docs/DD_APM_TROUBLESHOOTING.md) - Common issues and solutions

### Testing
- [Testing & QA Strategy](docs/TESTING_STRATEGY.md) - Testing approach and guidelines
- [Test Execution Report](docs/TEST.md) - Latest test results and coverage

### Flow Diagrams
- [Authentication & Registration Flows](docs/diagrams/AUTH_AND_REGISTRATION.md) - Auth flow documentation
- [Async Processing Flows](docs/diagrams/ASYNC_PROCESSING_FLOWS.md) - Notification, email, and sync flows
- [Service & Request Routing](docs/diagrams/SERVICE_AND_REQUEST_ROUTING.md) - Request routing patterns
- [Session Management](docs/diagrams/SESSION_MANAGEMENT.md) - Session lifecycle
- [User Profile Aggregation](docs/diagrams/USER_PROFILE_AGGREGATION.md) - Profile data flow
- [Infrastructure & Operations](docs/diagrams/INFRASTRUCTURE_AND_OPERATIONS.md) - Infrastructure diagrams
- [Use Cases](docs/diagrams/USECASE.md) - Use case documentation
- [ERD](docs/diagrams/ERD.md) - Entity relationship diagrams

## Project Structure

```
decode-backend-v2/
├── apps/                          # Microservices
│   ├── api-gateway/               # API Gateway (Port 4000)
│   ├── auth/                      # Auth Service (Port 4001)
│   ├── user/                      # User Service (Port 4002)
│   ├── email-worker/              # Email Worker (Port 4003)
│   ├── relationship/              # Relationship Service (Port 4004)
│   ├── wallet/                    # Wallet Service (Port 4005)
│   ├── notification/              # Notification Service (Port 4006)
│   └── neo4jdb-sync/              # Neo4j Sync Service (Port 4007)
├── docs/                          # Documentation
│   ├── C4.md                      # Architecture documentation
│   ├── DOCKER.md                   # Docker deployment guide
│   ├── TESTING_STRATEGY.md         # Testing guidelines
│   ├── DD_IMPLEMENTATION.md        # Datadog observability
│   └── diagrams/                   # Flow diagrams and ERDs
├── tests/                         # Test suites
│   ├── unit/                       # Unit tests
│   ├── e2e/                        # End-to-end tests
│   └── reporters/                 # Custom test reporters
├── scripts/                       # Deployment and utility scripts
├── docker-compose.yml              # Production Docker Compose
├── docker-compose.dev.yml          # Development Docker Compose
├── docker-compose.prod.yml         # Production Docker Compose
├── package.json                    # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

### Service Structure

Each microservice follows a consistent structure:

```
apps/<service-name>/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── <service>.module.ts        # Root module
│   ├── <service>.controller.ts    # REST/WebSocket controllers
│   ├── services/                   # Business logic services
│   ├── dto/                       # Data transfer objects
│   ├── common/                     # Shared utilities
│   ├── config/                     # Configuration
│   ├── infrastructure/             # External service clients
│   └── interfaces/                 # TypeScript interfaces
├── Dockerfile                      # Service-specific Dockerfile
└── tsconfig.app.json              # Service-specific TS config
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code style
   - Write tests for new features
   - Update documentation as needed

3. **Run Tests and Linting**
   ```bash
   npm run lint
   npm run test
   npm run test:cov
   ```

4. **Commit Your Changes**
   - Use conventional commit messages
   - Example: `feat(auth): add device fingerprinting`

5. **Create a Pull Request**
   - Link to related issues
   - Include a description of changes
   - Ensure all CI checks pass

### Code Standards

- **TypeScript**: Strict mode enabled, no implicit any
- **ESLint**: Follow project ESLint configuration
- **Prettier**: Auto-format on save
- **Testing**: Maintain or improve test coverage
- **Documentation**: Update relevant docs for new features

### Testing Requirements

- All new features must include unit tests
- Critical paths require integration tests
- E2E tests for user-facing flows
- Maintain minimum coverage thresholds

For more details, see [Testing & QA Strategy](docs/TESTING_STRATEGY.md).

## License

This project is private and proprietary. See `package.json` for license details.

---

**Last Updated**: 2024
**Maintained By**: Decode Development Team

For questions or support, please refer to the documentation in the `docs/` directory or contact the development team.
