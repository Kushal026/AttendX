/**
 * Apply Migration Script
 * =======================
 * Executes migration.sql directly against your Supabase PostgreSQL database.
 * Run with: npm run db:apply
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function applyMigration() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('\n❌ ERROR: DATABASE_URL is not configured or still contains [YOUR-PASSWORD].');
    console.error('Please update DATABASE_URL in server/.env with your actual Supabase database password.\n');
    process.exit(1);
  }

  console.log('\nConnecting to Supabase PostgreSQL database...');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase (Region: ap-northeast-1)!');

    const migrationPath = path.resolve(
      __dirname,
      '../../prisma/migrations/20260818000001_phase2_initial_schema/migration.sql'
    );

    console.log('Reading migration file:', migrationPath);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Executing Phase 2 migration (16 tables, constraints, indexes, triggers, RLS)...');
    await client.query(sql);

    console.log('\n🎉 Phase 2 Database Migration successfully applied to Supabase!');
    console.log('All 16 tables, unique constraints, and RLS policies are now live in your Supabase project.\n');
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
