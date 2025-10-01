#!/bin/bash

# Docker Setup Script for Decode Backend v2
# This script automates the Docker setup process

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."

    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed and running"
}

# Function to setup environment file
setup_env() {
    print_status "Setting up environment configuration..."

    if [ ! -f .env ]; then
        if [ -f docker.env.example ]; then
            cp docker.env.example .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your configuration before starting services"
        else
            print_error "docker.env.example not found. Please create .env file manually."
            exit 1
        fi
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."

    mkdir -p scripts
    mkdir -p logs
    mkdir -p data

    print_success "Directories created"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."

    if docker-compose -f docker-compose.prod.yml build; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        exit 1
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."

    if docker-compose -f docker-compose.prod.yml up -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:4000/health >/dev/null 2>&1; then
            print_success "API Gateway is ready"
            break
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_warning "Services may still be starting up. Check logs with: docker-compose logs"
    fi
}

# Function to show service status
show_status() {
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
}

# Function to show health check
health_check() {
    print_status "Performing health check..."

    local services=("4000:API Gateway" "4001:Auth Service" "4002:User Service" "4003:Email Worker" "4004:Relationship Service" "4005:Wallet Service" "4006:Notification Service" "4007:Neo4j DB Sync")

    for service in "${services[@]}"; do
        local port=$(echo $service | cut -d: -f1)
        local name=$(echo $service | cut -d: -f2-)

        if curl -s http://localhost:$port/health >/dev/null 2>&1; then
            print_success "$name (Port $port) is healthy"
        else
            print_warning "$name (Port $port) is not responding"
        fi
    done
}

# Function to show logs
show_logs() {
    print_status "Recent logs (last 20 lines):"
    echo "================================"
    docker-compose -f docker-compose.prod.yml logs --tail=20
}

# Function to show help
show_help() {
    echo "Docker Setup Script for Decode Backend v2"
    echo "=========================================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  setup     - Complete setup (check, build, start)"
    echo "  start     - Start services only"
    echo "  stop      - Stop services"
    echo "  restart   - Restart services"
    echo "  status    - Show service status"
    echo "  health    - Perform health check"
    echo "  logs      - Show recent logs"
    echo "  build     - Build images only"
    echo "  clean     - Stop and remove containers/volumes"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # Complete setup"
    echo "  $0 start    # Start services"
    echo "  $0 status   # Check status"
    echo "  $0 health   # Health check"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        print_status "Starting Docker setup for Decode Backend v2..."
        check_docker
        setup_env
        create_directories
        build_images
        start_services
        wait_for_services
        show_status
        health_check
        print_success "Setup completed successfully!"
        echo ""
        print_status "Next steps:"
        echo "1. Edit .env file with your cloud database configuration"
        echo "2. Check service logs: docker-compose -f docker-compose.prod.yml logs"
        echo "3. Access API documentation: http://localhost:4000/docs"
        echo "4. Verify cloud database connections in your .env file"
        ;;
    "start")
        start_services
        wait_for_services
        show_status
        ;;
    "stop")
        print_status "Stopping services..."
        docker-compose -f docker-compose.prod.yml down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose -f docker-compose.prod.yml restart
        wait_for_services
        show_status
        ;;
    "status")
        show_status
        ;;
    "health")
        health_check
        ;;
    "logs")
        show_logs
        ;;
    "build")
        build_images
        ;;
    "clean")
        print_status "Cleaning up Docker resources..."
        docker-compose -f docker-compose.prod.yml down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
