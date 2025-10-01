#!/bin/bash

# Monitoring Script for Decode Backend v2
# This script provides real-time monitoring of all services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Configuration
REFRESH_INTERVAL=${1:-5}
LOG_FILE="/var/log/decode-monitor.log"

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

# Function to clear screen
clear_screen() {
    clear
    echo -e "${CYAN}Decode Backend v2 - Real-time Monitoring${NC}"
    echo -e "${CYAN}==========================================${NC}"
    echo "Last updated: $(date)"
    echo "Refresh interval: ${REFRESH_INTERVAL}s"
    echo ""
}

# Function to get container status
get_container_status() {
    local service_name=$1
    local container_name="decode-$service_name"

    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        echo "RUNNING"
    else
        echo "STOPPED"
    fi
}

# Function to get health status
get_health_status() {
    local service_name=$1
    local port=$2

    if curl -s -f --max-time 2 "http://localhost:$port/health" >/dev/null 2>&1; then
        echo "HEALTHY"
    else
        echo "UNHEALTHY"
    fi
}

# Function to get resource usage
get_resource_usage() {
    local service_name=$1
    local container_name="decode-$service_name"

    local stats=$(docker stats --no-stream --format "{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" "$container_name" 2>/dev/null || echo "N/A\tN/A\tN/A")
    echo "$stats"
}

# Function to get container uptime
get_container_uptime() {
    local service_name=$1
    local container_name="decode-$service_name"

    local uptime=$(docker inspect --format='{{.State.StartedAt}}' "$container_name" 2>/dev/null || echo "N/A")
    if [ "$uptime" != "N/A" ]; then
        local start_time=$(date -d "$uptime" +%s)
        local current_time=$(date +%s)
        local duration=$((current_time - start_time))

        local days=$((duration / 86400))
        local hours=$(((duration % 86400) / 3600))
        local minutes=$(((duration % 3600) / 60))

        if [ $days -gt 0 ]; then
            echo "${days}d ${hours}h ${minutes}m"
        elif [ $hours -gt 0 ]; then
            echo "${hours}h ${minutes}m"
        else
            echo "${minutes}m"
        fi
    else
        echo "N/A"
    fi
}

# Function to get error count from logs
get_error_count() {
    local service_name=$1
    local container_name="decode-$service_name"

    local error_count=$(docker logs --since 1h "$container_name" 2>&1 | grep -i "error\|exception\|fatal\|panic" | wc -l)
    echo "$error_count"
}

# Function to display service status
display_service_status() {
    local service_name=$1
    local port=$2

    local container_status=$(get_container_status "$service_name")
    local health_status=$(get_health_status "$service_name" "$port")
    local resource_usage=$(get_resource_usage "$service_name")
    local uptime=$(get_container_uptime "$service_name")
    local error_count=$(get_error_count "$service_name")

    # Parse resource usage
    local cpu_percent=$(echo "$resource_usage" | cut -f1)
    local mem_usage=$(echo "$resource_usage" | cut -f2)
    local mem_percent=$(echo "$resource_usage" | cut -f3)

    # Color code status
    local container_color=""
    local health_color=""

    if [ "$container_status" = "RUNNING" ]; then
        container_color="${GREEN}"
    else
        container_color="${RED}"
    fi

    if [ "$health_status" = "HEALTHY" ]; then
        health_color="${GREEN}"
    else
        health_color="${RED}"
    fi

    # Display service info
    printf "%-20s | %-8s | %-9s | %-8s | %-12s | %-8s | %-6s\n" \
        "$service_name" \
        "${container_color}${container_status}${NC}" \
        "${health_color}${health_status}${NC}" \
        "$cpu_percent" \
        "$mem_usage" \
        "$uptime" \
        "$error_count"
}

# Function to display system overview
display_system_overview() {
    print_header "System Overview"
    echo "=================="

    # Get system info
    local total_containers=$(docker ps -q | wc -l)
    local running_containers=$(docker ps --filter "status=running" -q | wc -l)
    local stopped_containers=$(docker ps --filter "status=exited" -q | wc -l)

    # Get system resources
    local system_cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local system_mem=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df -h / | awk 'NR==2{printf "%s", $5}')

    echo "Containers: $running_containers running, $stopped_containers stopped (total: $total_containers)"
    echo "System CPU: ${system_cpu}%"
    echo "System Memory: ${system_mem}%"
    echo "Disk Usage: $disk_usage"
    echo ""
}

# Function to display service table
display_service_table() {
    print_header "Service Status"
    echo "==============="

    printf "%-20s | %-8s | %-9s | %-8s | %-12s | %-8s | %-6s\n" \
        "SERVICE" "STATUS" "HEALTH" "CPU" "MEMORY" "UPTIME" "ERRORS"
    echo "--------------------|----------|-----------|----------|--------------|----------|--------"

    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        display_service_status "$service" "$port"
    done

    echo ""
}

# Function to display recent logs
display_recent_logs() {
    print_header "Recent Logs (Last 10 lines)"
    echo "================================"

    # Get recent logs from all services
    for service in "${!SERVICES[@]}"; do
        local container_name="decode-$service"
        local logs=$(docker logs --tail 2 "$container_name" 2>&1 | tail -1)

        if [ -n "$logs" ]; then
            echo -e "${BLUE}[$service]${NC} $logs"
        fi
    done

    echo ""
}

# Function to display alerts
display_alerts() {
    print_header "Alerts"
    echo "======="

    local alerts=()

    # Check for unhealthy services
    for service in "${!SERVICES[@]}"; do
        local port="${SERVICES[$service]}"
        local health_status=$(get_health_status "$service" "$port")
        local container_status=$(get_container_status "$service")

        if [ "$container_status" = "STOPPED" ]; then
            alerts+=("CRITICAL: $service container is stopped")
        elif [ "$health_status" = "UNHEALTHY" ]; then
            alerts+=("WARNING: $service health check failed")
        fi

        # Check for high error count
        local error_count=$(get_error_count "$service")
        if [ "$error_count" -gt 10 ]; then
            alerts+=("WARNING: $service has $error_count errors in the last hour")
        fi

        # Check for high resource usage
        local resource_usage=$(get_resource_usage "$service")
        local cpu_percent=$(echo "$resource_usage" | cut -f1 | sed 's/%//')

        if [[ "$cpu_percent" =~ ^[0-9]+$ ]] && [ "$cpu_percent" -gt 80 ]; then
            alerts+=("WARNING: $service CPU usage is high: ${cpu_percent}%")
        fi
    done

    if [ ${#alerts[@]} -eq 0 ]; then
        echo -e "${GREEN}No alerts${NC}"
    else
        for alert in "${alerts[@]}"; do
            if [[ "$alert" == "CRITICAL:"* ]]; then
                echo -e "${RED}$alert${NC}"
            else
                echo -e "${YELLOW}$alert${NC}"
            fi
        done
    fi

    echo ""
}

# Function to show help
show_help() {
    echo "Monitoring Script for Decode Backend v2"
    echo "======================================="
    echo ""
    echo "Usage: $0 [REFRESH_INTERVAL] [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  REFRESH_INTERVAL  - Refresh interval in seconds [default: 5]"
    echo ""
    echo "Options:"
    echo "  --help            - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Monitor with 5s refresh"
    echo "  $0 10             # Monitor with 10s refresh"
    echo ""
    echo "Controls:"
    echo "  Ctrl+C            - Exit monitoring"
    echo "  q                 - Quit (if running in interactive mode)"
}

# Function to handle cleanup
cleanup() {
    echo ""
    print_status "Monitoring stopped"
    exit 0
}

# Main script logic
main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            *)
                if [[ $1 =~ ^[0-9]+$ ]]; then
                    REFRESH_INTERVAL=$1
                fi
                shift
                ;;
        esac
    done

    # Set up signal handlers
    trap cleanup SIGINT SIGTERM

    print_status "Starting monitoring with ${REFRESH_INTERVAL}s refresh interval..."
    print_status "Press Ctrl+C to stop monitoring"
    echo ""

    # Main monitoring loop
    while true; do
        clear_screen
        display_system_overview
        display_service_table
        display_alerts
        display_recent_logs

        sleep "$REFRESH_INTERVAL"
    done
}

# Run main function
main "$@"
