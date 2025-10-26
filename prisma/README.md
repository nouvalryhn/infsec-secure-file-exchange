# Database Setup

This directory contains the Prisma schema and migration files for the Secure File Exchange application.

## Prerequisites

- MySQL 8.0 or higher installed and running
- Database user with appropriate permissions

## Initial Setup

1. **Create the database:**

```bash
mysql -u root -p
CREATE DATABASE secure_file_exchange;
CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON secure_file_exchange.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

2. **Update the DATABASE_URL in .env file:**

```
DATABASE_URL="mysql://user:password@localhost:3306/secure_file_exchange"
```

Replace `user` and `password` with your actual MySQL credentials.

3. **Run the initial migration:**

```bash
npm run prisma:migrate
```

When prompted, provide a name for the migration (e.g., "init").

4. **Generate Prisma Client:**

```bash
npm run prisma:generate
```

## Database Schema

The schema includes the following models:

- **User**: User accounts with authentication credentials
- **File**: Uploaded files with encryption metadata
- **EncryptionMetric**: Performance metrics for encryption operations
- **FinancialReport**: Financial report data extracted from Excel files
- **EncryptedReportField**: Individual encrypted fields from financial reports
- **FileShare**: File sharing permissions between users

## Common Commands

- **Create a new migration:** `npm run prisma:migrate`
- **Apply migrations:** `npm run prisma:migrate:deploy`
- **Generate Prisma Client:** `npm run prisma:generate`
- **Open Prisma Studio:** `npm run prisma:studio`
- **Reset database:** `npm run prisma:reset` (WARNING: This will delete all data)

## Migration Workflow

1. Make changes to `schema.prisma`
2. Run `npm run prisma:migrate` to create a new migration
3. The migration will be applied automatically to your development database
4. Commit both the schema changes and the migration files to version control

## Production Deployment

For production deployments, use:

```bash
npm run prisma:migrate:deploy
```

This applies pending migrations without prompting for migration names.
