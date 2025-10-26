#!/bin/bash

# Key Generation Script for Secure File Exchange System
# Use this script to generate secure keys manually

echo "🔐 Generating secure keys for Secure File Exchange System..."

# Generate session secret (64 characters for extra security)
SESSION_SECRET=$(openssl rand -hex 32)

# Generate encryption key (32 characters)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# Generate database password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo "🔐 GENERATED SECURE KEYS"
echo "=========================================="
echo "Session Secret (64 chars): ${SESSION_SECRET}"
echo "Encryption Key (32 chars): ${ENCRYPTION_KEY}"
echo "Database Password: ${DB_PASSWORD}"
echo "Detected Server IP: ${SERVER_IP}"
echo "=========================================="
echo ""

# Create environment template
cat > .env.generated << EOF
# Generated Environment Configuration
# Generated on $(date)

# Database
DATABASE_URL="mysql://secure_user:${DB_PASSWORD}@localhost:3306/secure_file_exchange?connection_limit=5&pool_timeout=30"

# Security Keys
SESSION_SECRET="${SESSION_SECRET}"
ENCRYPTION_KEY="${ENCRYPTION_KEY}"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="http://${SERVER_IP}:3000"
MAX_FILE_SIZE=5242880
UPLOAD_DIR="/var/www/secure-file-exchange/uploads"

# Performance (VPS Optimized)
DATABASE_CONNECTION_LIMIT=5
DATABASE_POOL_TIMEOUT=30000
NODE_OPTIONS="--max-old-space-size=256"

# Security
SECURE_COOKIES=false
COOKIE_DOMAIN="${SERVER_IP}"
LOG_LEVEL="error"
ENABLE_QUERY_LOGGING=false
EOF

echo "✅ Keys generated and saved to .env.generated"
echo "📋 Copy these values to your .env.production.local file"
echo ""
echo "💡 Quick setup commands:"
echo "   cp .env.generated .env.production.local"
echo "   chmod 600 .env.production.local"
echo ""
echo "🔒 Keep these credentials secure and don't commit them to version control!"