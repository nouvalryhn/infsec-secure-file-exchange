#!/bin/bash

# Production Deployment Script for Secure File Exchange System
# This script handles the deployment process for production environments

set -e

echo "🚀 Starting deployment process..."

# Configuration
APP_NAME="secure-file-exchange"
BACKUP_DIR="/var/backups/$APP_NAME"
DEPLOY_DIR="/var/www/$APP_NAME"
SERVICE_NAME="secure-file-exchange"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Consider using a dedicated deployment user."
fi

# Check required environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "SESSION_SECRET"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_status "Environment variables check passed"
}

# Create backup of current deployment
create_backup() {
    print_status "Creating backup..."
    
    if [[ -d "$DEPLOY_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r "$DEPLOY_DIR" "$BACKUP_DIR/$backup_name"
        print_status "Backup created at $BACKUP_DIR/$backup_name"
    else
        print_status "No existing deployment found, skipping backup"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 18 ]]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    npm ci --only=production
    print_status "Dependencies installed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Build Next.js application
    npm run build
    
    print_status "Application built successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check database connectivity
    if ! npx prisma db push --accept-data-loss; then
        print_error "Database migration failed"
        exit 1
    fi
    
    print_status "Database migrations completed"
}

# Set up file permissions
setup_permissions() {
    print_status "Setting up file permissions..."
    
    # Create uploads directory if it doesn't exist
    mkdir -p uploads
    
    # Set appropriate permissions
    chmod -R 755 .
    chmod -R 777 uploads
    
    print_status "File permissions configured"
}

# Start the application service
start_service() {
    print_status "Starting application service..."
    
    # Kill existing process if running
    if pgrep -f "next start" > /dev/null; then
        print_status "Stopping existing application..."
        pkill -f "next start"
        sleep 5
    fi
    
    # Start the application in background
    nohup npm start > /var/log/$APP_NAME.log 2>&1 &
    
    # Wait a moment and check if the process started
    sleep 3
    if pgrep -f "next start" > /dev/null; then
        print_status "Application started successfully"
    else
        print_error "Failed to start application. Check logs at /var/log/$APP_NAME.log"
        exit 1
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for application to be ready
    sleep 10
    
    # Check if the application responds
    if curl -f http://localhost:3000/api/auth/session > /dev/null 2>&1; then
        print_status "Health check passed"
    else
        print_error "Health check failed. Application may not be running correctly."
        exit 1
    fi
}

# Cleanup old backups (keep last 5)
cleanup_backups() {
    print_status "Cleaning up old backups..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        print_status "Old backups cleaned up"
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment of $APP_NAME"
    
    # Change to application directory
    cd "$(dirname "$0")/.."
    
    # Run deployment steps
    check_env_vars
    create_backup
    install_dependencies
    build_application
    run_migrations
    setup_permissions
    start_service
    health_check
    cleanup_backups
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Application is running at http://localhost:3000"
    print_status "Logs are available at /var/log/$APP_NAME.log"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"