#!/bin/bash

# Domain and Port 80 Setup Script
# Sets up Nginx reverse proxy and domain configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get domain from user
get_domain_info() {
    echo ""
    echo "=========================================="
    echo "🌐 DOMAIN CONFIGURATION"
    echo "=========================================="
    echo ""
    
    read -p "Enter your domain name (e.g., myapp.com): " DOMAIN_NAME
    
    if [[ -z "$DOMAIN_NAME" ]]; then
        print_error "Domain name is required!"
        exit 1
    fi
    
    # Ask about SSL
    echo ""
    read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " SETUP_SSL
    
    print_status "Domain: $DOMAIN_NAME"
    if [[ "$SETUP_SSL" == "y" || "$SETUP_SSL" == "Y" ]]; then
        print_status "SSL: Will be configured with Let's Encrypt"
    else
        print_status "SSL: Will be configured later"
    fi
}

# Install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    
    sudo apt update
    sudo apt install nginx -y
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_status "Nginx installed and started"
}

# Install Certbot for SSL
install_certbot() {
    if [[ "$SETUP_SSL" == "y" || "$SETUP_SSL" == "Y" ]]; then
        print_status "Installing Certbot for SSL..."
        
        sudo apt install certbot python3-certbot-nginx -y
        
        print_status "Certbot installed"
    fi
}

# Create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    # Create Nginx site configuration
    sudo tee /etc/nginx/sites-available/$DOMAIN_NAME << EOF
# Nginx configuration for Secure File Exchange System
# Domain: $DOMAIN_NAME

upstream secure_file_exchange {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone \$binary_remote_addr zone=upload:10m rate=2r/m;

server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # File upload size limit
    client_max_body_size 10M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting for authentication endpoints
    location ~ ^/api/auth/(login|register) {
        limit_req zone=auth burst=3 nodelay;
        proxy_pass http://secure_file_exchange;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Rate limiting for file upload endpoints
    location ~ ^/api/files/upload {
        limit_req zone=upload burst=1 nodelay;
        proxy_pass http://secure_file_exchange;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Extended timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Rate limiting for API endpoints
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://secure_file_exchange;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://secure_file_exchange;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Main application
    location / {
        proxy_pass http://secure_file_exchange;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://secure_file_exchange/api/auth/session;
        proxy_set_header Host \$host;
    }
    
    # Deny access to sensitive files
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \\.(env|log)\$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        print_status "Nginx configuration created successfully"
    else
        print_error "Nginx configuration test failed"
        exit 1
    fi
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    if [[ "$SETUP_SSL" == "y" || "$SETUP_SSL" == "Y" ]]; then
        print_status "Setting up SSL certificate..."
        
        # Reload Nginx first
        sudo systemctl reload nginx
        
        # Get SSL certificate
        sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
        
        if [ $? -eq 0 ]; then
            print_status "SSL certificate installed successfully"
            
            # Test automatic renewal
            sudo certbot renew --dry-run
            
            print_status "SSL auto-renewal configured"
        else
            print_warning "SSL setup failed. You can set it up later with:"
            print_warning "sudo certbot --nginx -d $DOMAIN_NAME"
        fi
    fi
}

# Update application environment
update_app_env() {
    print_status "Updating application environment..."
    
    # Determine the protocol
    if [[ "$SETUP_SSL" == "y" || "$SETUP_SSL" == "Y" ]]; then
        APP_URL="https://$DOMAIN_NAME"
        SECURE_COOKIES="true"
    else
        APP_URL="http://$DOMAIN_NAME"
        SECURE_COOKIES="false"
    fi
    
    # Update environment file
    if [ -f .env.production.local ]; then
        # Update existing environment file
        sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"$APP_URL\"|" .env.production.local
        sed -i "s|COOKIE_DOMAIN=.*|COOKIE_DOMAIN=\"$DOMAIN_NAME\"|" .env.production.local
        sed -i "s|SECURE_COOKIES=.*|SECURE_COOKIES=$SECURE_COOKIES|" .env.production.local
        
        print_status "Environment updated with domain: $APP_URL"
    else
        print_warning "Environment file not found. Please update manually:"
        print_warning "NEXT_PUBLIC_APP_URL=\"$APP_URL\""
        print_warning "COOKIE_DOMAIN=\"$DOMAIN_NAME\""
        print_warning "SECURE_COOKIES=$SECURE_COOKIES"
    fi
}

# Configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Allow HTTP and HTTPS
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    
    # Remove port 3000 access (no longer needed)
    sudo ufw delete allow 3000 2>/dev/null || true
    
    # Enable firewall if not already enabled
    sudo ufw --force enable
    
    print_status "Firewall configured"
}

# Restart services
restart_services() {
    print_status "Restarting services..."
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    # Restart the application if it's running
    if command -v pm2 &> /dev/null; then
        pm2 restart secure-file-exchange 2>/dev/null || true
    fi
    
    print_status "Services restarted"
}

# Main function
main() {
    print_info "🌐 Setting up domain and port 80 access..."
    
    # Change to application directory
    cd "$(dirname "$0")/.."
    
    # Run setup steps
    get_domain_info
    install_nginx
    install_certbot
    create_nginx_config
    setup_ssl
    update_app_env
    configure_firewall
    restart_services
    
    echo ""
    echo "=========================================="
    echo "🎉 DOMAIN SETUP COMPLETED!"
    echo "=========================================="
    if [[ "$SETUP_SSL" == "y" || "$SETUP_SSL" == "Y" ]]; then
        echo "🔒 Your app is now available at: https://$DOMAIN_NAME"
        echo "🔒 SSL certificate installed and configured"
    else
        echo "🌐 Your app is now available at: http://$DOMAIN_NAME"
        echo "⚠️  SSL not configured - set up later with: sudo certbot --nginx -d $DOMAIN_NAME"
    fi
    echo ""
    echo "📋 DNS Configuration Required:"
    echo "   Point your domain's A record to: $(curl -s ifconfig.me)"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Check Nginx: sudo systemctl status nginx"
    echo "   Reload Nginx: sudo systemctl reload nginx"
    echo "   Check SSL: sudo certbot certificates"
    echo "   Renew SSL: sudo certbot renew"
    echo ""
    echo "🔥 Firewall Status:"
    sudo ufw status
    echo "=========================================="
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"