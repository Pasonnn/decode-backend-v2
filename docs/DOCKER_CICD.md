# 🚀 Docker CI/CD Pipeline Documentation

## 📋 Overview

This document describes the comprehensive CI/CD pipeline for deploying Decode Backend v2 microservices using Docker containers to cloud infrastructure.

## 🏗️ Architecture

### Pipeline Components

1. **GitHub Actions Workflows**
   - `docker-cicd.yml` - Main CI/CD pipeline
   - `docker-registry.yml` - Registry management
   - `dev_env_cicd.yml` - Development environment

2. **Deployment Scripts**
   - `deploy.sh` - Zero-downtime deployment
   - `health-check.sh` - Comprehensive health monitoring
   - `rollback.sh` - Emergency rollback
   - `monitor.sh` - Real-time monitoring
   - `setup-server.sh` - Server initialization

3. **Docker Configuration**
   - Multi-stage Dockerfiles for each service
   - Production docker-compose configuration
   - Health checks and monitoring

## 🔄 CI/CD Pipeline Flow

### 1. Build and Test Stage

```mermaid
graph LR
    A[Code Push] --> B[Build Images]
    B --> C[Security Scan]
    C --> D[Push to Registry]
    D --> E[Deploy to Staging]
    E --> F[Health Checks]
    F --> G[Deploy to Production]
```

### 2. Deployment Stages

- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch or tags
- **Manual**: Workflow dispatch for rollbacks

## 📁 File Structure

```
.github/workflows/
├── docker-cicd.yml          # Main CI/CD pipeline
├── docker-registry.yml      # Registry management
└── dev_env_cicd.yml         # Development environment

scripts/
├── deploy.sh                # Deployment script
├── health-check.sh          # Health monitoring
├── rollback.sh              # Rollback script
├── monitor.sh               # Real-time monitoring
├── setup-server.sh          # Server setup
├── docker-setup.sh          # Docker setup
└── mongo-init.js            # Database initialization

Docker Configuration:
├── Dockerfile               # Base multi-stage Dockerfile
├── docker-compose.prod.yml  # Production configuration
├── docker-compose.dev.yml   # Development configuration
└── .dockerignore            # Docker ignore file
```

## 🚀 Quick Start

### 1. Server Setup

```bash
# On your cloud server (run as root)
curl -fsSL https://raw.githubusercontent.com/your-repo/decode-backend-v2/main/scripts/setup-server.sh | bash -s production yourdomain.com admin@yourdomain.com
```

### 2. Application Deployment

```bash
# Switch to application user
su - decode

# Clone repository
git clone https://github.com/your-repo/decode-backend-v2.git /opt/decode-backend
cd /opt/decode-backend

# Configure environment
cp docker.env.example .env
# Edit .env with your production values

# Deploy
./scripts/deploy.sh production latest --zero-downtime
```

### 3. Monitoring

```bash
# Real-time monitoring
./scripts/monitor.sh

# Health check
./scripts/health-check.sh production

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Configuration

### Environment Variables

Required environment variables for production:

```bash
# Database and External Services
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/
REDIS_URI=redis://:password@host:6379/0
RABBITMQ_URI=amqp://user:pass@host:5672/
NEO4J_URI=neo4j+s://host:7687

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=your-secret
JWT_SESSION_TOKEN_SECRET=your-secret
JWT_SERVICE_TOKEN_SECRET=your-secret

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Service URLs (for Docker)
AUTH_SERVICE_URL=http://auth:4001
USER_SERVICE_URL=http://user:4002
EMAIL_SERVICE_URL=http://email-worker:4003
RELATIONSHIP_SERVICE_URL=http://relationship:4004
WALLET_SERVICE_URL=http://wallet:4005
NOTIFICATION_SERVICE_URL=http://notification:4006
```

### GitHub Secrets

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

## 🚀 Deployment Commands

### Manual Deployment

```bash
# Deploy to production with zero downtime
./scripts/deploy.sh production v1.2.3 --zero-downtime

# Deploy to staging with downtime
./scripts/deploy.sh staging latest --with-downtime

# Check deployment status
./scripts/deploy.sh production --status
```

### Rollback

```bash
# List available backups
./scripts/rollback.sh production --list

# Rollback to most recent backup
./scripts/rollback.sh production

# Rollback to specific backup
./scripts/rollback.sh production 2
```

### Health Monitoring

```bash
# Comprehensive health check
./scripts/health-check.sh production

# Generate health report
./scripts/health-check.sh production --report

# Real-time monitoring
./scripts/monitor.sh 10  # 10-second refresh
```

## 🔍 Monitoring and Logging

### Health Checks

Each service exposes a `/health` endpoint:

- **API Gateway**: `http://localhost:4000/health`
- **Auth Service**: `http://localhost:4001/health`
- **User Service**: `http://localhost:4002/health`
- **Email Worker**: `http://localhost:4003/health`
- **Relationship Service**: `http://localhost:4004/health`
- **Wallet Service**: `http://localhost:4005/health`
- **Notification Service**: `http://localhost:4006/health`
- **Neo4j DB Sync**: `http://localhost:4007/health`

### Log Locations

- **Application Logs**: `/var/log/decode-backend/`
- **Docker Logs**: `docker-compose logs -f`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

### Monitoring Dashboard

Access the monitoring dashboard:

```bash
# Start monitoring
./scripts/monitor.sh

# View service status
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats
```

## 🛡️ Security Features

### 1. Container Security

- Multi-stage builds to minimize attack surface
- Non-root user in containers
- Security scanning with Trivy
- Regular base image updates

### 2. Network Security

- Firewall configuration (UFW)
- Fail2ban for intrusion prevention
- Rate limiting in Nginx
- SSL/TLS encryption

### 3. Application Security

- Environment variable encryption
- JWT token security
- Input validation and sanitization
- CORS configuration

## 🔄 Zero-Downtime Deployment

The deployment script supports zero-downtime deployments:

1. **Blue-Green Deployment**: New containers start alongside existing ones
2. **Health Verification**: New containers must pass health checks
3. **Traffic Switching**: Old containers are scaled down after verification
4. **Rollback Capability**: Automatic rollback if health checks fail

## 📊 Performance Optimization

### 1. Docker Optimization

- Multi-stage builds for smaller images
- Layer caching for faster builds
- Health checks for container monitoring
- Resource limits and reservations

### 2. Application Optimization

- Connection pooling for databases
- Redis caching for session management
- Load balancing with Nginx
- Compression and minification

## 🚨 Troubleshooting

### Common Issues

1. **Service Unavailable Errors**

   ```bash
   # Check service health
   ./scripts/health-check.sh production

   # Check logs
   docker-compose -f docker-compose.prod.yml logs service-name
   ```

2. **Database Connection Issues**

   ```bash
   # Test database connectivity
   docker exec decode-api-gateway node -e "console.log('Testing DB connection...')"
   ```

3. **High Resource Usage**

   ```bash
   # Monitor resource usage
   ./scripts/monitor.sh

   # Check container stats
   docker stats
   ```

### Emergency Procedures

1. **Service Down**

   ```bash
   # Restart specific service
   docker-compose -f docker-compose.prod.yml restart service-name
   ```

2. **Complete System Failure**

   ```bash
   # Emergency rollback
   ./scripts/rollback.sh production
   ```

3. **Database Issues**
   ```bash
   # Check database logs
   docker logs decode-mongodb
   docker logs decode-redis
   ```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale API Gateway
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3

# Scale Auth Service
docker-compose -f docker-compose.prod.yml up -d --scale auth=2
```

### Load Balancer Configuration

Update Nginx configuration for multiple instances:

```nginx
upstream api_gateway {
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
}
```

## 🔧 Maintenance

### Regular Tasks

1. **Weekly**
   - Review security logs
   - Check disk space
   - Update dependencies

2. **Monthly**
   - Security updates
   - Performance review
   - Backup verification

3. **Quarterly**
   - Disaster recovery testing
   - Capacity planning
   - Security audit

### Backup Strategy

```bash
# Create backup
./scripts/deploy.sh production --backup

# Restore from backup
./scripts/rollback.sh production --restore backup-name
```

## 📞 Support

For issues and support:

1. Check the logs first
2. Run health checks
3. Review this documentation
4. Contact the development team

## 🎯 Best Practices

1. **Always test in staging first**
2. **Use zero-downtime deployments for production**
3. **Monitor health checks regularly**
4. **Keep backups up to date**
5. **Use semantic versioning for releases**
6. **Document all configuration changes**
7. **Regular security updates**
8. **Monitor resource usage**

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Decode Backend Team
