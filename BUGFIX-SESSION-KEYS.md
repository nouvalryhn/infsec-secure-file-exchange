# Bug Fix: File Decryption After Re-login

## Problem Description

Users were unable to decrypt files after logging out and logging back in. Files could only be decrypted immediately after upload, but became inaccessible after a logout/login cycle.

## Root Cause

The system was generating new session keys on each login. Since file encryption keys are derived from the user's session key using HMAC-SHA256, different session keys produced different file-specific encryption keys, making previously encrypted files undecryptable.

**Key Derivation Process:**
```
File Key = HMAC-SHA256(sessionKey, fileId + algorithm)
```

When the session key changed, the derived file keys would be completely different, breaking decryption.

## Solution

### 1. Database Schema Update

Added a `sessionKey` field to the `User` model to persist session keys across login sessions:

```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique
  passwordHash String
  sessionKey   String?  // Store the user's persistent session key for file encryption
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // ... other fields
}
```

### 2. Login Logic Update

Modified the login process to:
- Check if the user already has a session key stored in the database
- If yes, use the existing session key
- If no, generate a new session key and store it in the database

```typescript
// Get or generate session key for encryption operations
let sessionKey = user.sessionKey;

if (!sessionKey) {
  // Generate new session key for first-time login
  sessionKey = generateSessionKey();
  
  // Store the session key in the database for future logins
  await prisma.user.update({
    where: { id: user.id },
    data: { sessionKey }
  });
}
```

### 3. Registration Logic Update

Updated user registration to generate and store a session key immediately:

```typescript
// Generate session key for encryption operations
const sessionKey = generateSessionKey();

// Create user in database
const user = await prisma.user.create({
  data: {
    username,
    passwordHash,
    sessionKey,
  },
  // ...
});
```

### 4. Migration Script

Created a migration script to add session keys to existing users:

```bash
npx tsx scripts/migrate-session-keys.ts
```

## Benefits

1. **File Persistence**: Users can now decrypt their files after any number of logout/login cycles
2. **Backward Compatibility**: Existing users get session keys automatically assigned
3. **Security Maintained**: Each user still has a unique, cryptographically secure session key
4. **Deterministic Key Derivation**: File keys are consistently derived from the same session key

## Testing

The fix was verified with comprehensive tests:
- Session key persistence across database operations
- Deterministic key derivation for all encryption algorithms (AES, DES, RC4)
- End-to-end encryption/decryption workflow

## Files Modified

- `prisma/schema.prisma` - Added sessionKey field to User model
- `app/api/auth/login/route.ts` - Updated login logic to use persistent session keys
- `app/api/auth/register/route.ts` - Updated registration to generate session keys
- `scripts/migrate-session-keys.ts` - Migration script for existing users
- `README.md` - Updated security documentation

## Database Migration

Run the following commands to apply the changes:

```bash
# Update database schema
npx prisma db push

# Migrate existing users
npx tsx scripts/migrate-session-keys.ts
```

This fix ensures that the secure file exchange system maintains its security properties while providing a consistent user experience for file access across login sessions.