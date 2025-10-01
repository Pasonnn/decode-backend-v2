#!/bin/bash

# Cleanup and Restart Script for Decode Backend v2
# This script cleans up failed containers and restarts with production configuration

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

print_status "Cleaning up failed containers and restarting with production configuration..."

# Stop and remove all containers
print_status "Stopping all containers..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remove any orphaned containers
print_status "Removing orphaned containers..."
docker container prune -f

# Remove any failed containers
print_status "Removing failed containers..."
docker ps -a --filter "status=exited" --filter "name=decode-" -q | xargs -r docker rm -f

# Clean up networks
print_status "Cleaning up networks..."
docker network prune -f

# Clean up volumes (optional - uncomment if you want to remove volumes)
# print_status "Cleaning up volumes..."
# docker volume prune -f

print_success "Cleanup completed!"

# Now start with production configuration
print_status "Starting services with production configuration (cloud databases)..."

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f docker.env.example ]; then
        cp docker.env.example .env
        print_warning "Please edit .env file with your cloud database configuration before continuing."
        print_warning "Required: MONGO_URI, REDIS_URI, NEO4J_URI, RABBITMQ_URI"
        exit 1
    else
        print_error "docker.env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Start services with production configuration
if docker-compose -f docker-compose.prod.yml up -d; then
    print_success "Services started successfully with production configuration!"

    # Wait a moment for services to start
    print_status "Waiting for services to initialize..."
    sleep 10

    # Show status
    print_status "Service Status:"
    echo "================"
    docker-compose -f docker-compose.prod.yml ps

    echo ""
    print_status "Service URLs:"
    echo "=============="
    echo "API Gateway:     http://localhost:4000"
    echo "API Docs:        http://localhost:4000/docs"
    echo "Auth Service:    http://localhost:4001"
    echo ""
    echo "Note: Using cloud databases (MongoDB, Redis, Neo4j, RabbitMQ)"
    echo "Check your .env file for database connection details"

    echo ""
    print_status "Next steps:"
    echo "1. Check service logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "2. Verify health: curl http://localhost:4000/health"
    echo "3. Access API docs: http://localhost:4000/docs"

else
    print_error "Failed to start services. Check your .env configuration."
    print_status "Common issues:"
    echo "- Missing or incorrect MONGO_URI"
    echo "- Missing or incorrect REDIS_URI"
    echo "- Missing or incorrect NEO4J_URI"
    echo "- Missing or incorrect RABBITMQ_URI"
    echo "- Missing JWT secrets"
    exit 1
fi
