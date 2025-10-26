import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      passwordHash: hashedPassword,
    },
  });

  console.log('✓ Created demo user:', demoUser.username);

  // Create an admin user
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminHashedPassword,
    },
  });

  console.log('✓ Created admin user:', adminUser.username);

  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('Demo credentials:');
  console.log('Username: demo');
  console.log('Password: demo123');
  console.log('');
  console.log('Admin credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });