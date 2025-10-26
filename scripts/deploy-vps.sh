#!/bin/bash

# VPS Deployment Script for Secure File Exchange System (1GB RAM, 2 Core)
# Optimized for low-resource environments

set -e

echo "🚀 Starting VPS deployment process (1GB RAM optimization)..."

# Configuration
APP_NAME="secure-file-exchange"
BACKUP_DIR="/var/backups/$APP_NAME"
DEPLOY_DIR="/var/www/$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # Check available memory
    available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_mem -lt 200 ]]; then
        print_warning "Low available memory: ${available_mem}MB. Consider stopping other services."
    fi
    
    # Check disk space
    available_disk=$(df / | awk 'NR==2{print $4}')
    if [[ $available_disk -lt 2000000 ]]; then # 2GB in KB
        print_error "Insufficient disk space. At least 2GB free space required."
        exit 1
    fi
    
    print_status "System resources check passed"
}

# Optimize system for low memory
optimize_system() {
    print_status "Optimizing system for low memory usage..."
    
    # Create swap file if not exists (helps with 1GB RAM)
    if [[ ! -f /swapfile ]]; then
        print_status "Creating 1GB swap file..."
        sudo fallocate -l 1G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    # Optimize system settings
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    print_status "System optimization completed"
}

# Install lightweight dependencies
install_dependencies() {
    print_status "Installing dependencies (lightweight mode)..."
    
    # Update package list
    sudo apt update
    
    # Install Node.js 18 (if not installed)
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install MySQL (lightweight configuration)
    if ! command -v mysql &> /dev/null; then
        sudo apt install mysql-server -y
        
        # Configure MySQL for low memory
        sudo tee -a /etc/mysql/mysql.conf.d/mysqld.cnf << EOF

# Low memory optimization
innodb_buffer_pool_size = 128M
innodb_log_file_size = 32M
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 2
max_connections = 20
table_open_cache = 200
query_cache_size = 0
query_cache_type = 0
EOF
        sudo systemctl restart mysql
    fi
    
    # Install PM2 for process management
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi
    
    print_status "Dependencies installed"
}

# Generate secure keys
generate_keys() {
    print_status "Generating secure keys..."
    
    # Generate session secret (32 characters)
    SESSION_SECRET=$(openssl rand -hex 32)
    
    # Generate encryption key (32 characters)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    
    # Generate database password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
    
    print_status "Secure keys generated successfully"
}

# Create environment file with generated keys
create_env_file() {
    print_status "Creating production environment file..."
    
    cat > .env.production.local << EOF
# VPS Environment Configuration (Auto-generated)
# Generated on $(date)

# Database - Optimized for low memory
DATABASE_URL="mysql://secure_user:${DB_PASSWORD}@localhost:3306/secure_file_exchange?connection_limit=5&pool_timeout=30"

# Session Secret - Auto-generated secure key
SESSION_SECRET="${SESSION_SECRET}"

# File Upload Configuration - Reduced for VPS
MAX_FILE_SIZE=5242880
UPLOAD_DIR="/var/www/secure-file-exchange/uploads"

# Encryption - Auto-generated secure key
ENCRYPTION_KEY="${ENCRYPTION_KEY}"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="http://${VPS_IP}:3000"

# Security Configuration
SECURE_COOKIES=false
COOKIE_DOMAIN="${VPS_IP}"

# Logging Configuration - Minimal for VPS
LOG_LEVEL="error"
ENABLE_QUERY_LOGGING=false

# Performance Configuration - Optimized for 1GB RAM
DATABASE_CONNECTION_LIMIT=5
DATABASE_POOL_TIMEOUT=30000

# Memory optimization
NODE_OPTIONS="--max-old-space-size=256"
EOF

    # Secure the environment file
    chmod 600 .env.production.local
    
    print_status "Environment file created with auto-generated keys"
    print_status "VPS IP detected as: ${VPS_IP}"
    print_status "Application will be available at: http://${VPS_IP}:3000"
}

# Setup database with optimizations
setup_database() {
    print_status "Setting up database..."
    
    # Create database and user with generated password
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS secure_file_exchange;"
    sudo mysql -e "CREATE USER IF NOT EXISTS 'secure_user'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    sudo mysql -e "GRANT ALL PRIVILEGES ON secure_file_exchange.* TO 'secure_user'@'localhost';"
    sudo mysql -e "FLUSH PRIVILEGES;"
    
    print_status "Database setup completed"
}

# Build application with memory limits
build_application() {
    print_status "Building application (memory optimized)..."
    
    # Set Node.js memory limit for build process
    export NODE_OPTIONS="--max-old-space-size=512"
    
    # Install dependencies
    npm ci --only=production
    
    # Generate Prisma client
    npx prisma generate
    
    # Build Next.js application
    npm run build
    
    print_status "Application built successfully"
}

# Configure PM2 for low memory
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'secure-file-exchange',
    script: 'npm',
    args: 'start',
    instances: 1, // Single instance for 1GB RAM
    exec_mode: 'fork', // Fork mode uses less memory than cluster
    max_memory_restart: '300M', // Restart if memory exceeds 300MB
    node_args: '--max-old-space-size=256', // Limit Node.js heap
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/secure-file-exchange-error.log',
    out_file: '/var/log/secure-file-exchange-out.log',
    log_file: '/var/log/secure-file-exchange.log',
    time: true
  }]
};
EOF
    
    # Start application with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    print_status "PM2 configured and application started"
}

# Monitor system resources
monitor_resources() {
    print_status "Monitoring system resources..."
    
    # Display current resource usage
    echo "Memory usage:"
    free -h
    echo ""
    echo "Disk usage:"
    df -h /
    echo ""
    echo "CPU usage:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5 $6 $7 $8}'
    
    # Check if application is running
    if pm2 list | grep -q "secure-file-exchange"; then
        print_status "Application is running successfully"
    else
        print_error "Application failed to start"
        exit 1
    fi
}

# Main deployment process
main() {
    print_status "Starting VPS deployment of $APP_NAME (1GB RAM optimized)"
    
    # Change to application directory
    cd "$(dirname "$0")/.."
    
    # Run deployment steps
    check_system_resources
    optimize_system
    install_dependencies
    setup_database
    
    # Generate secure keys
    generate_keys
    
    # Get VPS IP address
    VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
    
    # Create production environment file with generated keys
    create_env_file
    
    build_application
    
    # Run database migrations
    npx prisma migrate deploy
    
    setup_pm2
    monitor_resources
    
    print_status "🎉 VPS deployment completed successfully!"
    print_status "Application is running at http://${VPS_IP}:3000"
    print_status "Monitor with: pm2 monit"
    print_status "View logs with: pm2 logs secure-file-exchange"
    
    echo ""
    echo "=========================================="
    echo "🔐 GENERATED CREDENTIALS (SAVE THESE!)"
    echo "=========================================="
    echo "Database User: secure_user"
    echo "Database Password: ${DB_PASSWORD}"
    echo "Session Secret: ${SESSION_SECRET}"
    echo "Encryption Key: ${ENCRYPTION_KEY}"
    echo "VPS IP: ${VPS_IP}"
    echo "Application URL: http://${VPS_IP}:3000"
    echo "=========================================="
    echo ""
    
    print_warning "Important next steps:"
    print_warning "1. Configure your firewall to allow port 3000"
    print_warning "2. Set up SSL certificate for production use"
    print_warning "3. Monitor memory usage regularly with 'free -h'"
    print_warning "4. Save the credentials above in a secure location"
    print_warning "5. Consider changing the default database password"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"