# Docker Deployment Guide for Decode Backend v2

This guide provides comprehensive instructions for dockerizing and deploying the Decode Backend microservices architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## 🏗️ Overview

The Decode Backend v2 is a microservices architecture consisting of:

- **API Gateway** (Port 4000) - Main entry point and routing
- **Auth Service** (Port 4001) - Authentication and authorization
- **User Service** (Port 4002) - User management
- **Email Worker** (Port 4003) - Email processing
- **Relationship Service** (Port 4004) - Social relationships
- **Wallet Service** (Port 4005) - Wallet management
- **Notification Service** (Port 4006) - Real-time notifications
- **Neo4j DB Sync** (Port 4007) - Graph database synchronization

### Infrastructure Services:

- **MongoDB** (Port 27017) - Primary database
- **Redis** (Port 6379) - Caching and sessions
- **Neo4j** (Ports 7474/7687) - Graph database
- **RabbitMQ** (Ports 5672/15672) - Message queue

## 🔧 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB+ RAM recommended
- 20GB+ disk space

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd decode-backend-v2
```

### 2. Environment Configuration

```bash
# Copy the Docker environment template
cp docker.env.example .env

# Edit the .env file with your configuration
nano .env
```

### 3. Start All Services

```bash
# Start all services in production mode
docker-compose up -d

# Or start only databases for development
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f api-gateway

# Test API Gateway
curl http://localhost:4000/health
```

## 🏛️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Auth Service  │    │  User Service   │
│   Port: 4000    │    │   Port: 4001    │    │   Port: 4002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Email Worker    │    │ Relationship    │    │ Wallet Service  │
│ Port: 4003      │    │ Port: 4004      │    │ Port: 4005      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Notification    │    │ Neo4j DB Sync   │    │    MongoDB      │
│ Port: 4006      │    │ Port: 4007      │    │ Port: 27017     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │     Neo4j       │    │   RabbitMQ      │
│ Port: 6379      │    │ Port: 7474/7687 │    │ Port: 5672/15672│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ⚙️ Configuration

### Environment Variables

Key environment variables for Docker deployment:

```bash
# Database URLs (use service names for internal communication)
MONGO_URI=mongodb://admin:password@mongodb:27017/decode?authSource=admin
REDIS_URI=redis://redis:6379/0
NEO4J_URI=bolt://neo4j:7687
RABBITMQ_URI=amqp://admin:password@rabbitmq:5672/

# Service URLs (internal Docker communication)
AUTH_SERVICE_URL=http://auth:4001
USER_SERVICE_URL=http://user:4002
WALLET_SERVICE_URL=http://wallet:4005
RELATIONSHIP_SERVICE_URL=http://relationship:4004
NOTIFICATION_SERVICE_URL=http://notification:4006
EMAIL_SERVICE_URL=http://email-worker:4003

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_TOKEN_SECRET=DecodeNetwork2025Access
JWT_SESSION_TOKEN_SECRET=DecodeNetwork2025Refresh
JWT_SERVICE_TOKEN_SECRET=DecodeNetwork2025ServicesCommunication
```

### Port Mapping

| Service      | Internal Port | External Port | Description             |
| ------------ | ------------- | ------------- | ----------------------- |
| API Gateway  | 4000          | 4000          | Main API endpoint       |
| Auth Service | 4001          | 4001          | Authentication          |
| User Service | 4002          | 4002          | User management         |
| Email Worker | 4003          | 4003          | Email processing        |
| Relationship | 4004          | 4004          | Social features         |
| Wallet       | 4005          | 4005          | Wallet operations       |
| Notification | 4006          | 4006          | Real-time notifications |
| Neo4j Sync   | 4007          | 4007          | Graph sync              |
| MongoDB      | 27017         | 27017         | Database                |
| Redis        | 6379          | 6379          | Cache                   |
| Neo4j HTTP   | 7474          | 7474          | Graph UI                |
| Neo4j Bolt   | 7687          | 7687          | Graph protocol          |
| RabbitMQ     | 5672          | 5672          | Message queue           |
| RabbitMQ UI  | 15672         | 15672         | Management UI           |

## 🛠️ Development Setup

### 1. Start Only Infrastructure

```bash
# Start databases and message queues only
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps
```

### 2. Run Services Locally

```bash
# Install dependencies
npm install

# Start individual services in development mode
npm run start:dev:api-gateway
npm run start:dev:auth
npm run start:dev:user
# ... etc
```

### 3. Development URLs

- **API Gateway**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/docs
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379
- **Neo4j Browser**: http://localhost:7474
- **RabbitMQ Management**: http://localhost:15672 (admin/password)

## 🚀 Production Deployment

### 1. Security Configuration

```bash
# Generate strong secrets
openssl rand -base64 32  # For JWT secrets
openssl rand -base64 16  # For database passwords

# Update .env with production values
nano .env
```

### 2. Production Build

```bash
# Build all services
docker-compose build

# Start in production mode
docker-compose up -d
```

### 3. SSL/TLS Setup (Recommended)

```bash
# Add SSL certificates to docker-compose.yml
# Use nginx or traefik as reverse proxy
```

### 4. Resource Limits

```yaml
# Add to docker-compose.yml services
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

All services expose health check endpoints:

```bash
# Check individual services
curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Auth Service
curl http://localhost:4002/health  # User Service
# ... etc
```

### Docker Health Checks

```bash
# View health status
docker-compose ps

# Check specific service health
docker inspect decode-api-gateway | grep -A 10 Health
```

### Logging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs -f api-gateway

# View logs with timestamps
docker-compose logs -f -t api-gateway
```

### Monitoring Commands

```bash
# Resource usage
docker stats

# Container status
docker-compose ps

# Service dependencies
docker-compose config
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :4000

# Stop conflicting services
sudo systemctl stop <service-name>
```

#### 2. Database Connection Issues

```bash
# Check database status
docker-compose logs mongodb
docker-compose logs redis
docker-compose logs neo4j

# Test connections
docker exec -it decode-mongodb mongosh
docker exec -it decode-redis redis-cli ping
```

#### 3. Service Startup Failures

```bash
# Check service logs
docker-compose logs <service-name>

# Restart specific service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up -d --build <service-name>
```

#### 4. Memory Issues

```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory
```

### Debug Commands

```bash
# Enter container shell
docker exec -it decode-api-gateway sh

# Check environment variables
docker exec -it decode-api-gateway env

# View container processes
docker exec -it decode-api-gateway ps aux

# Check network connectivity
docker exec -it decode-api-gateway ping mongodb
```

## 🔒 Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Rotate JWT secrets regularly
- Use environment-specific configurations

### 2. Network Security

```yaml
# Use internal networks
networks:
  decode-network:
    driver: bridge
    internal: true # No external access
```

### 3. Container Security

- Run containers as non-root users
- Use read-only filesystems where possible
- Regularly update base images
- Scan images for vulnerabilities

### 4. Database Security

- Enable authentication for all databases
- Use strong passwords
- Limit network access
- Enable SSL/TLS connections

## 📝 Additional Commands

### Useful Docker Commands

```bash
# Clean up unused resources
docker system prune -a

# Remove all containers and volumes
docker-compose down -v

# Backup volumes
docker run --rm -v decode_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v decode_mongodb_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /data
```

### Development Workflow

```bash
# Quick restart for development
docker-compose restart api-gateway

# View real-time logs
docker-compose logs -f --tail=100 api-gateway

# Execute commands in running container
docker-compose exec api-gateway npm run lint
```

## 📞 Support

For issues and questions:

1. Check the logs: `docker-compose logs <service-name>`
2. Verify configuration: `docker-compose config`
3. Test connectivity: Use the health check endpoints
4. Review this documentation
5. Check the main project README.md

---

**Happy Dockerizing! 🐳**
