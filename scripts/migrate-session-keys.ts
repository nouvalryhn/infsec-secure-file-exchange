#!/usr/bin/env tsx

/**
 * Migration script to add session keys to existing users
 * This script should be run after updating the database schema to include sessionKey field
 * 
 * Usage: npx tsx scripts/migrate-session-keys.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateSessionKey } from '../lib/auth/session';

const prisma = new PrismaClient();

async function migrateSessionKeys() {
  console.log('Starting session key migration...');

  try {
    // Find all users without session keys
    const usersWithoutSessionKeys = await prisma.user.findMany({
      where: {
        sessionKey: null
      },
      select: {
        id: true,
        username: true
      }
    });

    console.log(`Found ${usersWithoutSessionKeys.length} users without session keys`);

    if (usersWithoutSessionKeys.length === 0) {
      console.log('All users already have session keys. Migration complete.');
      return;
    }

    // Generate session keys for each user
    for (const user of usersWithoutSessionKeys) {
      const sessionKey = generateSessionKey();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { sessionKey }
      });

      console.log(`Generated session key for user: ${user.username}`);
    }

    console.log(`Successfully migrated ${usersWithoutSessionKeys.length} users`);
    console.log('Session key migration completed successfully!');

  } catch (error) {
    console.error('Error during session key migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateSessionKeys();