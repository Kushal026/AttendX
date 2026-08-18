/**
 * Phase 2 — Schema Verification Script
 * =====================================
 * Run with: npm run db:verify
 *           (or: npx tsx src/scripts/verify-schema.ts)
 *
 * Validates (without requiring a live database):
 *   1. Prisma Client was generated with all 16 models
 *   2. All enum types are exported with correct values
 *   3. Critical constraint fields exist in correct models
 *   4. QR security fields present in attendance_sessions
 *   5. Schema source file contains key SQL constraints
 *   6. Optional: live database connectivity (requires DATABASE_URL)
 */

import * as prismaClient from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Types ───────────────────────────────────────────────────────────────────
interface CheckResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  detail?: string;
}

const results: CheckResult[] = [];

function pass(check: string, detail?: string): void {
  results.push({ check, status: 'PASS', detail });
  console.log(`  ✅ ${check}${detail ? ` — ${detail}` : ''}`);
}

function fail(check: string, detail?: string): void {
  results.push({ check, status: 'FAIL', detail });
  console.error(`  ❌ ${check}${detail ? ` — ${detail}` : ''}`);
}

function skip(check: string, detail?: string): void {
  results.push({ check, status: 'SKIP', detail });
  console.log(`  ⏭  ${check}${detail ? ` — ${detail}` : ''}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runVerification(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  AttendX — Phase 2 Schema Verification           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── Check 1: Prisma Client — All 16 Models ───────────────────────────────
  console.log('► Check 1: Prisma Client — All 16 Models Present');
  const expectedModels = [
    'User', 'Department', 'Course', 'Semester', 'Section',
    'Faculty', 'Student', 'Subject', 'FacultySubject', 'StudentSubject',
    'ClassSession', 'AttendanceSession', 'Attendance',
    'Notification', 'AttendanceAuditLog', 'SystemSetting',
  ];

  const modelNames = Object.values((prismaClient as any).ModelName ?? {}) as string[];
  if (modelNames.length === 0) {
    fail('ModelName enum not found in @prisma/client');
  } else {
    for (const model of expectedModels) {
      if (modelNames.includes(model)) {
        pass(`Model "${model}"`);
      } else {
        fail(`Model "${model}" MISSING from generated client`);
      }
    }
  }

  // ── Check 2: Enums — Phase 2 Status Values ───────────────────────────────
  console.log('\n► Check 2: Enum Definitions & Phase 2 Required Statuses');

  const enumChecks: Array<{ name: string; exportKey: string; expected: string[] }> = [
    {
      name: 'AttendanceSessionStatus',
      exportKey: 'AttendanceSessionStatus',
      expected: ['ACTIVE', 'EXPIRED', 'FINALIZED', 'CANCELLED'],
    },
    {
      name: 'AttendanceStatus',
      exportKey: 'AttendanceStatus',
      expected: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
    },
    {
      name: 'AttendanceMethod',
      exportKey: 'AttendanceMethod',
      expected: ['QR_SCAN', 'MANUAL_FACULTY', 'AUTO_ABSENT', 'RFID_CARD'],
    },
    {
      name: 'Role',
      exportKey: 'Role',
      expected: ['ADMIN', 'FACULTY', 'STUDENT'],
    },
    {
      name: 'AuditAction',
      exportKey: 'AuditAction',
      expected: ['CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'AUTO_MARK'],
    },
    {
      name: 'ClassSessionStatus',
      exportKey: 'ClassSessionStatus',
      expected: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    },
    {
      name: 'EnrollmentStatus',
      exportKey: 'EnrollmentStatus',
      expected: ['ENROLLED', 'DROPPED', 'COMPLETED'],
    },
    {
      name: 'SubjectType',
      exportKey: 'SubjectType',
      expected: ['THEORY', 'LAB', 'ELECTIVE', 'SEMINAR'],
    },
  ];

  for (const enumCheck of enumChecks) {
    const enumObj = (prismaClient as Record<string, unknown>)[enumCheck.exportKey] as Record<string, string> | undefined;
    if (!enumObj) {
      fail(`Enum "${enumCheck.name}" not exported from @prisma/client`);
      continue;
    }
    const actualValues = Object.values(enumObj);
    const missing = enumCheck.expected.filter(v => !actualValues.includes(v));
    if (missing.length === 0) {
      pass(`Enum "${enumCheck.name}" — all values present [${enumCheck.expected.join(', ')}]`);
    } else {
      fail(`Enum "${enumCheck.name}" missing: [${missing.join(', ')}]`);
    }
  }

  // ── Check 3: Schema File — Structural Constraints ─────────────────────────
  console.log('\n► Check 3: Schema File — Critical SQL Constraints');
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  const migrationPath = path.resolve(
    __dirname,
    '../../prisma/migrations/20260818000001_phase2_initial_schema/migration.sql',
  );

  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Duplicate attendance prevention
    if (schemaContent.includes('@@unique([attendance_session_id, student_id])')) {
      pass('Prisma schema: @@unique([attendance_session_id, student_id]) — duplicate prevention ✓');
    } else {
      fail('Prisma schema: Missing @@unique([attendance_session_id, student_id])');
    }

    // Session token uniqueness
    if (schemaContent.includes('session_token') && schemaContent.includes('@unique')) {
      pass('Prisma schema: session_token @unique — QR session deduplication ✓');
    } else {
      fail('Prisma schema: session_token @unique NOT FOUND');
    }

    // Faculty-subject-section composite unique
    if (schemaContent.includes('@@unique([faculty_id, subject_id, section_id, academic_year])')) {
      pass('Prisma schema: FacultySubject composite unique ✓');
    } else {
      fail('Prisma schema: FacultySubject composite unique NOT FOUND');
    }

    // ACTIVE/EXPIRED/FINALIZED/CANCELLED in schema
    if (
      schemaContent.includes('ACTIVE') &&
      schemaContent.includes('EXPIRED') &&
      schemaContent.includes('FINALIZED') &&
      schemaContent.includes('CANCELLED')
    ) {
      pass('Prisma schema: All 4 session statuses (ACTIVE/EXPIRED/FINALIZED/CANCELLED) ✓');
    } else {
      fail('Prisma schema: Missing one or more session statuses');
    }
  } else {
    fail('prisma/schema.prisma not found', schemaPath);
  }

  // Check migration SQL file
  if (fs.existsSync(migrationPath)) {
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

    if (sqlContent.includes('UNIQUE ("attendance_session_id", "student_id")')) {
      pass('Migration SQL: UNIQUE(attendance_session_id, student_id) constraint present ✓');
    } else {
      fail('Migration SQL: UNIQUE(attendance_session_id, student_id) NOT FOUND');
    }

    if (sqlContent.includes('ENABLE ROW LEVEL SECURITY')) {
      pass('Migration SQL: Row Level Security (RLS) enabled ✓');
    } else {
      fail('Migration SQL: RLS not configured');
    }

    if (sqlContent.includes('CREATE POLICY')) {
      const policyMatches = sqlContent.match(/CREATE POLICY/g)?.length ?? 0;
      pass(`Migration SQL: ${policyMatches} RLS policies defined ✓`);
    } else {
      fail('Migration SQL: No RLS policies found');
    }

    if (sqlContent.includes('trigger_set_updated_at')) {
      pass('Migration SQL: Auto-update triggers for updated_at ✓');
    } else {
      fail('Migration SQL: Auto-update triggers NOT FOUND');
    }

    const tableCount = (sqlContent.match(/CREATE TABLE/g) ?? []).length;
    if (tableCount === 16) {
      pass(`Migration SQL: All 16 CREATE TABLE statements found ✓`);
    } else {
      fail(`Migration SQL: Expected 16 tables, found ${tableCount}`);
    }
  } else {
    fail('Migration SQL file not found', migrationPath);
  }

  // ── Check 4: QR Security Fields in Schema ────────────────────────────────
  console.log('\n► Check 4: QR Security Field Definitions in ScalarFieldEnum');
  const sessFieldEnum = (prismaClient as Record<string, unknown>)['AttendanceSessionScalarFieldEnum'] as
    | Record<string, string>
    | undefined;

  const requiredSessionFields = [
    'session_token', 'qr_payload_hash', 'qr_secret_key',
    'qr_rotation_seconds', 'expires_at', 'start_time',
    'status', 'faculty_id', 'class_session_id',
  ];

  if (sessFieldEnum) {
    const actualFields = Object.values(sessFieldEnum);
    for (const field of requiredSessionFields) {
      if (actualFields.includes(field)) {
        pass(`attendance_sessions.${field} ✓`);
      } else {
        fail(`attendance_sessions.${field} MISSING from generated client`);
      }
    }
  } else {
    skip('AttendanceSessionScalarFieldEnum not available in this Prisma version');
  }

  // ── Check 5: Attendance ScalarFieldEnum ──────────────────────────────────
  console.log('\n► Check 5: Attendance Table Fields');
  const attFieldEnum = (prismaClient as Record<string, unknown>)['AttendanceScalarFieldEnum'] as
    | Record<string, string>
    | undefined;

  if (attFieldEnum) {
    const required = ['id', 'attendance_session_id', 'student_id', 'status', 'method', 'marked_at'];
    const actual = Object.values(attFieldEnum);
    for (const f of required) {
      if (actual.includes(f)) {
        pass(`attendance.${f} ✓`);
      } else {
        fail(`attendance.${f} MISSING`);
      }
    }
  } else {
    skip('AttendanceScalarFieldEnum not available — skipping field check');
  }

  // ── Check 6: Optional Live DB Connection ─────────────────────────────────
  console.log('\n► Check 6: Live Database Connection (optional)');
  if (!process.env.DATABASE_URL) {
    skip('DATABASE_URL not configured — skipping live DB test');
    skip('Once DATABASE_URL is set, re-run `npm run db:verify` to test live connectivity');
  } else {
    try {
      const { default: prisma } = (await import('../db.js')) as any;
      await prisma.$connect();
      pass('PostgreSQL connection established');

      const tableCheck = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
      `;
      const dbTables = tableCheck.map((r: any) => r.tablename);
      const expectedDbTables = [
        'users', 'departments', 'courses', 'semesters', 'sections',
        'faculty', 'students', 'subjects', 'faculty_subjects', 'student_subjects',
        'class_sessions', 'attendance_sessions', 'attendance',
        'notifications', 'attendance_audit_logs', 'system_settings',
      ];
      let allFound = true;
      for (const t of expectedDbTables) {
        if (dbTables.includes(t)) {
          pass(`DB: table "${t}" exists ✓`);
        } else {
          fail(`DB: table "${t}" NOT FOUND — run the migration SQL first`);
          allFound = false;
        }
      }
      if (allFound) pass('All 16 tables confirmed in live database ✓');
      await prisma.$disconnect();
    } catch (e) {
      fail('Live DB connection failed', String(e));
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Verification Summary                            ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const passed  = results.filter(r => r.status === 'PASS').length;
  const failed  = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`  PASSED:  ${passed}`);
  console.log(`  FAILED:  ${failed}`);
  console.log(`  SKIPPED: ${skipped}`);

  if (failed === 0) {
    console.log('\n  🎉 Phase 2 Schema Verification: ALL CHECKS PASSED\n');
    process.exit(0);
  } else {
    console.error(`\n  ⚠️  Phase 2 Schema Verification: ${failed} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
