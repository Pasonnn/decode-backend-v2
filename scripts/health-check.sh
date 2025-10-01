#!/bin/bash

# Health Check Script for Decode Backend v2
# This script performs comprehensive health checks on all services

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
TIMEOUT=${2:-30}
RETRY_COUNT=${3:-3}
LOG_FILE="/var/log/decode-health-check.log"

# Service configuration
declare -A SERVICES=(
    ["api-gateway"]="4000"
    ["auth"]="4001"
    ["user"]="4002"
    ["email-worker"]="4003"
    ["relationship"]="4004"
    ["wallet"]="4005"
    ["notification"]="4006"
    ["neo4jdb-sync"]="4007"
)

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local service_name=$1
    local port=$2
    local endpoint="/health"
    local url="http://localhost:$port$endpoint"

    print_status "Checking $service_name health endpoint..."

    for ((i=1; i<=RETRY_COUNT; i++)); do
        if curl -s -f --max-time "$TIMEOUT" "$url" >/dev/null 2>&1; then
            print_success "$service_name is healthy (attempt $i/$RETRY_COUNT)"
            return 0
        else
            print_warning "$service_name health check failed (attempt $i/$RETRY_COUNT)"
            if [ $i -lt $RETRY_COUNT ]; then
                sleep 5
            fi
        fi
    done

    print_error "$service_name failed health check after $RETRY_COUNT attempts"
    return 1
}

# Function to check Docker container status
check_container_status() {
    local service_name=$1
    local container_name="decode-$service_name"

    print_status "Checking $service_name container status..."

    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        print_success "$service_name container is running"
        return 0
    else
        print_error "$service_name container is not running"
        return 1
    fi
}

# Function to check container logs for errors
check_container_logs() {
    local service_name=$1
    local container_name="decode-$service_name"
    local log_lines=50

    print_status "Checking $service_name container logs for errors..."

    # Get recent logs
    local logs=$(docker logs --tail "$log_lines" "$container_name" 2>&1)

    # Check for common error patterns
    if echo "$logs" | grep -i "error\|exception\|fatal\|panic" >/dev/null 2>&1; then
        print_warning "$service_name has errors in logs:"
        echo "$logs" | grep -i "error\|exception\|fatal\|panic" | tail -5
        return 1
    else
        print_success "$service_name logs look clean"
        return 0
    fi
}

# Function to check resource usage
check_resource_usage() {
    local service_name=$1
    local container_name="decode-$service_name"

    print_status "Checking $service_name resource usage..."

    # Get container stats
    local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep "$container_name" || echo "")

    if [ -n "$stats" ]; then
        print_success "$service_name resource usage:"
        echo "$stats"

        # Check if CPU usage is too high
        local cpu_percent=$(echo "$stats" | awk '{print $2}' | sed 's/%//')
        if (( $(echo "$cpu_percent > 80" | bc -l) )); then
            print_warning "$service_name CPU usage is high: $cpu_percent%"
        fi

        # Check if memory usage is too high
        local mem_percent=$(echo "$stats" | awk '{print $4}' | sed 's/%//')
        if (( $(echo "$mem_percent > 80" | bc -l) )); then
            print_warning "$service_name memory usage is high: $mem_percent%"
        fi
    else
        print_warning "Could not get resource usage for $service_name"
    fi
}

# Function to check database connectivity
check_database_connectivity() {
    print_status "Checking database connectivity..."

    # Check MongoDB
    if docker exec decode-api-gateway node -e "
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGO_URI, {serverSelectionTimeoutMS: 5000})
            .then(() => { console.log('MongoDB connected'); process.exit(0); })
            .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
    " 2>/dev/null; then
        print_success "MongoDB connectivity is healthy"
    else
        print_error "MongoDB connectivity failed"
        return 1
    fi

    # Check Redis
    if docker exec decode-api-gateway node -e "
        const redis = require('redis');
        const client = redis.createClient(process.env.REDIS_URI);
        client.connect().then(() => {
            console.log('Redis connected');
            client.quit();
            process.exit(0);
        }).catch(err => {
            console.error('Redis connection failed:', err.message);
            process.exit(1);
        });
    " 2>/dev/null; then
        print_success "Redis connectivity is healthy"
    else
        print_error "Redis connectivity failed"
        return 1
    fi

    return 0
}

# Function to check inter-service communication
check_inter_service_communication() {
    print_status "Checking inter-service communication..."

    # Test API Gateway to Auth Service
    if docker exec decode-api-gateway curl -s -f --max-time 10 "http://auth:4001/health" >/dev/null 2>&1; then
        print_success "API Gateway -> Auth Service communication is healthy"
    else
        print_error "API Gateway -> Auth Service communication failed"
        return 1
    fi

    # Test API Gateway to User Service
    if docker exec decode-api-gateway curl -s -f --max-time 10 "http://user:4002/health" >/dev/null 2>&1; then
        print_success "API Gateway -> User Service communication is healthy"
    else
        print_error "API Gateway -> User Service communication failed"
        return 1
    fi

    return 0
}

# Function to check external dependencies
check_external_dependencies() {
    print_status "Checking external dependencies..."

    # Check if all required environment variables are set
    local required_vars=("MONGO_URI" "REDIS_URI" "NEO4J_URI" "RABBITMQ_URI" "JWT_ACCESS_TOKEN_SECRET")

    for var in "${required_vars[@]}"; do
        if docker exec decode-api-gateway printenv "$var" >/dev/null 2>&1; then
            print_success "Environment variable $var is set"
        else
            print_error "Environment variable $var is not set"
            return 1
        fi
    done

    return 0
}

# Function to generate health report
generate_health_report() {
    local report_file="/tmp/decode-health-report-$(date +%Y%m%d_%H%M%S).json"

    print_status "Generating health report..."

    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "services": {
EOF

    local first=true
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        local container_name="decode-$service"

        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$report_file"
        fi

        # Check if container is running
        local container_running=false
        if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
            container_running=true
        fi

        # Check health endpoint
        local health_endpoint=false
        if curl -s -f --max-time 5 "http://localhost:$port/health" >/dev/null 2>&1; then
            health_endpoint=true
        fi

        cat >> "$report_file" << EOF
    "$service": {
      "container_running": $container_running,
      "health_endpoint": $health_endpoint,
      "port": $port
    }
EOF
    done

    cat >> "$report_file" << EOF
  },
  "overall_status": "$1"
}
EOF

    print_success "Health report generated: $report_file"
    echo "$report_file"
}

# Function to show help
show_help() {
    echo "Health Check Script for Decode Backend v2"
    echo "========================================="
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [TIMEOUT] [RETRY_COUNT]"
    echo ""
    echo "Arguments:"
    echo "  ENVIRONMENT    - Environment to check (staging|production) [default: production]"
    echo "  TIMEOUT        - Timeout for HTTP requests in seconds [default: 30]"
    echo "  RETRY_COUNT    - Number of retries for failed checks [default: 3]"
    echo ""
    echo "Options:"
    echo "  --report       - Generate JSON health report"
    echo "  --help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 staging 10 5"
    echo "  $0 production --report"
}

# Main script logic
main() {
    local generate_report=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --report)
                generate_report=true
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

    # Log health check start
    log_message "Starting health check - Environment: $ENVIRONMENT"

    print_status "Starting comprehensive health check for $ENVIRONMENT environment..."
    echo "=================================================================="

    local overall_status="healthy"
    local failed_checks=0

    # Check all services
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"

        echo ""
        print_status "Checking $service service..."
        echo "----------------------------------------"

        # Check container status
        if ! check_container_status "$service"; then
            overall_status="unhealthy"
            failed_checks=$((failed_checks + 1))
        fi

        # Check health endpoint
        if ! check_http_endpoint "$service" "$port"; then
            overall_status="unhealthy"
            failed_checks=$((failed_checks + 1))
        fi

        # Check container logs
        if ! check_container_logs "$service"; then
            overall_status="degraded"
        fi

        # Check resource usage
        check_resource_usage "$service"
    done

    echo ""
    print_status "Checking system-wide health..."
    echo "----------------------------------------"

    # Check database connectivity
    if ! check_database_connectivity; then
        overall_status="unhealthy"
        failed_checks=$((failed_checks + 1))
    fi

    # Check inter-service communication
    if ! check_inter_service_communication; then
        overall_status="unhealthy"
        failed_checks=$((failed_checks + 1))
    fi

    # Check external dependencies
    if ! check_external_dependencies; then
        overall_status="unhealthy"
        failed_checks=$((failed_checks + 1))
    fi

    echo ""
    echo "=================================================================="

    # Show final status
    if [ "$overall_status" = "healthy" ]; then
        print_success "All health checks passed! System is healthy."
    elif [ "$overall_status" = "degraded" ]; then
        print_warning "Some health checks failed. System is degraded but operational."
    else
        print_error "Multiple health checks failed. System is unhealthy."
    fi

    print_status "Failed checks: $failed_checks"
    print_status "Overall status: $overall_status"

    # Generate report if requested
    if [ "$generate_report" = true ]; then
        generate_health_report "$overall_status"
    fi

    # Log health check completion
    log_message "Health check completed - Status: $overall_status, Failed checks: $failed_checks"

    # Exit with appropriate code
    if [ "$overall_status" = "healthy" ]; then
        exit 0
    elif [ "$overall_status" = "degraded" ]; then
        exit 1
    else
        exit 2
    fi
}

# Run main function
main "$@"
