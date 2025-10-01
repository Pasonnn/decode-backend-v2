#!/bin/bash

# Deployment Script for Decode Backend v2
# This script handles zero-downtime deployment of Docker containers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
BACKUP_DIR="/opt/backups/decode-backend"
LOG_FILE="/var/log/decode-deploy.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if service is healthy
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Checking health of $service_name on port $port..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "$service_name failed health check after $max_attempts attempts"
    return 1
}

# Function to backup current deployment
backup_current_deployment() {
    print_status "Creating backup of current deployment..."

    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"

    mkdir -p "$backup_path"

    # Backup docker-compose files
    cp docker-compose.prod.yml "$backup_path/"
    cp .env "$backup_path/" 2>/dev/null || true

    # Backup current running containers info
    docker-compose -f docker-compose.prod.yml ps > "$backup_path/containers_info.txt"

    # Create backup manifest
    cat > "$backup_path/backup_manifest.txt" << EOF
Backup created: $(date)
Environment: $ENVIRONMENT
Image tag: $IMAGE_TAG
Git commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
EOF

    print_success "Backup created at $backup_path"
    echo "$backup_path" > /tmp/last_backup_path
}

# Function to pull latest images
pull_latest_images() {
    print_status "Pulling latest Docker images..."

    # Set image tag in environment
    export IMAGE_TAG="$IMAGE_TAG"

    # Pull images
    if docker-compose -f docker-compose.prod.yml pull; then
        print_success "Images pulled successfully"
    else
        print_error "Failed to pull images"
        exit 1
    fi
}

# Function to deploy with zero downtime
deploy_zero_downtime() {
    print_status "Starting zero-downtime deployment..."

    # Create new containers alongside existing ones
    docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=2 --scale auth=2 --no-recreate

    # Wait for new containers to be healthy
    print_status "Waiting for new containers to be ready..."
    sleep 30

    # Check health of new containers
    if ! check_service_health "API Gateway" 4000; then
        print_error "New API Gateway container is not healthy"
        rollback_deployment
        exit 1
    fi

    if ! check_service_health "Auth Service" 4001; then
        print_error "New Auth Service container is not healthy"
        rollback_deployment
        exit 1
    fi

    # Scale down old containers
    print_status "Scaling down old containers..."
    docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=1 --scale auth=1

    # Wait for old containers to stop
    sleep 10

    # Remove old containers
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans

    print_success "Zero-downtime deployment completed"
}

# Function to deploy with downtime
deploy_with_downtime() {
    print_status "Starting deployment with downtime..."

    # Stop all services
    docker-compose -f docker-compose.prod.yml down

    # Start services with new images
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30

    # Check health of all services
    local services=("4000:API Gateway" "4001:Auth Service" "4002:User Service" "4003:Email Worker" "4004:Relationship Service" "4005:Wallet Service" "4006:Notification Service" "4007:Neo4j DB Sync")

    for service in "${services[@]}"; do
        local port=$(echo $service | cut -d: -f1)
        local name=$(echo $service | cut -d: -f2-)

        if ! check_service_health "$name" "$port"; then
            print_error "Deployment failed - $name is not healthy"
            rollback_deployment
            exit 1
        fi
    done

    print_success "Deployment completed successfully"
}

# Function to rollback deployment
rollback_deployment() {
    print_status "Rolling back deployment..."

    local backup_path
    if [ -f /tmp/last_backup_path ]; then
        backup_path=$(cat /tmp/last_backup_path)
    else
        print_error "No backup path found"
        exit 1
    fi

    if [ ! -d "$backup_path" ]; then
        print_error "Backup directory not found: $backup_path"
        exit 1
    fi

    # Stop current services
    docker-compose -f docker-compose.prod.yml down

    # Restore backup files
    cp "$backup_path/docker-compose.prod.yml" ./
    cp "$backup_path/.env" ./ 2>/dev/null || true

    # Start services with previous configuration
    docker-compose -f docker-compose.prod.yml up -d

    print_success "Rollback completed"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups..."

    # Keep only last 5 backups
    find "$BACKUP_DIR" -type d -name "backup_*" | sort -r | tail -n +6 | xargs rm -rf

    print_success "Old backups cleaned up"
}

# Function to show deployment status
show_deployment_status() {
    print_status "Deployment Status:"
    echo "=================="

    # Show running containers
    docker-compose -f docker-compose.prod.yml ps

    echo ""
    print_status "Service Health:"
    echo "================"

    # Check health of all services
    local services=("4000:API Gateway" "4001:Auth Service" "4002:User Service" "4003:Email Worker" "4004:Relationship Service" "4005:Wallet Service" "4006:Notification Service" "4007:Neo4j DB Sync")

    for service in "${services[@]}"; do
        local port=$(echo $service | cut -d: -f1)
        local name=$(echo $service | cut -d: -f2-)

        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$name (Port $port) is healthy"
        else
            print_warning "$name (Port $port) is not responding"
        fi
    done
}

# Function to show help
show_help() {
    echo "Deployment Script for Decode Backend v2"
    echo "======================================="
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [IMAGE_TAG] [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  ENVIRONMENT    - Environment to deploy to (staging|production) [default: production]"
    echo "  IMAGE_TAG      - Docker image tag to deploy [default: latest]"
    echo ""
    echo "Options:"
    echo "  --zero-downtime    - Deploy with zero downtime (default for production)"
    echo "  --with-downtime    - Deploy with downtime (default for staging)"
    echo "  --rollback         - Rollback to previous deployment"
    echo "  --status           - Show deployment status"
    echo "  --help             - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production v1.2.3 --zero-downtime"
    echo "  $0 staging latest --with-downtime"
    echo "  $0 production --rollback"
    echo "  $0 production --status"
}

# Main script logic
main() {
    # Parse arguments
    ZERO_DOWNTIME=false
    ROLLBACK=false
    STATUS=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --zero-downtime)
                ZERO_DOWNTIME=true
                shift
                ;;
            --with-downtime)
                ZERO_DOWNTIME=false
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --status)
                STATUS=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Log deployment start
    log_message "Starting deployment - Environment: $ENVIRONMENT, Image Tag: $IMAGE_TAG"

    if [ "$STATUS" = true ]; then
        show_deployment_status
        exit 0
    fi

    if [ "$ROLLBACK" = true ]; then
        rollback_deployment
        log_message "Rollback completed"
        exit 0
    fi

    # Backup current deployment
    backup_current_deployment

    # Pull latest images
    pull_latest_images

    # Deploy based on environment and options
    if [ "$ENVIRONMENT" = "production" ] && [ "$ZERO_DOWNTIME" = true ]; then
        deploy_zero_downtime
    else
        deploy_with_downtime
    fi

    # Cleanup old backups
    cleanup_old_backups

    # Show final status
    show_deployment_status

    # Log deployment completion
    log_message "Deployment completed successfully"

    print_success "Deployment completed successfully!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Image Tag: $IMAGE_TAG"
    print_status "Log file: $LOG_FILE"
}

# Run main function
main "$@"
