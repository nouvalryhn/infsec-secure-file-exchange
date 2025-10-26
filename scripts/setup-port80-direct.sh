#!/bin/bash

# Direct Port 80 Setup Script (Alternative to Nginx)
# Runs Next.js directly on port 80

set -e

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

# Get domain from user
get_domain_info() {
    echo ""
    echo "=========================================="
    echo "🌐 DIRECT PORT 80 SETUP"
    echo "=========================================="
    echo ""
    
    read -p "Enter your domain name (e.g., myapp.com): " DOMAIN_NAME
    
    if [[ -z "$DOMAIN_NAME" ]]; then
        print_error "Domain name is required!"
        exit 1
    fi
    
    print_status "Domain: $DOMAIN_NAME"
    print_warning "Note: This setup runs Next.js directly on port 80"
    print_warning "For production, consider using Nginx reverse proxy instead"
}

# Update PM2 configuration for port 80
update_pm2_config() {
    print_status "Updating PM2 configuration for port 80..."
    
    # Create new PM2 ecosystem file for port 80
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
      PORT: 80
    },
    error_file: '/var/log/secure-file-exchange-error.log',
    out_file: '/var/log/secure-file-exchange-out.log',
    log_file: '/var/log/secure-file-exchange.log',
    time: true
  }]
};
EOF
    
    print_status "PM2 configuration updated for port 80"
}

# Update application environment
update_app_env() {
    print_status "Updating application environment..."
    
    APP_URL="http://$DOMAIN_NAME"
    
    # Update environment file
    if [ -f .env.production.local ]; then
        # Update existing environment file
        sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"$APP_URL\"|" .env.production.local
        sed -i "s|COOKIE_DOMAIN=.*|COOKIE_DOMAIN=\"$DOMAIN_NAME\"|" .env.production.local
        sed -i "s|SECURE_COOKIES=.*|SECURE_COOKIES=false|" .env.production.local
        
        print_status "Environment updated with domain: $APP_URL"
    else
        print_warning "Environment file not found. Please update manually:"
        print_warning "NEXT_PUBLIC_APP_URL=\"$APP_URL\""
        print_warning "COOKIE_DOMAIN=\"$DOMAIN_NAME\""
        print_warning "SECURE_COOKIES=false"
    fi
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Allow HTTP on port 80
    sudo ufw allow 80
    sudo ufw allow ssh
    
    # Remove port 3000 access
    sudo ufw delete allow 3000 2>/dev/null || true
    
    # Enable firewall if not already enabled
    sudo ufw --force enable
    
    print_status "Firewall configured for port 80"
}

# Stop and restart application
restart_application() {
    print_status "Restarting application on port 80..."
    
    # Stop current application
    pm2 stop secure-file-exchange 2>/dev/null || true
    pm2 delete secure-file-exchange 2>/dev/null || true
    
    # Start with new configuration
    pm2 start ecosystem.config.js
    pm2 save
    
    print_status "Application restarted on port 80"
}

# Check if port 80 is available
check_port_80() {
    print_status "Checking if port 80 is available..."
    
    if sudo netstat -tlnp | grep :80 > /dev/null; then
        print_error "Port 80 is already in use!"
        print_error "Please stop the service using port 80 first:"
        sudo netstat -tlnp | grep :80
        exit 1
    fi
    
    print_status "Port 80 is available"
}

# Main function
main() {
    print_status "🚀 Setting up direct port 80 access..."
    
    # Change to application directory
    cd "$(dirname "$0")/.."
    
    # Run setup steps
    get_domain_info
    check_port_80
    update_pm2_config
    update_app_env
    configure_firewall
    restart_application
    
    echo ""
    echo "=========================================="
    echo "🎉 PORT 80 SETUP COMPLETED!"
    echo "=========================================="
    echo "🌐 Your app is now available at: http://$DOMAIN_NAME"
    echo ""
    echo "📋 DNS Configuration Required:"
    echo "   Point your domain's A record to: $(curl -s ifconfig.me)"
    echo ""
    echo "⚠️  Important Notes:"
    echo "   - Application runs directly on port 80"
    echo "   - No SSL/HTTPS configured"
    echo "   - For production, consider using Nginx reverse proxy"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Monitor: pm2 monit"
    echo "   Logs: pm2 logs secure-file-exchange"
    echo "   Restart: pm2 restart secure-file-exchange"
    echo ""
    echo "🔥 Firewall Status:"
    sudo ufw status
    echo "=========================================="
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"