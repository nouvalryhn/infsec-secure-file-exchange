# External Database Setup Guide

This guide covers setting up your secure file exchange system with external hosted databases instead of running MySQL on your VPS.

## 🏆 Recommended Database Services

### 1. PlanetScale (MySQL) - RECOMMENDED

**Why PlanetScale?**
- MySQL compatible (no schema changes needed)
- Generous free tier (1GB storage, 1B row reads/month)
- Built-in connection pooling
- Excellent performance
- Easy branching for schema changes

**Setup Steps:**
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub/Google
3. Create a new database: "secure-file-exchange"
4. Go to "Connect" → "Prisma" 
5. Copy the DATABASE_URL

**Example DATABASE_URL:**
```
mysql://username:password@aws.connect.psdb.cloud/secure-file-exchange?sslaccept=strict
```

### 2. Supabase (PostgreSQL)

**Why Supabase?**
- PostgreSQL (more features than MySQL)
- 500MB free tier
- Built-in auth (though we use custom)
- Real-time subscriptions
- Good dashboard

**Setup Steps:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project: "secure-file-exchange"
3. Go to Settings → Database
4. Copy the connection string
5. **Important**: You'll need to modify the Prisma schema for PostgreSQL

**Example DATABASE_URL:**
```
postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

**Schema Changes for PostgreSQL:**
```prisma
// In prisma/schema.prisma, change:
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // Changed from "mysql"
  url      = env("DATABASE_URL")
}

// Also change these field types:
model File {
  id        String   @id @default(uuid())  // Changed from cuid()
  // ... rest of fields
}

model User {
  id        String   @id @default(uuid())  // Changed from cuid()
  // ... rest of fields
}
```

### 3. Railway (MySQL/PostgreSQL)

**Setup Steps:**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add MySQL or PostgreSQL service
4. Get connection details from Variables tab

### 4. Aiven (MySQL)

**Setup Steps:**
1. Go to [aiven.io](https://aiven.io)
2. Sign up for free trial
3. Create MySQL service
4. Get connection string

## 🚀 VPS Deployment with External Database

### Option 1: Quick Deployment (Automated)

```bash
# On your VPS, run the external database deployment script
cd ~/infsec-secure-file-exchange
chmod +x scripts/deploy-vps-external-db.sh
./scripts/deploy-vps-external-db.sh
```

The script will:
1. Optimize your VPS for low memory usage
2. Install Node.js and dependencies
3. Ask for your DATABASE_URL
4. Generate secure keys automatically
5. Build and deploy the application
6. Set up PM2 process management

### Option 2: Manual Deployment

```bash
# 1. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Create environment file
cat > .env.production.local << EOF
DATABASE_URL="your-database-url-here"
SESSION_SECRET="$(openssl rand -hex 32)"
ENCRYPTION_KEY="$(openssl rand -hex 16)"
MAX_FILE_SIZE=5242880
UPLOAD_DIR="/home/$(whoami)/infsec-secure-file-exchange/uploads"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="http://$(curl -s ifconfig.me):3000"
SECURE_COOKIES=false
LOG_LEVEL="error"
DATABASE_CONNECTION_LIMIT=5
DATABASE_POOL_TIMEOUT=30000
NODE_OPTIONS="--max-old-space-size=256"
EOF

# 4. Install dependencies and build
npm ci --only=production
npx prisma generate
npm run build

# 5. Run database migrations
npx prisma migrate deploy

# 6. Create uploads directory
mkdir -p uploads
chmod 755 uploads

# 7. Start with PM2
pm2 start npm --name "secure-file-exchange" -- start
pm2 save
pm2 startup
```

## 🔧 Database-Specific Configurations

### For PlanetScale (MySQL)
- No changes needed to Prisma schema
- Use the connection string as-is
- Supports connection pooling automatically

### For Supabase (PostgreSQL)
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Change ID fields from `@default(cuid())` to `@default(uuid())`

3. Run migration:
   ```bash
   npx prisma migrate dev --name init
   ```

### For Railway/Aiven
- Use the provided connection string
- No schema changes needed for MySQL
- For PostgreSQL, follow Supabase instructions

## 📊 Performance Considerations

### Connection Pooling
External databases handle connection pooling automatically, which is perfect for your VPS setup.

### Latency
- Choose a database region close to your VPS
- PlanetScale and Supabase have multiple regions
- Railway automatically selects optimal region

### Free Tier Limits
- **PlanetScale**: 1GB storage, 1B row reads/month
- **Supabase**: 500MB storage, 2GB bandwidth/month
- **Railway**: 512MB RAM, 1GB disk (for database)

## 🔒 Security Best Practices

### Connection Security
- All recommended services use SSL by default
- Connection strings include SSL parameters
- No additional SSL configuration needed

### Environment Variables
```bash
# Secure your environment file
chmod 600 .env.production.local

# Never commit to git
echo ".env.production.local" >> .gitignore
```

### Database Access
- Use database-specific users (not admin)
- Enable IP restrictions if available
- Monitor connection logs

## 🚨 Troubleshooting

### Connection Issues
```bash
# Test database connection
npx prisma db push

# Check connection string format
echo $DATABASE_URL
```

### Migration Issues
```bash
# Reset database (development only)
npx prisma migrate reset

# Deploy specific migration
npx prisma migrate deploy
```

### Performance Issues
```bash
# Monitor application
pm2 monit

# Check database performance in provider dashboard
# Optimize queries if needed
```

## 💡 Recommendations

### For Development/Testing
- **Supabase**: Great dashboard, easy setup
- **Railway**: Simple deployment

### For Production
- **PlanetScale**: Best performance, MySQL compatibility
- **Aiven**: Enterprise features, multiple regions

### For Budget-Conscious
- **PlanetScale**: Most generous free tier
- **Supabase**: Good free tier with extra features

## 🎯 Next Steps After Setup

1. **Configure Firewall**:
   ```bash
   sudo ufw allow 3000
   sudo ufw enable
   ```

2. **Set up SSL** (for production):
   - Use Cloudflare or Let's Encrypt
   - Update NEXT_PUBLIC_APP_URL to https://

3. **Monitor Resources**:
   ```bash
   # Check VPS memory usage
   free -h
   
   # Monitor application
   pm2 monit
   ```

4. **Backup Strategy**:
   - Most hosted databases include automatic backups
   - Export your data regularly for extra safety

This setup will give you much better performance on your 1GB VPS since you're not running MySQL locally!