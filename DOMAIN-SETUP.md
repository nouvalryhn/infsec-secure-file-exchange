# Domain and Port 80 Setup Guide

This guide covers setting up your domain to point to your VPS and exposing your application on port 80 (standard HTTP port).

## 🌐 Overview

You have two main options for exposing your app on port 80:

### **Option 1: Nginx Reverse Proxy (Recommended)**
- ✅ **Better security** with rate limiting and headers
- ✅ **SSL/HTTPS support** with automatic Let's Encrypt
- ✅ **Better performance** with caching and compression
- ✅ **Production-ready** configuration
- ✅ **Easy SSL renewal** and management

### **Option 2: Direct Port 80**
- ✅ **Simpler setup** - no additional services
- ✅ **Lower memory usage** - no Nginx overhead
- ❌ **No SSL/HTTPS** built-in
- ❌ **Less secure** - no rate limiting
- ❌ **Less flexible** for future needs

## 🏆 Recommended Setup (Nginx + SSL)

### Step 1: DNS Configuration

First, point your domain to your VPS:

1. **Go to your domain registrar** (GoDaddy, Namecheap, Cloudflare, etc.)
2. **Add an A record**:
   ```
   Type: A
   Name: @ (or your subdomain)
   Value: YOUR_VPS_IP_ADDRESS
   TTL: 300 (or default)
   ```
3. **Add a CNAME record for www** (optional):
   ```
   Type: CNAME
   Name: www
   Value: yourdomain.com
   TTL: 300
   ```

### Step 2: Run Domain Setup Script

```bash
# On your VPS, after deploying the application
cd ~/infsec-secure-file-exchange
./scripts/setup-domain.sh
```

The script will:
- ✅ Install and configure Nginx
- ✅ Set up reverse proxy to your Next.js app
- ✅ Configure SSL with Let's Encrypt
- ✅ Update firewall rules
- ✅ Update application environment

### Step 3: Verify Setup

```bash
# Check if your domain resolves to your VPS
nslookup yourdomain.com

# Check if Nginx is running
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test your application
curl -I https://yourdomain.com
```

## 🚀 Alternative Setup (Direct Port 80)

If you prefer a simpler setup without Nginx:

### Step 1: DNS Configuration
Same as above - point your domain to your VPS.

### Step 2: Run Direct Port 80 Setup

```bash
# On your VPS
cd ~/infsec-secure-file-exchange
./scripts/setup-port80-direct.sh
```

This will:
- ✅ Configure your app to run on port 80
- ✅ Update firewall rules
- ✅ Restart the application

## 📋 Complete Deployment Workflow

Here's the complete workflow from start to finish:

### 1. Initial Deployment
```bash
# Deploy application with external database
./scripts/deploy-vps-external-db.sh
```

### 2. Domain Setup (Choose one)
```bash
# Option A: Nginx + SSL (Recommended)
./scripts/setup-domain.sh

# Option B: Direct Port 80
./scripts/setup-port80-direct.sh
```

### 3. DNS Configuration
Point your domain's A record to your VPS IP address.

### 4. Verification
Test your application at your domain.

## 🔧 Configuration Details

### Nginx Configuration Features

The Nginx setup includes:

- **Rate Limiting**:
  - Auth endpoints: 5 requests/minute
  - Upload endpoints: 2 requests/minute
  - API endpoints: 30 requests/minute

- **Security Headers**:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin

- **Performance Optimizations**:
  - Gzip compression
  - Static file caching
  - Connection keep-alive

- **SSL Configuration**:
  - Automatic HTTPS redirect
  - Modern TLS protocols
  - HSTS headers

### Environment Updates

Both setups will update your `.env.production.local`:

```bash
# For HTTPS (Nginx + SSL)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
SECURE_COOKIES=true
COOKIE_DOMAIN="yourdomain.com"

# For HTTP (Direct port 80)
NEXT_PUBLIC_APP_URL="http://yourdomain.com"
SECURE_COOKIES=false
COOKIE_DOMAIN="yourdomain.com"
```

## 🔥 Firewall Configuration

### Nginx Setup
```bash
# Ports opened:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- Port 3000 is blocked (internal only)
```

### Direct Port 80 Setup
```bash
# Ports opened:
- 22 (SSH)
- 80 (HTTP)
- Port 3000 is blocked
```

## 🛠️ Management Commands

### Nginx Management
```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL Management
```bash
# Check certificates
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Application Management
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs secure-file-exchange

# Restart application
pm2 restart secure-file-exchange

# Check application status
pm2 status
```

## 🚨 Troubleshooting

### Domain Not Resolving
```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com

# Check if A record points to correct IP
dig A yourdomain.com
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Try manual certificate generation
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Check Nginx configuration
sudo nginx -t
```

### Application Not Accessible
```bash
# Check if application is running
pm2 status

# Check if port is open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# Check firewall
sudo ufw status

# Check Nginx proxy
curl -I http://localhost:3000  # Should work
curl -I http://yourdomain.com  # Should work through Nginx
```

### Port 80 Already in Use
```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# Stop Apache if installed
sudo systemctl stop apache2
sudo systemctl disable apache2

# Or stop other web servers
sudo systemctl stop lighttpd
```

## 🔒 Security Considerations

### Nginx Setup (More Secure)
- Rate limiting prevents abuse
- Security headers protect against attacks
- SSL encryption protects data in transit
- Nginx handles security updates separately

### Direct Port 80 (Less Secure)
- No rate limiting
- No security headers
- No SSL encryption
- Application directly exposed

## 📊 Performance Comparison

### Nginx Reverse Proxy
- **Memory**: +20-30MB for Nginx
- **CPU**: Minimal overhead
- **Features**: Caching, compression, rate limiting
- **SSL**: Hardware-accelerated

### Direct Port 80
- **Memory**: Lower usage
- **CPU**: Slightly less overhead
- **Features**: Basic Next.js only
- **SSL**: Not available

## 🎯 Recommendations

### For Production
Use **Nginx + SSL setup** because:
- Better security with HTTPS
- Professional configuration
- Rate limiting prevents abuse
- Better SEO (Google prefers HTTPS)
- Required for modern web standards

### For Development/Testing
**Direct port 80** is acceptable for:
- Quick testing
- Internal applications
- Resource-constrained environments
- Temporary deployments

## 🔄 Switching Between Setups

### From Direct Port 80 to Nginx
```bash
# Stop application on port 80
pm2 stop secure-file-exchange

# Run Nginx setup
./scripts/setup-domain.sh

# Application will automatically move back to port 3000
```

### From Nginx to Direct Port 80
```bash
# Stop and remove Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Run direct port 80 setup
./scripts/setup-port80-direct.sh
```

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify DNS propagation** (can take up to 48 hours)
3. **Check firewall and port availability**
4. **Review application and Nginx logs**
5. **Ensure your domain registrar settings are correct**

Remember: DNS changes can take time to propagate globally, so be patient if your domain doesn't work immediately after setup!