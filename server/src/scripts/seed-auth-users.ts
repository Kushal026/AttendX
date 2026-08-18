/**
 * Seed Auth & Academic Test Users
 * =================================
 * Seeds the minimum required academic hierarchy (Department, Course, Semester, Section)
 * and 3 designated test accounts (Admin, Faculty, Student) into both:
 *   1. Supabase Auth (auth.users) with encrypted password "password123"
 *   2. Phase 2 Database (public.users, faculty, students)
 *
 * Run with: npm run db:seed-auth
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function seedAuthUsers() {
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

    // 1. Ensure pgcrypto extension exists for password hashing
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // 2. Create Base Academic Hierarchy for Profiles
    console.log('► Creating foundational Department, Course, Semester, Section...');
    
    // Department: CSE
    const deptRes = await client.query(`
      INSERT INTO "departments" ("id", "code", "name", "description")
      VALUES ('d1000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science and Engineering', 'Department of Computer Science & Engineering')
      ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
      RETURNING "id";
    `);
    const deptId = deptRes.rows[0].id;

    // Course: B.Tech CSE
    const courseRes = await client.query(`
      INSERT INTO "courses" ("id", "department_id", "code", "name", "degree_type", "total_semesters")
      VALUES ('c1000000-0000-0000-0000-000000000001', $1, 'BTECH-CSE', 'B.Tech in Computer Science', 'B_TECH', 8)
      ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name"
      RETURNING "id";
    `, [deptId]);
    const courseId = courseRes.rows[0].id;

    // Semester: Sem 6
    const semRes = await client.query(`
      INSERT INTO "semesters" ("id", "course_id", "semester_number", "academic_year", "is_current", "start_date", "end_date")
      VALUES ('b1000000-0000-0000-0000-000000000001', $1, 6, '2025-2026', TRUE, '2026-01-10', '2026-06-30')
      ON CONFLICT ("course_id", "semester_number", "academic_year") DO UPDATE SET "is_current" = EXCLUDED."is_current"
      RETURNING "id";
    `, [courseId]);
    const semId = semRes.rows[0].id;

    // Section: Section A
    const secRes = await client.query(`
      INSERT INTO "sections" ("id", "semester_id", "name", "capacity", "room_number")
      VALUES ('e1000000-0000-0000-0000-000000000001', $1, 'Section A', 60, 'Lab 302')
      ON CONFLICT ("semester_id", "name") DO UPDATE SET "capacity" = EXCLUDED."capacity"
      RETURNING "id";
    `, [semId]);
    const secId = secRes.rows[0].id;

    console.log('✅ Academic structure created.');

    // 3. User Accounts to Provision
    const testAccounts = [
      {
        id: 'a1000000-0000-0000-0000-000000000001',
        email: 'admin@smartattendance.edu',
        password: 'password123',
        full_name: 'Dr. Robert Vance (Admin)',
        role: 'ADMIN',
        phone: '+1 555-0100',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        id: 'a1000000-0000-0000-0000-000000000002',
        email: 'faculty@smartattendance.edu',
        password: 'password123',
        full_name: 'Prof. Elena Rostova',
        role: 'FACULTY',
        phone: '+1 555-0101',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        employee_id: 'FAC-CSE-2021',
        designation: 'Associate Professor',
        qualification: 'Ph.D. in Computer Science',
      },
      {
        id: 'a1000000-0000-0000-0000-000000000003',
        email: 'student@smartattendance.edu',
        password: 'password123',
        full_name: 'Alex Rivera',
        role: 'STUDENT',
        phone: '+1 555-0102',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        roll_number: '2023CSE042',
        register_number: 'REG-2023-8890',
        batch_year: '2023-2027',
      },
    ];

    console.log('\n► Seeding 3 designated test accounts into public.users & Supabase Auth...');

    for (const acc of testAccounts) {
      // A. Seed into public.users
      const userRes = await client.query(`
        INSERT INTO "users" ("id", "email", "password_hash", "full_name", "role", "phone", "avatar_url", "is_active")
        VALUES ($1::uuid, $2::text, crypt($3::text, gen_salt('bf')), $4::text, $5::"Role", $6::text, $7::text, TRUE)
        ON CONFLICT ("email") DO UPDATE SET
          "full_name" = EXCLUDED."full_name",
          "role" = EXCLUDED."role",
          "password_hash" = crypt($3::text, gen_salt('bf')),
          "avatar_url" = EXCLUDED."avatar_url"
        RETURNING "id";
      `, [acc.id, acc.email, acc.password, acc.full_name, acc.role, acc.phone, acc.avatar_url]);

      const userId = userRes.rows[0].id;
      console.log(`  ✓ public.users record created: ${acc.email} [${acc.role}] (ID: ${userId})`);

      // B. Seed into auth.users (Supabase Auth internal table)
      try {
        await client.query(`
          INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
          )
          VALUES (
            $1::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated',
            $2::text,
            crypt($3::text, gen_salt('bf')),
            NOW(),
            jsonb_build_object('provider', 'email', 'providers', array['email']),
            jsonb_build_object('full_name', $4::text, 'role', $5::text),
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = crypt($3::text, gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
        `, [userId, acc.email, acc.password, acc.full_name, acc.role]);
        console.log(`    ✓ Supabase Auth account synchronized (auth.users ID: ${userId})`);
      } catch (authErr: any) {
        console.warn(`    ⚠️ Note on auth.users: ${authErr.message}`);
      }

      // C. Profile associations
      if (acc.role === 'FACULTY') {
        await client.query(`
          INSERT INTO "faculty" ("id", "user_id", "employee_id", "department_id", "designation", "qualification", "joining_date", "office_room")
          VALUES ('f1000000-0000-0000-0000-000000000001', $1::uuid, $2, $3::uuid, $4, $5, '2021-08-01', 'Room 402')
          ON CONFLICT ("user_id") DO UPDATE SET
            "employee_id" = EXCLUDED."employee_id",
            "designation" = EXCLUDED."designation";
        `, [userId, acc.employee_id, deptId, acc.designation, acc.qualification]);
        console.log(`    ✓ faculty profile linked`);
      } else if (acc.role === 'STUDENT') {
        await client.query(`
          INSERT INTO "students" ("id", "user_id", "roll_number", "register_number", "department_id", "course_id", "semester_id", "section_id", "batch_year", "admission_date", "current_gpa")
          VALUES ('f2000000-0000-0000-0000-000000000001', $1::uuid, $2, $3, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8, '2023-08-15', 3.85)
          ON CONFLICT ("user_id") DO UPDATE SET
            "roll_number" = EXCLUDED."roll_number",
            "register_number" = EXCLUDED."register_number";
        `, [userId, acc.roll_number, acc.register_number, deptId, courseId, semId, secId, acc.batch_year]);
        console.log(`    ✓ students profile linked`);
      }
    }

    console.log('\n🎉 Phase 3 Auth Seeding Complete!');
    console.log('Test Accounts available:');
    console.log('  1. ADMIN:   admin@smartattendance.edu   / password123');
    console.log('  2. FACULTY: faculty@smartattendance.edu / password123');
    console.log('  3. STUDENT: student@smartattendance.edu / password123\n');

  } catch (err: any) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedAuthUsers();
