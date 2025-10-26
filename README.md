# Secure File Exchange System

A comprehensive web-based application for secure file upload, encryption, storage, and sharing of confidential financial reports. The system implements multiple symmetric encryption algorithms (AES-256-CBC, DES-CBC, RC4) for comparative analysis and provides controlled access mechanisms for authorized users.

## Features

- **Multi-Algorithm Encryption**: Files are encrypted using AES-256-CBC, DES-CBC, and RC4 algorithms
- **Performance Metrics**: Real-time comparison of encryption/decryption times and ciphertext sizes
- **Secure File Sharing**: Share encrypted files with other registered users
- **Financial Report Processing**: Parse and encrypt Excel financial reports with field-level encryption
- **Session-Based Authentication**: Secure user authentication with bcrypt password hashing
- **Responsive UI**: Modern interface built with Next.js and TailwindCSS

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: iron-session with bcrypt password hashing
- **Encryption**: Node.js crypto module (AES, DES) and crypto-js (RC4)
- **File Processing**: multer for uploads, xlsx for Excel parsing
- **Styling**: TailwindCSS with Radix UI components
- **Testing**: Vitest with Testing Library

## Prerequisites

- Node.js 18+ 
- npm, pnpm, or yarn package manager
- MySQL 8.0+ database server
- At least 1GB free disk space for file storage

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd secure-file-exchange-app
npm install
```

### 2. Database Setup

#### Option A: Automated Setup (Recommended)
```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

#### Option B: Manual Setup
1. Create a MySQL database named `secure_file_exchange`
2. Update the `DATABASE_URL` in your `.env` file
3. Run migrations manually (see Database Setup section below)

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration (see Environment Variables section below).

### 4. Database Migration and Seeding

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data (optional)
npm run prisma:seed
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:password@localhost:3306/secure_file_exchange` |
| `SESSION_SECRET` | Secret key for session encryption (min 32 chars) | `your-secret-key-min-32-characters-long` |
| `ENCRYPTION_KEY` | Base encryption key (32 characters) | `your-encryption-key-32-characters` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_FILE_SIZE` | Maximum file upload size in bytes | `10485760` (10MB) |
| `UPLOAD_DIR` | Directory for storing encrypted files | `./uploads` |
| `NODE_ENV` | Application environment | `development` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | `http://localhost:3000` |

### Generating Secure Keys

#### Option 1: Automatic (Recommended for VPS)
```bash
# The VPS deployment script automatically generates all keys
./scripts/deploy-vps.sh
```

#### Option 2: Manual Generation
```bash
# Use the key generation script
./scripts/generate-keys.sh

# Or generate manually with OpenSSL
openssl rand -hex 32  # Session secret (64 chars)
openssl rand -hex 16  # Encryption key (32 chars)
```

#### Option 3: Using Node.js
```bash
# Generate a 64-character session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate a 32-character encryption key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Database Setup

### Schema Overview

The application uses the following main entities:
- **Users**: User accounts with hashed passwords
- **Files**: Uploaded files with encryption metadata
- **EncryptionMetrics**: Performance data for each encryption operation
- **FinancialReports**: Parsed financial data from Excel files
- **EncryptedReportFields**: Individual encrypted field values
- **FileShares**: File sharing permissions between users

### Migration Commands

```bash
# Create a new migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:migrate:deploy

# Reset database (development only)
npm run prisma:reset

# Open Prisma Studio for database inspection
npm run prisma:studio
```

## Usage Instructions

### 1. User Registration and Login

1. Navigate to `/register` to create a new account
2. Provide a unique username and secure password
3. Login at `/login` with your credentials
4. Access the dashboard at `/dashboard`

### 2. File Upload and Encryption

1. Go to `/upload` from the dashboard
2. Select an Excel file (.xlsx) or image file (.jpg, .png)
3. The system will automatically:
   - Validate the file type and size
   - Encrypt the file with all three algorithms (AES, DES, RC4)
   - Parse financial data from Excel files
   - Store encryption performance metrics

### 3. File Management

1. View all your files in the dashboard
2. Download files using any of the three encryption algorithms
3. View detailed performance metrics for each file
4. Access financial report data for Excel files

### 4. File Sharing

1. Click "Share" next to any file in your dashboard
2. Enter the username of the recipient
3. The recipient can access shared files from their dashboard
4. Revoke sharing permissions at any time

### 5. Performance Analysis

1. Visit `/metrics` to view encryption performance comparisons
2. Compare encryption/decryption times across algorithms
3. Analyze ciphertext sizes and efficiency metrics
4. Filter data by file type (Excel, images)

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user account |
| POST | `/api/auth/login` | Authenticate user and create session |
| POST | `/api/auth/logout` | Destroy user session |
| GET | `/api/auth/session` | Get current session information |

### File Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload and encrypt a file |
| GET | `/api/files` | List user's files |
| GET | `/api/files/[id]/download/[algorithm]` | Download and decrypt file |
| GET | `/api/files/[id]/report` | Get financial report data |
| DELETE | `/api/files/[id]/delete` | Delete a file |

### Sharing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shares` | Share a file with another user |
| GET | `/api/shares/received` | List files shared with user |
| GET | `/api/shares/sent` | List files user has shared |
| DELETE | `/api/shares/[id]` | Revoke file sharing |

### Metrics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics/performance` | Get performance comparison data |
| GET | `/api/metrics/algorithms` | Get algorithm-specific metrics |
| GET | `/api/metrics/user/[userId]` | Get user-specific metrics |

### API Request/Response Examples

#### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "securepassword123"}'
```

#### File Upload
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: session=..." \
  -F "file=@financial-report.xlsx"
```

#### Share File
```bash
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"fileId": "file-uuid", "recipientUsername": "colleague"}'
```

## Project Structure

```
secure-file-exchange-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── files/                # File management endpoints
│   │   ├── shares/               # File sharing endpoints
│   │   └── metrics/              # Performance metrics endpoints
│   ├── dashboard/                # User dashboard page
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── upload/                   # File upload page
│   ├── metrics/                  # Performance metrics page
│   └── files/                    # File detail pages
├── components/                   # React components
│   └── ui/                       # Reusable UI components
├── lib/                          # Utility libraries
│   ├── auth/                     # Authentication utilities
│   ├── encryption/               # Encryption implementations
│   └── services/                 # Business logic services
├── types/                        # TypeScript type definitions
├── prisma/                       # Database schema and migrations
├── test/                         # Test files
├── public/                       # Static assets and templates
├── uploads/                      # Encrypted file storage
└── scripts/                      # Setup and utility scripts
```

## Testing

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Coverage

The test suite covers:
- Encryption/decryption functionality for all algorithms
- Authentication flow (registration, login, session management)
- File upload and processing
- Access control and sharing mechanisms
- API endpoint responses and error handling

### Test Files Structure

```
test/
├── auth/                         # Authentication tests
├── encryption/                   # Encryption algorithm tests
└── services/                     # Service layer tests
```

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- No plain text password storage
- Session-based authentication with encrypted cookies

### Encryption Security
- AES-256-CBC with random IVs
- DES-CBC with random IVs (for comparison purposes)
- RC4 stream cipher (for educational comparison)
- Cryptographically secure key generation
- No hard-coded encryption keys
- Persistent session keys for consistent file decryption across login sessions

### File Security
- Files are encrypted before storage
- Access control enforced at API level
- File type validation and size limits
- Secure file path handling

### Session Security
- iron-session for encrypted session cookies
- HttpOnly and SameSite cookie attributes
- Session timeout and key rotation
- CSRF protection

## Performance Optimization

### Encryption Performance
- Parallel encryption with multiple algorithms
- Stream processing for large files
- Performance metrics collection and analysis

### Database Performance
- Indexed queries on frequently accessed fields
- Connection pooling via Prisma
- Optimized schema design

### File System Performance
- Organized directory structure by user and algorithm
- Lazy loading of file lists
- Metadata caching

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MySQL service status
sudo systemctl status mysql

# Test database connection
npm run prisma:studio
```

#### File Upload Failures
- Check `UPLOAD_DIR` permissions
- Verify `MAX_FILE_SIZE` setting
- Ensure sufficient disk space

#### Encryption Errors
- Verify `ENCRYPTION_KEY` is exactly 32 characters
- Check file permissions in upload directory
- Review error logs for specific algorithm failures

#### Session Issues
- Ensure `SESSION_SECRET` is at least 32 characters
- Clear browser cookies and retry
- Check session timeout settings

### Logging

Application logs are available in:
- Console output during development
- Database logs table for operation tracking
- File system logs for encryption operations

### Getting Help

1. Check the troubleshooting section above
2. Review the API documentation for correct usage
3. Examine test files for implementation examples
4. Check the database schema in `prisma/schema.prisma`

## Contributing

### Development Setup

1. Follow the installation instructions above
2. Create a feature branch from `main`
3. Run tests before committing: `npm test`
4. Follow TypeScript and ESLint guidelines
5. Update documentation for new features

### Code Style

- Use TypeScript for all new code
- Follow Next.js App Router conventions
- Implement proper error handling
- Add tests for new functionality
- Document API changes

## License

This project is for educational and demonstration purposes. Please ensure compliance with relevant data protection and encryption regulations in your jurisdiction.
