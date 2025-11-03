import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env file
dotenv.config();

// Server configuration
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_API_KEY must be set in .env file');
  process.exit(1);
}

// Initialize and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export Supabase URL for reference (without exposing the key)
export const supabaseConfig = {
  url: supabaseUrl,
};

// Initialize and export Prisma Client
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown for Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

