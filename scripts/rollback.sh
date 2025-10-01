#!/bin/bash

# Rollback Script for Decode Backend v2
# This script handles rollback to previous deployment

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
BACKUP_DIR="/opt/backups/decode-backend"
LOG_FILE="/var/log/decode-rollback.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to list available backups
list_backups() {
    print_status "Available backups:"
    echo "==================="

    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found: $BACKUP_DIR"
        return 1
    fi

    local backups=($(find "$BACKUP_DIR" -type d -name "backup_*" | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        print_error "No backups found in $BACKUP_DIR"
        return 1
    fi

    for i in "${!backups[@]}"; do
        local backup_path="${backups[$i]}"
        local backup_name=$(basename "$backup_path")
        local backup_date=$(echo "$backup_name" | sed 's/backup_//' | sed 's/_/ /')

        if [ -f "$backup_path/backup_manifest.txt" ]; then
            local git_commit=$(grep "Git commit:" "$backup_path/backup_manifest.txt" | cut -d: -f2 | xargs)
            local image_tag=$(grep "Image tag:" "$backup_path/backup_manifest.txt" | cut -d: -f2 | xargs)

            echo "$((i+1)). $backup_name"
            echo "   Date: $backup_date"
            echo "   Git commit: $git_commit"
            echo "   Image tag: $image_tag"
            echo ""
        else
            echo "$((i+1)). $backup_name (no manifest)"
            echo ""
        fi
    done

    return 0
}

# Function to select backup
select_backup() {
    local backup_index=$1

    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found: $BACKUP_DIR"
        return 1
    fi

    local backups=($(find "$BACKUP_DIR" -type d -name "backup_*" | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        print_error "No backups found in $BACKUP_DIR"
        return 1
    fi

    if [ -z "$backup_index" ]; then
        # Use the most recent backup
        echo "${backups[0]}"
    else
        # Use the specified backup index
        if [ "$backup_index" -ge 1 ] && [ "$backup_index" -le ${#backups[@]} ]; then
            echo "${backups[$((backup_index-1))]}"
        else
            print_error "Invalid backup index: $backup_index"
            return 1
        fi
    fi
}

# Function to validate backup
validate_backup() {
    local backup_path=$1

    print_status "Validating backup: $backup_path"

    if [ ! -d "$backup_path" ]; then
        print_error "Backup directory not found: $backup_path"
        return 1
    fi

    # Check required files
    local required_files=("docker-compose.prod.yml" "backup_manifest.txt")

    for file in "${required_files[@]}"; do
        if [ ! -f "$backup_path/$file" ]; then
            print_error "Required file not found in backup: $file"
            return 1
        fi
    done

    # Check backup manifest
    if [ -f "$backup_path/backup_manifest.txt" ]; then
        print_status "Backup manifest:"
        cat "$backup_path/backup_manifest.txt"
        echo ""
    fi

    print_success "Backup validation passed"
    return 0
}

# Function to create rollback backup
create_rollback_backup() {
    print_status "Creating backup of current deployment before rollback..."

    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/rollback_backup_$backup_timestamp"

    mkdir -p "$backup_path"

    # Backup current files
    cp docker-compose.prod.yml "$backup_path/" 2>/dev/null || true
    cp .env "$backup_path/" 2>/dev/null || true

    # Backup current running containers info
    docker-compose -f docker-compose.prod.yml ps > "$backup_path/containers_info.txt" 2>/dev/null || true

    # Create rollback backup manifest
    cat > "$backup_path/rollback_backup_manifest.txt" << EOF
Rollback backup created: $(date)
Environment: $ENVIRONMENT
Reason: Pre-rollback backup
Git commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
EOF

    print_success "Rollback backup created at $backup_path"
    echo "$backup_path" > /tmp/rollback_backup_path
}

# Function to perform rollback
perform_rollback() {
    local backup_path=$1

    print_status "Performing rollback to: $backup_path"

    # Stop current services
    print_status "Stopping current services..."
    docker-compose -f docker-compose.prod.yml down || true

    # Restore backup files
    print_status "Restoring backup files..."
    cp "$backup_path/docker-compose.prod.yml" ./
    cp "$backup_path/.env" ./ 2>/dev/null || true

    # Start services with previous configuration
    print_status "Starting services with previous configuration..."
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30

    # Check health of services
    print_status "Checking service health..."
    local services=("4000:API Gateway" "4001:Auth Service" "4002:User Service" "4003:Email Worker" "4004:Relationship Service" "4005:Wallet Service" "4006:Notification Service" "4007:Neo4j DB Sync")

    local healthy_services=0
    local total_services=${#services[@]}

    for service in "${services[@]}"; do
        local port=$(echo $service | cut -d: -f1)
        local name=$(echo $service | cut -d: -f2-)

        if curl -s -f --max-time 10 "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$name is healthy"
            healthy_services=$((healthy_services + 1))
        else
            print_warning "$name is not responding"
        fi
    done

    # Check if rollback was successful
    if [ $healthy_services -eq $total_services ]; then
        print_success "Rollback completed successfully! All services are healthy."
        return 0
    elif [ $healthy_services -gt $((total_services / 2)) ]; then
        print_warning "Rollback completed with some issues. $healthy_services/$total_services services are healthy."
        return 1
    else
        print_error "Rollback failed. Only $healthy_services/$total_services services are healthy."
        return 2
    fi
}

# Function to show rollback status
show_rollback_status() {
    print_status "Rollback Status:"
    echo "================="

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

        if curl -s -f --max-time 5 "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$name (Port $port) is healthy"
        else
            print_warning "$name (Port $port) is not responding"
        fi
    done
}

# Function to show help
show_help() {
    echo "Rollback Script for Decode Backend v2"
    echo "====================================="
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [BACKUP_INDEX] [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  ENVIRONMENT    - Environment to rollback (staging|production) [default: production]"
    echo "  BACKUP_INDEX   - Index of backup to rollback to (1-based) [default: 1 (most recent)]"
    echo ""
    echo "Options:"
    echo "  --list         - List available backups"
    echo "  --status       - Show current rollback status"
    echo "  --help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 production                    # Rollback to most recent backup"
    echo "  $0 production 2                  # Rollback to second most recent backup"
    echo "  $0 production --list             # List available backups"
    echo "  $0 production --status           # Show current status"
}

# Main script logic
main() {
    local list_backups_flag=false
    local status_flag=false
    local backup_index=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --list)
                list_backups_flag=true
                shift
                ;;
            --status)
                status_flag=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                if [[ $1 =~ ^[0-9]+$ ]]; then
                    backup_index=$1
                fi
                shift
                ;;
        esac
    done

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Log rollback start
    log_message "Starting rollback - Environment: $ENVIRONMENT"

    if [ "$list_backups_flag" = true ]; then
        list_backups
        exit 0
    fi

    if [ "$status_flag" = true ]; then
        show_rollback_status
        exit 0
    fi

    # List available backups
    if ! list_backups; then
        exit 1
    fi

    # Select backup
    local selected_backup
    selected_backup=$(select_backup "$backup_index")

    if [ -z "$selected_backup" ]; then
        print_error "Failed to select backup"
        exit 1
    fi

    print_status "Selected backup: $selected_backup"

    # Validate backup
    if ! validate_backup "$selected_backup"; then
        print_error "Backup validation failed"
        exit 1
    fi

    # Confirm rollback
    echo ""
    print_warning "This will rollback the $ENVIRONMENT environment to:"
    print_warning "Backup: $(basename "$selected_backup")"
    print_warning "Path: $selected_backup"
    echo ""

    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Rollback cancelled by user"
        exit 0
    fi

    # Create rollback backup
    create_rollback_backup

    # Perform rollback
    if perform_rollback "$selected_backup"; then
        print_success "Rollback completed successfully!"
        log_message "Rollback completed successfully - Backup: $selected_backup"
    else
        print_error "Rollback completed with issues"
        log_message "Rollback completed with issues - Backup: $selected_backup"
        exit 1
    fi

    # Show final status
    show_rollback_status

    print_status "Rollback completed!"
    print_status "Environment: $ENVIRONMENT"
    print_status "Backup used: $selected_backup"
    print_status "Log file: $LOG_FILE"
}

# Run main function
main "$@"
