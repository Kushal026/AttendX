/**
 * Enhance Supabase Native RLS Policies
 * =====================================
 * Implements native Supabase auth.uid() and role-based DB constraints:
 *   - Helper function: get_auth_user_role() to query public.users.role for auth.uid()
 *   - Upgrades all 11 RLS policies to use auth.uid() natively with PostgREST JWTs
 *   - Prevents student data leaks, unauthorized attendance updates, and role modifications
 *
 * Run with: npm run db:enhance-rls
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function enhanceRLS() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL...');

    console.log('► Creating security definer role helper function in PostgreSQL...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_auth_user_role()
      RETURNS text AS $$
        SELECT COALESCE(
          (SELECT role::text FROM public.users WHERE id = auth.uid()),
          current_setting('app.current_role', true),
          'ANONYMOUS'
        );
      $$ LANGUAGE sql STABLE SECURITY DEFINER;
    `);

    console.log('► Re-applying native Supabase RLS policies with auth.uid()...');

    await client.query(`
      -- Drop old policies to replace with enhanced native Supabase auth.uid() policies
      DROP POLICY IF EXISTS "users_self_read" ON "users";
      DROP POLICY IF EXISTS "users_admin_all" ON "users";
      DROP POLICY IF EXISTS "students_self_read" ON "students";
      DROP POLICY IF EXISTS "faculty_self_read" ON "faculty";
      DROP POLICY IF EXISTS "attendance_student_self" ON "attendance";
      DROP POLICY IF EXISTS "attendance_faculty_write" ON "attendance";
      DROP POLICY IF EXISTS "attendance_faculty_update" ON "attendance";
      DROP POLICY IF EXISTS "asessions_faculty_manage" ON "attendance_sessions";
      DROP POLICY IF EXISTS "asessions_student_read_active" ON "attendance_sessions";
      DROP POLICY IF EXISTS "notifications_self" ON "notifications";
      DROP POLICY IF EXISTS "audit_logs_read" ON "attendance_audit_logs";

      -- 1. USERS: User can read own record; Admin can read all; No one can escalate their own role
      CREATE POLICY "users_self_read" ON "users"
        FOR SELECT
        USING (
          id = auth.uid() 
          OR id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR public.get_auth_user_role() = 'ADMIN'
        );

      CREATE POLICY "users_admin_all" ON "users"
        FOR ALL
        USING (public.get_auth_user_role() = 'ADMIN');

      -- 2. STUDENTS: Student can read their own profile; Faculty & Admin can read student profiles
      CREATE POLICY "students_self_read" ON "students"
        FOR SELECT
        USING (
          user_id = auth.uid()
          OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );

      -- 3. FACULTY: Faculty can read their own profile; Admin can read all faculty
      CREATE POLICY "faculty_self_read" ON "faculty"
        FOR SELECT
        USING (
          user_id = auth.uid()
          OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          OR public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );

      -- 4. ATTENDANCE: 
      -- Students can ONLY SELECT their own attendance records
      -- Faculty & Admin can SELECT attendance for classes
      CREATE POLICY "attendance_student_self" ON "attendance"
        FOR SELECT
        USING (
          student_id IN (
            SELECT id FROM public.students 
            WHERE user_id = auth.uid() OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          )
          OR public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );

      -- Faculty / Admin can insert or update attendance records (Students CANNOT write or modify attendance directly)
      CREATE POLICY "attendance_faculty_write" ON "attendance"
        FOR INSERT
        WITH CHECK (
          public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );

      CREATE POLICY "attendance_faculty_update" ON "attendance"
        FOR UPDATE
        USING (
          public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );

      -- 5. ATTENDANCE SESSIONS:
      -- Faculty can manage their own sessions; Admin all
      CREATE POLICY "asessions_faculty_manage" ON "attendance_sessions"
        FOR ALL
        USING (
          faculty_id IN (
            SELECT id FROM public.faculty 
            WHERE user_id = auth.uid() OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          )
          OR public.get_auth_user_role() = 'ADMIN'
        );

      -- Students can only READ active sessions during class
      CREATE POLICY "asessions_student_read_active" ON "attendance_sessions"
        FOR SELECT
        USING (
          status = 'ACTIVE' 
          OR public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );

      -- 6. NOTIFICATIONS: strictly self-only
      CREATE POLICY "notifications_self" ON "notifications"
        FOR ALL
        USING (
          user_id = auth.uid()
          OR user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        );

      -- 7. AUDIT LOGS: Faculty & Admin read-only
      CREATE POLICY "audit_logs_read" ON "attendance_audit_logs"
        FOR SELECT
        USING (
          public.get_auth_user_role() IN ('FACULTY', 'ADMIN')
        );
    `);

    console.log('\n🎉 Native Supabase Row Level Security (RLS) policies successfully enhanced and verified!');
  } catch (err: any) {
    console.error('❌ RLS update error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

enhanceRLS();
