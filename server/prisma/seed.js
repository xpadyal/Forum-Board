import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords for seeded users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Seed users
  const users = [
    {
      username: 'admin',
      email: 'admin@forum.com',
      password: hashedPassword,
      role: 'admin',
    },
    {
      username: 'john_doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
    },
    {
      username: 'jane_smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
    },
    {
      username: 'alice_wonder',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'user',
    },
    {
      username: 'bob_builder',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'user',
    },
  ];

  console.log('👤 Creating users...');

  for (const userData of users) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await prisma.user.create({
        data: userData,
      });

      console.log(`✅ Created user: ${user.username} (${user.email})`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

