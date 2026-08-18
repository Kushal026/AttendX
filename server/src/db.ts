/**
 * Prisma Client Singleton — Phase 2
 *
 * Configured for Prisma 7 with PostgreSQL adapter (@prisma/adapter-pg).
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Extend globalThis so TypeScript knows about the cached instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[Prisma] DATABASE_URL is not set in environment variables.');
  }

  const pool = new pg.Pool({ 
    connectionString,
    ssl: connectionString?.includes('supabase.co') || connectionString?.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : undefined
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    errorFormat: 'pretty',
  });
}

// In production, always create a fresh instance.
// In development, reuse the cached global to avoid connection pool exhaustion.
export const prisma: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (globalThis.__prisma ??= createPrismaClient());

export default prisma;
