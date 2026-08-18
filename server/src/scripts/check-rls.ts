import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkRLS() {
  const client = new pg.Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    console.log('\n=================== 1. RLS ENABLED STATUS ===================');
    const tables = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    console.table(tables.rows);

    console.log('\n=================== 2. ROW LEVEL SECURITY POLICIES ===================');
    const policies = await client.query(`
      SELECT tablename, policyname, cmd, qual 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      ORDER BY tablename, policyname;
    `);
    console.table(policies.rows);

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

checkRLS();
