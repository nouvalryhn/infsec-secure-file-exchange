# Production Deployment Guide

This guide covers deploying the Secure File Exchange System to a production environment.

## Prerequisites

### System Requirements

#### Recommended (Production)
- Ubuntu 20.04+ or CentOS 8+ (recommended)
- Node.js 18+ 
- MySQL 8.0+
- Nginx (for reverse proxy)
- SSL certificate
- At least 2GB RAM
- At least 10GB free disk space

#### Minimum (VPS/Development)
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- MySQL 8.0+
- 1GB RAM (with swap file)
- 2 CPU cores
- At least 5GB free disk space

### Security Requirements
- Firewall configured (UFW or iptables)
- SSH key-based authentication
- Non-root deployment user
- Regular security updates

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management (alternative to systemd)
sudo npm install -g pm2
```

#### 2. Database Setup

```bash
# Connect to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE secure_file_exchange;
CREATE USER 'secure_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON secure_file_exchange.* TO 'secure_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Application Deployment

```bash
# Create deployment directory
sudo mkdir -p /var/www/secure-file-exchange
sudo chown $USER:$USER /var/www/secure-file-exchange

# Clone and deploy application
cd /var/www/secure-file-exchange
git clone <your-repository-url> .

# Copy and configure environment
cp .env.production .env.production.local
# Edit .env.production.local with your production values

# Run deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### 4. Process Management with Systemd

```bash
# Copy systemd service file
sudo cp scripts/secure-file-exchange.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable secure-file-exchange
sudo systemctl start secure-file-exchange

# Check status
sudo systemctl status secure-file-exchange
```

#### 5. Nginx Configuration

```bash
# Copy nginx configuration
sudo cp scripts/nginx.conf /etc/nginx/sites-available/secure-file-exchange

# Enable site
sudo ln -s /etc/nginx/sites-available/secure-file-exchange /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Option 2: VPS Deployment (1GB RAM, 2 Core)

This option is optimized for small VPS instances with limited resources.

#### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# The deployment script will handle the rest
```

#### 2. Quick VPS Deployment

```bash
# Clone repository
git clone <your-repository-url>
cd secure-file-exchange-app

# Run VPS-optimized deployment
chmod +x scripts/deploy-vps.sh
sudo ./scripts/deploy-vps.sh
```

#### 3. Post-Deployment Configuration

```bash
# Edit environment variables
sudo nano .env.production.local

# Update with your VPS IP and secure keys:
# NEXT_PUBLIC_APP_URL="http://YOUR_VPS_IP:3000"
# SESSION_SECRET="your-32-char-secret"
# ENCRYPTION_KEY="your-32-char-key"

# Restart application
pm2 restart secure-file-exchange
```

#### 4. VPS-Specific Optimizations

The VPS deployment includes:
- **Swap file creation** (1GB) to handle memory spikes
- **MySQL memory optimization** (128MB buffer pool)
- **Node.js memory limits** (256MB heap size)
- **Single process mode** (no clustering)
- **Reduced file upload limit** (5MB instead of 10MB)
- **Limited database connections** (5 instead of 10)

#### 5. Monitoring VPS Resources

```bash
# Monitor application
pm2 monit

# Check memory usage
free -h

# Check disk usage
df -h

# View application logs
pm2 logs secure-file-exchange
```

### Option 3: Docker Deployment

#### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Deploy with Docker Compose

```bash
# Clone repository
git clone <your-repository-url>
cd secure-file-exchange-app

# Copy and configure environment
cp .env.production .env.production.local
# Edit .env.production.local with your production values

# Update docker-compose.yml with your environment variables
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Using Custom Certificate

```bash
# Copy your certificate files
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/

# Update nginx configuration with correct paths
sudo nano /etc/nginx/sites-available/secure-file-exchange
```

## Environment Configuration

### Production Environment Variables

Create `/var/www/secure-file-exchange/.env.production.local`:

```bash
# Database Configuration
DATABASE_URL="mysql://secure_user:your_secure_password@localhost:3306/secure_file_exchange?connection_limit=10&pool_timeout=20"

# Security Configuration
SESSION_SECRET="your-production-session-secret-min-32-characters-long"
ENCRYPTION_KEY="your-production-encryption-key-32-chars"

# Application Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="/var/www/secure-file-exchange/uploads"

# Security Settings
SECURE_COOKIES=true
COOKIE_DOMAIN="your-domain.com"

# Performance Settings
DATABASE_CONNECTION_LIMIT=10
DATABASE_POOL_TIMEOUT=20000
```

### Generating Secure Keys

```bash
# Generate session secret (32+ characters)
openssl rand -hex 32

# Generate encryption key (32 characters)
openssl rand -hex 16
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. File Permissions

```bash
# Set secure permissions
sudo chown -R www-data:www-data /var/www/secure-file-exchange
sudo chmod -R 755 /var/www/secure-file-exchange
sudo chmod -R 777 /var/www/secure-file-exchange/uploads
sudo chmod 600 /var/www/secure-file-exchange/.env.production.local
```

### 3. Database Security

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Configure MySQL for production
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Add:
# bind-address = 127.0.0.1
# max_connections = 100
# innodb_buffer_pool_size = 1G
```

### 4. Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/secure-file-exchange

# Add:
/var/log/secure-file-exchange.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload secure-file-exchange
    endscript
}
```

## Monitoring and Maintenance

### 1. Health Checks

```bash
# Check application status
curl -f https://your-domain.com/api/auth/session

# Check system resources
htop
df -h
free -h
```

### 2. Log Monitoring

```bash
# Application logs
sudo journalctl -u secure-file-exchange -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### 3. Database Maintenance

```bash
# Backup database
mysqldump -u secure_user -p secure_file_exchange > backup_$(date +%Y%m%d).sql

# Optimize database
mysql -u secure_user -p -e "OPTIMIZE TABLE secure_file_exchange.File, secure_file_exchange.User, secure_file_exchange.EncryptionMetric;"
```

### 4. Update Process

```bash
# Pull latest changes
cd /var/www/secure-file-exchange
git pull origin main

# Run deployment script
./scripts/deploy.sh

# Restart services
sudo systemctl restart secure-file-exchange
sudo systemctl restart nginx
```

## Backup Strategy

### 1. Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-database.sh

#!/bin/bash
BACKUP_DIR="/var/backups/secure-file-exchange"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u secure_user -p'your_password' secure_file_exchange > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-database.sh

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-database.sh
```

### 2. File Backups

```bash
# Backup uploaded files
rsync -av /var/www/secure-file-exchange/uploads/ /var/backups/secure-file-exchange/uploads/
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
sudo journalctl -u secure-file-exchange -n 50

# Check port availability
sudo netstat -tlnp | grep :3000

# Check file permissions
ls -la /var/www/secure-file-exchange/
```

#### Database Connection Issues
```bash
# Test database connection
mysql -u secure_user -p -h localhost secure_file_exchange

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/your-certificate.crt -text -noout

# Test SSL configuration
sudo nginx -t
```

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart application if needed
sudo systemctl restart secure-file-exchange
```

#### VPS-Specific Issues (1GB RAM)

##### Out of Memory Errors
```bash
# Check if swap is active
swapon --show

# Add swap if missing
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Restart application with memory limits
pm2 restart secure-file-exchange
```

##### Application Crashes Due to Memory
```bash
# Check PM2 logs for memory issues
pm2 logs secure-file-exchange --lines 50

# Reduce memory usage by restarting
pm2 restart secure-file-exchange

# Monitor memory usage
pm2 monit
```

##### Slow Performance on VPS
```bash
# Check system load
uptime

# Optimize MySQL if needed
sudo mysql -e "SET GLOBAL innodb_buffer_pool_size=67108864;" # 64MB

# Clear system cache
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Performance Optimization

#### Database Optimization
```bash
# Analyze slow queries
sudo mysql -u root -p -e "SHOW PROCESSLIST;"

# Enable slow query log
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Add:
# slow_query_log = 1
# slow_query_log_file = /var/log/mysql/slow.log
# long_query_time = 2
```

#### Application Optimization
```bash
# Monitor application performance
pm2 monit  # if using PM2

# Check disk usage
du -sh /var/www/secure-file-exchange/uploads/*
```

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Firewall configured and enabled
- [ ] Database secured with strong passwords
- [ ] File permissions set correctly
- [ ] Regular security updates scheduled
- [ ] Backup strategy implemented
- [ ] Log monitoring configured
- [ ] Rate limiting enabled in Nginx
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database connection pooling configured
- [ ] Error pages customized (no sensitive information)

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Test database connectivity
5. Check system resources

Remember to keep your system updated and monitor logs regularly for any security issues.