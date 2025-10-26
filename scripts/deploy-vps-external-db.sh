#!/bin/bash

# VPS Deployment Script with External Database
# Optimized for 1GB RAM VPS using external hosted database

set -e

echo "🚀 Starting VPS deployment with external database..."

# Configuration
APP_NAME="secure-file-exchange"

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
    
    available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_mem -lt 200 ]]; then
        print_warning "Low available memory: ${available_mem}MB"
    fi
    
    available_disk=$(df / | awk 'NR==2{print $4}')
    if [[ $available_disk -lt 1000000 ]]; then # 1GB in KB
        print_error "Insufficient disk space. At least 1GB free space required."
        exit 1
    fi
    
    print_status "System resources check passed"
}

# Optimize system for low memory
optimize_system() {
    print_status "Optimizing system for low memory usage..."
    
    # Create swap file if not exists
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

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    # Update package list
    sudo apt update
    
    # Install Node.js 18 (if not installed)
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
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
    
    SESSION_SECRET=$(openssl rand -hex 32)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    
    print_status "Secure keys generated successfully"
}

# Get database URL from user
get_database_url() {
    print_status "Database configuration required..."
    
    echo ""
    echo "=========================================="
    echo "📊 DATABASE SETUP REQUIRED"
    echo "=========================================="
    echo "Please set up your external database first:"
    echo ""
    echo "🏆 RECOMMENDED: PlanetScale (planetscale.com)"
    echo "   1. Sign up at planetscale.com"
    echo "   2. Create a new database"
    echo "   3. Get your connection string"
    echo ""
    echo "🔗 Other options:"
    echo "   - Supabase (supabase.com) - PostgreSQL"
    echo "   - Railway (railway.app) - MySQL/PostgreSQL"
    echo "   - Aiven (aiven.io) - MySQL"
    echo ""
    echo "=========================================="
    echo ""
    
    read -p "Enter your DATABASE_URL: " DATABASE_URL
    
    if [[ -z "$DATABASE_URL" ]]; then
        print_error "Database URL is required!"
        exit 1
    fi
    
    print_status "Database URL configured"
}

# Create environment file
create_env_file() {
    print_status "Creating production environment file..."
    
    # Get VPS IP address
    VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
    
    cat > .env.production.local << EOF
# VPS Environment Configuration with External Database
# Generated on $(date)

# External Database
DATABASE_URL="${DATABASE_URL}"

# Security Keys - Auto-generated
SESSION_SECRET="${SESSION_SECRET}"
ENCRYPTION_KEY="${ENCRYPTION_KEY}"

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR="/home/$(whoami)/infsec-secure-file-exchange/uploads"

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

    chmod 600 .env.production.local
    
    print_status "Environment file created"
    print_status "VPS IP detected as: ${VPS_IP}"
    print_status "Application will be available at: http://${VPS_IP}:3000"
}

# Build application
build_application() {
    print_status "Building application..."
    
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

# Setup database
setup_database() {
    print_status "Setting up database schema..."
    
    # Run database migrations
    npx prisma migrate deploy
    
    print_status "Database schema setup completed"
}

# Setup file storage
setup_file_storage() {
    print_status "Setting up file storage..."
    
    # Create uploads directory
    mkdir -p uploads
    chmod 755 uploads
    
    print_status "File storage configured"
}

# Configure PM2
setup_pm2() {
    print_status "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'secure-file-exchange',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '300M',
    node_args: '--max-old-space-size=256',
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

# Health check
health_check() {
    print_status "Performing health check..."
    
    sleep 10
    
    if curl -f http://localhost:3000/api/auth/session > /dev/null 2>&1; then
        print_status "Health check passed"
    else
        print_warning "Health check failed. Check logs with: pm2 logs secure-file-exchange"
    fi
}

# Main deployment process
main() {
    print_status "Starting VPS deployment with external database"
    
    # Change to application directory
    cd "$(dirname "$0")/.."
    
    # Run deployment steps
    check_system_resources
    optimize_system
    install_dependencies
    generate_keys
    get_database_url
    create_env_file
    build_application
    setup_database
    setup_file_storage
    setup_pm2
    health_check
    
    echo ""
    echo "=========================================="
    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "=========================================="
    echo "Application URL: http://${VPS_IP}:3000"
    echo "Session Secret: ${SESSION_SECRET}"
    echo "Encryption Key: ${ENCRYPTION_KEY}"
    echo ""
    echo "📊 Management Commands:"
    echo "  Monitor: pm2 monit"
    echo "  Logs: pm2 logs secure-file-exchange"
    echo "  Restart: pm2 restart secure-file-exchange"
    echo "  Stop: pm2 stop secure-file-exchange"
    echo ""
    echo "🔒 Next Steps:"
    echo "  1. Configure firewall: sudo ufw allow 3000"
    echo "  2. Set up domain and port 80: ./scripts/setup-domain.sh"
    echo "  3. Or run directly on port 80: ./scripts/setup-port80-direct.sh"
    echo "  4. Monitor memory usage: free -h"
    echo ""
    echo "🌐 Domain Setup Options:"
    echo "  - Nginx + SSL (recommended): ./scripts/setup-domain.sh"
    echo "  - Direct port 80: ./scripts/setup-port80-direct.sh"
    echo "=========================================="
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"