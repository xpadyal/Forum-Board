import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import Groq from "groq-sdk";

// Load environment variables from .env file FIRST
dotenv.config();

// Initialize Groq client for moderation (using llama-guard-4-12b)
export const groq = process.env.GROQ_API_KEY
  ? new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  : null;

// Server configuration
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  log: ['error', 'warn'],
});

// Graceful shutdown for Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export const jwtSecret = process.env.JWT_SECRET;