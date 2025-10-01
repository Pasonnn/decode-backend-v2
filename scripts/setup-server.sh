#!/bin/bash

# Server Setup Script for Decode Backend v2
# This script sets up a fresh server for Docker deployment

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
SERVER_TYPE=${1:-production}
DOMAIN=${2:-""}
EMAIL=${3:-""}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."

    apt update && apt upgrade -y

    print_success "System updated"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."

    # Remove old Docker installations
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Install prerequisites
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    # Add current user to docker group
    usermod -aG docker $SUDO_USER

    print_success "Docker installed"
}

# Function to install additional tools
install_tools() {
    print_status "Installing additional tools..."

    apt install -y \
        git \
        curl \
        wget \
        unzip \
        htop \
        vim \
        nano \
        ufw \
        fail2ban \
        nginx \
        certbot \
        python3-certbot-nginx \
        jq \
        bc \
        tree

    print_success "Additional tools installed"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."

    # Reset UFW
    ufw --force reset

    # Default policies
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH
    ufw allow ssh

    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Allow application ports (only for production)
    if [ "$SERVER_TYPE" = "production" ]; then
        ufw allow 4000/tcp  # API Gateway
        ufw allow 4001/tcp  # Auth Service
    fi

    # Enable firewall
    ufw --force enable

    print_success "Firewall configured"
}

# Function to configure fail2ban
configure_fail2ban() {
    print_status "Configuring fail2ban..."

    # Create jail.local
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban

    print_success "Fail2ban configured"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Create application configuration
    cat > /etc/nginx/sites-available/decode-backend << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;

# Upstream servers
upstream api_gateway {
    server 127.0.0.1:4000;
}

upstream auth_service {
    server 127.0.0.1:4001;
}

# Main server block
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Gateway
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_gateway/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Auth Service
    location /auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://auth_service/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|log|conf)$ {
        deny all;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/decode-backend /etc/nginx/sites-enabled/

    # Test configuration
    nginx -t

    # Restart Nginx
    systemctl restart nginx
    systemctl enable nginx

    print_success "Nginx configured"
}

# Function to setup SSL certificate
setup_ssl() {
    if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
        print_status "Setting up SSL certificate..."

        # Obtain SSL certificate
        certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

        print_success "SSL certificate configured"
    else
        print_warning "Skipping SSL setup - domain or email not provided"
    fi
}

# Function to create application user
create_app_user() {
    print_status "Creating application user..."

    # Create user if it doesn't exist
    if ! id "decode" &>/dev/null; then
        useradd -m -s /bin/bash decode
        usermod -aG docker decode
    fi

    # Create application directory
    mkdir -p /opt/decode-backend
    chown decode:decode /opt/decode-backend

    print_success "Application user created"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."

    cat > /etc/logrotate.d/decode-backend << EOF
/var/log/decode-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload nginx
    endscript
}
EOF

    print_success "Log rotation configured"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up basic monitoring..."

    # Create monitoring script
    cat > /usr/local/bin/decode-monitor.sh << 'EOF'
#!/bin/bash

# Basic monitoring script
LOG_FILE="/var/log/decode-monitor.log"

# Check Docker services
if ! docker ps | grep -q "decode-"; then
    echo "$(date): WARNING - No Decode containers running" >> "$LOG_FILE"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2{printf "%d", $5}')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%d", $3*100/$2}')
if [ "$MEM_USAGE" -gt 80 ]; then
    echo "$(date): WARNING - Memory usage is ${MEM_USAGE}%" >> "$LOG_FILE"
fi
EOF

    chmod +x /usr/local/bin/decode-monitor.sh

    # Add to crontab
    echo "*/5 * * * * /usr/local/bin/decode-monitor.sh" | crontab -

    print_success "Basic monitoring configured"
}

# Function to create deployment directory structure
create_deployment_structure() {
    print_status "Creating deployment directory structure..."

    # Create directories
    mkdir -p /opt/decode-backend/{scripts,logs,backups,config}
    mkdir -p /var/log/decode-backend

    # Set permissions
    chown -R decode:decode /opt/decode-backend
    chown -R decode:decode /var/log/decode-backend

    print_success "Deployment structure created"
}

# Function to show final instructions
show_final_instructions() {
    print_success "Server setup completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Switch to the decode user: su - decode"
    echo "2. Clone your repository: git clone <your-repo-url> /opt/decode-backend"
    echo "3. Copy your .env file to /opt/decode-backend/.env"
    echo "4. Run the deployment script: ./scripts/deploy.sh production"
    echo ""
    print_status "Server information:"
    echo "- Application directory: /opt/decode-backend"
    echo "- Logs directory: /var/log/decode-backend"
    echo "- Backups directory: /opt/decode-backend/backups"
    echo "- Nginx configuration: /etc/nginx/sites-available/decode-backend"
    echo ""
    if [ -n "$DOMAIN" ]; then
        print_status "Your application will be available at:"
        echo "- HTTP: http://$DOMAIN"
        echo "- HTTPS: https://$DOMAIN"
    fi
    echo ""
    print_warning "Important:"
    echo "- Make sure to configure your .env file with production values"
    echo "- Test your deployment before going live"
    echo "- Monitor your application logs regularly"
}

# Function to show help
show_help() {
    echo "Server Setup Script for Decode Backend v2"
    echo "=========================================="
    echo ""
    echo "Usage: $0 [SERVER_TYPE] [DOMAIN] [EMAIL]"
    echo ""
    echo "Arguments:"
    echo "  SERVER_TYPE    - Type of server (staging|production) [default: production]"
    echo "  DOMAIN         - Domain name for SSL certificate [optional]"
    echo "  EMAIL          - Email for SSL certificate [optional]"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 production api.example.com admin@example.com"
    echo "  $0 staging"
    echo ""
    echo "This script will:"
    echo "- Update the system"
    echo "- Install Docker and Docker Compose"
    echo "- Install additional tools (git, nginx, etc.)"
    echo "- Configure firewall and security"
    echo "- Setup Nginx reverse proxy"
    echo "- Configure SSL certificate (if domain provided)"
    echo "- Create application user and directories"
    echo "- Setup monitoring and log rotation"
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
                shift
                ;;
        esac
    done

    print_status "Starting server setup for Decode Backend v2..."
    print_status "Server type: $SERVER_TYPE"
    if [ -n "$DOMAIN" ]; then
        print_status "Domain: $DOMAIN"
    fi
    if [ -n "$EMAIL" ]; then
        print_status "Email: $EMAIL"
    fi
    echo ""

    # Check if running as root
    check_root

    # Update system
    update_system

    # Install Docker
    install_docker

    # Install additional tools
    install_tools

    # Configure firewall
    configure_firewall

    # Configure fail2ban
    configure_fail2ban

    # Configure Nginx
    configure_nginx

    # Setup SSL certificate
    setup_ssl

    # Create application user
    create_app_user

    # Setup log rotation
    setup_log_rotation

    # Setup monitoring
    setup_monitoring

    # Create deployment structure
    create_deployment_structure

    # Show final instructions
    show_final_instructions
}

# Run main function
main "$@"
