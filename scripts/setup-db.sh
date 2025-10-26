#!/bin/bash

# Database Setup Script for Secure File Exchange
# This script helps set up the MySQL database for the application

echo "==================================="
echo "Secure File Exchange - Database Setup"
echo "==================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL 8.0 or higher."
    exit 1
fi

echo "✓ MySQL is installed"
echo ""

# Prompt for database credentials
read -p "Enter MySQL root username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

# Database configuration
DB_NAME="secure_file_exchange"
read -p "Enter database name (default: $DB_NAME): " INPUT_DB_NAME
DB_NAME=${INPUT_DB_NAME:-$DB_NAME}

read -p "Enter application database username (default: user): " APP_USER
APP_USER=${APP_USER:-user}

read -sp "Enter application database password: " APP_PASSWORD
echo ""

if [ -z "$APP_PASSWORD" ]; then
    echo "❌ Password cannot be empty"
    exit 1
fi

echo ""
echo "Creating database and user..."

# Create database and user
mysql -u "$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$APP_USER'@'localhost' IDENTIFIED BY '$APP_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$APP_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Database and user created successfully"
    echo ""
    echo "Update your .env file with:"
    echo "DATABASE_URL=\"mysql://$APP_USER:$APP_PASSWORD@localhost:3306/$DB_NAME\""
    echo ""
    echo "Next steps:"
    echo "1. Update the DATABASE_URL in your .env file"
    echo "2. Run: npm run prisma:migrate"
    echo "3. Run: npm run prisma:generate"
else
    echo "❌ Failed to create database and user"
    exit 1
fi
