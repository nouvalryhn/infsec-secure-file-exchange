# Bug Fix: File Decryption After Re-login & Shared File Access

## Problem Description

There were two related issues with file decryption:

1. **Re-login Issue**: Users were unable to decrypt files after logging out and logging back in. Files could only be decrypted immediately after upload, but became inaccessible after a logout/login cycle.

2. **Shared File Issue**: Users could not decrypt files that were shared with them by other users, even though they had proper access permissions.

## Root Cause

### Issue 1: Re-login Problem
The system was generating new session keys on each login. Since file encryption keys are derived from the user's session key using HMAC-SHA256, different session keys produced different file-specific encryption keys, making previously encrypted files undecryptable.

### Issue 2: Shared File Problem
When a user tried to decrypt a shared file, the system was using the **current user's session key** instead of the **file owner's session key**. Since files are encrypted with the owner's session key, they can only be decrypted with the same key.

**Key Derivation Process:**
```
File Key = HMAC-SHA256(sessionKey, fileId + algorithm)
```

**The Problems:**
1. When the session key changed (re-login), the derived file keys would be completely different
2. When a different user accessed a shared file, their session key produced different file keys than the owner's

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

### 4. File Decryption Logic Update

Modified all file decryption endpoints to use the **file owner's session key** instead of the current user's session key:

```typescript
// OLD: Using current user's session key (WRONG)
const sessionKeyBuffer = Buffer.from(session.sessionKey, 'base64');
const fileKey = KeyManager.deriveFileKey(sessionKeyBuffer, fileId, algorithm);

// NEW: Using file owner's session key (CORRECT)
const ownerSessionKeyBuffer = Buffer.from(file.user.sessionKey, 'base64');
const fileKey = KeyManager.deriveFileKey(ownerSessionKeyBuffer, fileId, algorithm);
```

This ensures that:
- File owners can decrypt their files after re-login
- Shared users can decrypt files using the original owner's encryption key

### 5. Migration Script

Created a migration script to add session keys to existing users:

```bash
npx tsx scripts/migrate-session-keys.ts
```

## Benefits

1. **File Persistence**: Users can now decrypt their files after any number of logout/login cycles
2. **Shared File Access**: Users can decrypt files shared with them by other users
3. **Backward Compatibility**: Existing users get session keys automatically assigned
4. **Security Maintained**: Each user still has a unique, cryptographically secure session key
5. **Deterministic Key Derivation**: File keys are consistently derived from the file owner's session key
6. **Proper Access Control**: File sharing works correctly while maintaining encryption security

## Testing

The fix was verified with comprehensive tests:
- Session key persistence across database operations
- Deterministic key derivation for all encryption algorithms (AES, DES, RC4)
- End-to-end encryption/decryption workflow

## Files Modified

### Database & Authentication
- `prisma/schema.prisma` - Added sessionKey field to User model
- `app/api/auth/login/route.ts` - Updated login logic to use persistent session keys
- `app/api/auth/register/route.ts` - Updated registration to generate session keys
- `scripts/migrate-session-keys.ts` - Migration script for existing users

### File Decryption Endpoints
- `app/api/files/[id]/download/[algorithm]/route.ts` - Use owner's session key for decryption
- `app/api/files/[id]/thumbnail/route.ts` - Use owner's session key for thumbnail generation
- `app/api/files/[id]/report/route.ts` - Use owner's session key for financial report decryption

### Documentation
- `README.md` - Updated security documentation
- `BUGFIX-SESSION-KEYS.md` - Comprehensive bug fix documentation

## Database Migration

Run the following commands to apply the changes:

```bash
# Update database schema
npx prisma db push

# Migrate existing users
npx tsx scripts/migrate-session-keys.ts
```

This fix ensures that the secure file exchange system maintains its security properties while providing a consistent user experience for file access across login sessions.