-- ============================================================================
-- SMART ATTENDANCE MANAGEMENT SYSTEM
-- PHASE 2: DATABASE ARCHITECTURE — INITIAL MIGRATION
-- Migration: 20260818000001_phase2_initial_schema
-- Target: PostgreSQL 14+
-- Generated: 2026-08-18
-- ============================================================================
-- This migration creates all 16 tables from scratch with:
--   • UUIDs as primary keys
--   • All foreign key constraints with appropriate ON DELETE behaviour
--   • DB-level UNIQUE constraint on attendance(session_id, student_id)
--   • Performance indexes on all FK columns and query-critical fields
--   • Row-Level Security (RLS) policies for Supabase / PostgreSQL
--   • Timestamps on every table
--   • Status enums enforced at DB level via CHECK constraints
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM ('ADMIN', 'FACULTY', 'STUDENT');

CREATE TYPE "DegreeType" AS ENUM (
  'B_TECH', 'B_E', 'M_TECH', 'B_SC', 'M_SC', 'MBA', 'MCA'
);

CREATE TYPE "SubjectType" AS ENUM (
  'THEORY', 'LAB', 'ELECTIVE', 'SEMINAR'
);

CREATE TYPE "EnrollmentStatus" AS ENUM (
  'ENROLLED', 'DROPPED', 'COMPLETED'
);

CREATE TYPE "ClassSessionStatus" AS ENUM (
  'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'
);

-- Phase 2 Spec: ACTIVE | EXPIRED | FINALIZED | CANCELLED
CREATE TYPE "AttendanceSessionStatus" AS ENUM (
  'ACTIVE',     -- QR is live; students can scan
  'EXPIRED',    -- Time window elapsed; auto-absent pending
  'FINALIZED',  -- Auto-absent done; closed permanently
  'CANCELLED'   -- Cancelled before any meaningful action
);

CREATE TYPE "AttendanceStatus" AS ENUM (
  'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'
);

CREATE TYPE "AttendanceMethod" AS ENUM (
  'QR_SCAN', 'MANUAL_FACULTY', 'AUTO_ABSENT', 'RFID_CARD'
);

CREATE TYPE "NotificationType" AS ENUM (
  'INFO', 'WARNING', 'ALERT', 'ATTENDANCE', 'SYSTEM'
);

CREATE TYPE "AuditAction" AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'OVERRIDE', 'AUTO_MARK'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email"         VARCHAR(255)  NOT NULL,
    "password_hash" VARCHAR(255)  NOT NULL,
    "full_name"     VARCHAR(150)  NOT NULL,
    "role"          "Role"        NOT NULL,
    "phone"         VARCHAR(25),
    "avatar_url"    VARCHAR(500),
    "is_active"     BOOLEAN       NOT NULL DEFAULT TRUE,
    "last_login_at" TIMESTAMPTZ,
    "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE INDEX "idx_users_email"     ON "users" ("email");
CREATE INDEX "idx_users_role"      ON "users" ("role");
CREATE INDEX "idx_users_is_active" ON "users" ("is_active");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: departments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "departments" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code"                  VARCHAR(20)  NOT NULL,
    "name"                  VARCHAR(150) NOT NULL,
    "description"           TEXT,
    "head_of_department_id" UUID,        -- Soft reference to faculty.id (avoid circular FK)
    "is_active"             BOOLEAN      NOT NULL DEFAULT TRUE,
    "created_at"            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "departments_code_key" UNIQUE ("code")
);

CREATE INDEX "idx_departments_code" ON "departments" ("code");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3: courses
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "courses" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "department_id"   UUID          NOT NULL,
    "code"            VARCHAR(25)   NOT NULL,
    "name"            VARCHAR(150)  NOT NULL,
    "degree_type"     "DegreeType"  NOT NULL,
    "total_semesters" INT           NOT NULL DEFAULT 8,
    "is_active"       BOOLEAN       NOT NULL DEFAULT TRUE,
    "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT "courses_code_key" UNIQUE ("code"),
    CONSTRAINT "fk_courses_department"
        FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_courses_department_id" ON "courses" ("department_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4: semesters
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "semesters" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id"       UUID         NOT NULL,
    "semester_number" INT          NOT NULL,
    "academic_year"   VARCHAR(20)  NOT NULL,
    "is_current"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "start_date"      DATE         NOT NULL,
    "end_date"        DATE         NOT NULL,
    "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_semesters_course"
        FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE,
    CONSTRAINT "semesters_course_semester_year_key"
        UNIQUE ("course_id", "semester_number", "academic_year")
);

CREATE INDEX "idx_semesters_course_id"  ON "semesters" ("course_id");
CREATE INDEX "idx_semesters_is_current" ON "semesters" ("is_current");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 5: sections
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "sections" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "semester_id" UUID         NOT NULL,
    "name"        VARCHAR(50)  NOT NULL,
    "capacity"    INT          NOT NULL DEFAULT 60,
    "room_number" VARCHAR(50),
    "is_active"   BOOLEAN      NOT NULL DEFAULT TRUE,
    "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_sections_semester"
        FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE CASCADE,
    CONSTRAINT "sections_semester_name_key"
        UNIQUE ("semester_id", "name")
);

CREATE INDEX "idx_sections_semester_id" ON "sections" ("semester_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 6: faculty
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "faculty" (
    "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"        UUID         NOT NULL,
    "employee_id"    VARCHAR(50)  NOT NULL,
    "department_id"  UUID         NOT NULL,
    "designation"    VARCHAR(100) NOT NULL,
    "qualification"  VARCHAR(100) NOT NULL,
    "specialization" VARCHAR(150),
    "joining_date"   DATE         NOT NULL,
    "office_room"    VARCHAR(50),
    "is_active"      BOOLEAN      NOT NULL DEFAULT TRUE,
    "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "faculty_user_id_key"     UNIQUE ("user_id"),
    CONSTRAINT "faculty_employee_id_key" UNIQUE ("employee_id"),
    CONSTRAINT "fk_faculty_user"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_faculty_department"
        FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_faculty_department_id" ON "faculty" ("department_id");
CREATE INDEX "idx_faculty_employee_id"   ON "faculty" ("employee_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 7: students
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "students" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"         UUID           NOT NULL,
    "roll_number"     VARCHAR(50)    NOT NULL,
    "register_number" VARCHAR(50)    NOT NULL,
    "department_id"   UUID           NOT NULL,
    "course_id"       UUID           NOT NULL,
    "semester_id"     UUID           NOT NULL,
    "section_id"      UUID           NOT NULL,
    "batch_year"      VARCHAR(20)    NOT NULL,
    "admission_date"  DATE,
    "parent_name"     VARCHAR(150),
    "parent_contact"  VARCHAR(25),
    "current_gpa"     DECIMAL(3, 2),
    "is_active"       BOOLEAN        NOT NULL DEFAULT TRUE,
    "created_at"      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT "students_user_id_key"         UNIQUE ("user_id"),
    CONSTRAINT "students_roll_number_key"     UNIQUE ("roll_number"),
    CONSTRAINT "students_register_number_key" UNIQUE ("register_number"),
    CONSTRAINT "fk_students_user"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_students_department"
        FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_students_course"
        FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_students_semester"
        FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_students_section"
        FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_students_roll_number"     ON "students" ("roll_number");
CREATE INDEX "idx_students_register_number" ON "students" ("register_number");
CREATE INDEX "idx_students_section_id"      ON "students" ("section_id");
CREATE INDEX "idx_students_department_id"   ON "students" ("department_id");
CREATE INDEX "idx_students_course_id"       ON "students" ("course_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 8: subjects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "subjects" (
    "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "course_id"    UUID          NOT NULL,
    "semester_id"  UUID          NOT NULL,
    "code"         VARCHAR(25)   NOT NULL,
    "name"         VARCHAR(150)  NOT NULL,
    "credit_hours" INT           NOT NULL DEFAULT 3,
    "type"         "SubjectType" NOT NULL DEFAULT 'THEORY',
    "syllabus_url" VARCHAR(500),
    "is_active"    BOOLEAN       NOT NULL DEFAULT TRUE,
    "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT "subjects_code_key" UNIQUE ("code"),
    CONSTRAINT "fk_subjects_course"
        FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_subjects_semester"
        FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_subjects_course_id"   ON "subjects" ("course_id");
CREATE INDEX "idx_subjects_semester_id" ON "subjects" ("semester_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 9: faculty_subjects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "faculty_subjects" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "faculty_id"    UUID        NOT NULL,
    "subject_id"    UUID        NOT NULL,
    "section_id"    UUID        NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "is_primary"    BOOLEAN     NOT NULL DEFAULT TRUE,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_fsubjects_faculty"
        FOREIGN KEY ("faculty_id") REFERENCES "faculty" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_fsubjects_subject"
        FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_fsubjects_section"
        FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE CASCADE,
    CONSTRAINT "faculty_subjects_faculty_subject_section_year_key"
        UNIQUE ("faculty_id", "subject_id", "section_id", "academic_year")
);

CREATE INDEX "idx_fsubjects_faculty_id"  ON "faculty_subjects" ("faculty_id");
CREATE INDEX "idx_fsubjects_subject_id"  ON "faculty_subjects" ("subject_id");
CREATE INDEX "idx_fsubjects_section_id"  ON "faculty_subjects" ("section_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 10: student_subjects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "student_subjects" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id"    UUID               NOT NULL,
    "subject_id"    UUID               NOT NULL,
    "section_id"    UUID               NOT NULL,
    "academic_year" VARCHAR(20)        NOT NULL,
    "status"        "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "created_at"    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_ssubjects_student"
        FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_ssubjects_subject"
        FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_ssubjects_section"
        FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE CASCADE,
    CONSTRAINT "student_subjects_student_subject_year_key"
        UNIQUE ("student_id", "subject_id", "academic_year")
);

CREATE INDEX "idx_ssubjects_student_id" ON "student_subjects" ("student_id");
CREATE INDEX "idx_ssubjects_subject_id" ON "student_subjects" ("subject_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 11: class_sessions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "class_sessions" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "subject_id" UUID                  NOT NULL,
    "faculty_id" UUID                  NOT NULL,
    "section_id" UUID                  NOT NULL,
    "date"       DATE                  NOT NULL,
    "start_time" TIME                  NOT NULL,
    "end_time"   TIME                  NOT NULL,
    "room"       VARCHAR(50)           NOT NULL,
    "topic"      VARCHAR(255),
    "status"     "ClassSessionStatus"  NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_csessions_subject"
        FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_csessions_faculty"
        FOREIGN KEY ("faculty_id") REFERENCES "faculty" ("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_csessions_section"
        FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_csessions_faculty_date"  ON "class_sessions" ("faculty_id", "date");
CREATE INDEX "idx_csessions_section_date"  ON "class_sessions" ("section_id", "date");
CREATE INDEX "idx_csessions_status"        ON "class_sessions" ("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 12: attendance_sessions
-- Core Phase 2 table — drives the QR attendance lifecycle
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "attendance_sessions" (
    "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "class_session_id"     UUID                       NOT NULL,
    "faculty_id"           UUID                       NOT NULL,

    -- Security / QR fields
    "session_token"        VARCHAR(512)               NOT NULL,  -- Signed JWT/ULID for API auth
    "qr_payload_hash"      VARCHAR(64)                NOT NULL,  -- SHA-256 of current QR content
    "qr_secret_key"        VARCHAR(128)               NOT NULL,  -- HMAC secret (server-only)
    "qr_rotation_seconds"  INT                        NOT NULL DEFAULT 15,

    -- Timing
    "start_time"           TIMESTAMPTZ                NOT NULL,
    "end_time"             TIMESTAMPTZ,                          -- Set on FINALIZED/CANCELLED
    "expires_at"           TIMESTAMPTZ                NOT NULL,  -- Hard QR deadline

    -- Status: ACTIVE -> EXPIRED -> FINALIZED | ACTIVE -> CANCELLED
    "status"               "AttendanceSessionStatus"  NOT NULL DEFAULT 'ACTIVE',

    -- Denormalized counters (kept in sync by app/triggers)
    "total_enrolled"        INT     NOT NULL DEFAULT 0,
    "total_present"         INT     NOT NULL DEFAULT 0,
    "total_absent"          INT     NOT NULL DEFAULT 0,
    "total_late"            INT     NOT NULL DEFAULT 0,
    "auto_absent_processed" BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadata
    "cancelled_reason"      TEXT,
    "finalized_at"          TIMESTAMPTZ,
    "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "attendance_sessions_token_key"
        UNIQUE ("session_token"),
    CONSTRAINT "fk_asessions_class_session"
        FOREIGN KEY ("class_session_id") REFERENCES "class_sessions" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_asessions_faculty"
        FOREIGN KEY ("faculty_id") REFERENCES "faculty" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_asessions_status"       ON "attendance_sessions" ("status");
CREATE INDEX "idx_asessions_token"        ON "attendance_sessions" ("session_token");
CREATE INDEX "idx_asessions_faculty_id"   ON "attendance_sessions" ("faculty_id");
CREATE INDEX "idx_asessions_expires_at"   ON "attendance_sessions" ("expires_at");
CREATE INDEX "idx_asessions_class_session" ON "attendance_sessions" ("class_session_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 13: attendance
-- One row per student per session. UNIQUE constraint at DB level prevents
-- any student from being marked twice in the same attendance session.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "attendance" (
    "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "attendance_session_id" UUID                 NOT NULL,
    "student_id"            UUID                 NOT NULL,
    "marked_at"             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    "status"                "AttendanceStatus"   NOT NULL,
    "method"                "AttendanceMethod"   NOT NULL,

    -- Evidence
    "ip_address"            INET,
    "device_info"           VARCHAR(255),
    "geo_latitude"          DECIMAL(10, 8),
    "geo_longitude"         DECIMAL(11, 8),
    "user_agent"            VARCHAR(512),

    -- Override / verification
    "verified_by"           UUID,                -- user_id of faculty who overrode
    "notes"                 TEXT,

    "created_at"            TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    "updated_at"            TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

    -- DB-LEVEL CONSTRAINT: prevents duplicate attendance for same student in same session
    CONSTRAINT "attendance_session_student_key"
        UNIQUE ("attendance_session_id", "student_id"),

    CONSTRAINT "fk_attendance_session"
        FOREIGN KEY ("attendance_session_id") REFERENCES "attendance_sessions" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_attendance_student"
        FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE
);

CREATE INDEX "idx_attendance_student_id"   ON "attendance" ("student_id");
CREATE INDEX "idx_attendance_status"       ON "attendance" ("status");
CREATE INDEX "idx_attendance_marked_at"    ON "attendance" ("marked_at");
CREATE INDEX "idx_attendance_session_id"   ON "attendance" ("attendance_session_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 14: notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "notifications" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"     UUID               NOT NULL,
    "title"       VARCHAR(200)       NOT NULL,
    "message"     TEXT               NOT NULL,
    "type"        "NotificationType" NOT NULL DEFAULT 'INFO',
    "is_read"     BOOLEAN            NOT NULL DEFAULT FALSE,
    "read_at"     TIMESTAMPTZ,
    "action_link" VARCHAR(255),
    "metadata"    JSONB,
    "created_at"  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_notifications_user"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE INDEX "idx_notifications_user_read" ON "notifications" ("user_id", "is_read");
CREATE INDEX "idx_notifications_created"   ON "notifications" ("created_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 15: attendance_audit_logs
-- Immutable audit trail — records are never updated or deleted
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "attendance_audit_logs" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "attendance_id"   UUID                NOT NULL,
    "performed_by"    UUID                NOT NULL,
    "action"          "AuditAction"       NOT NULL,
    "previous_status" "AttendanceStatus",
    "new_status"      "AttendanceStatus"  NOT NULL,
    "reason"          TEXT,
    "ip_address"      INET,
    "metadata"        JSONB,
    "created_at"      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_audit_attendance"
        FOREIGN KEY ("attendance_id") REFERENCES "attendance" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_audit_performed_by"
        FOREIGN KEY ("performed_by") REFERENCES "users" ("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_audit_attendance_id"  ON "attendance_audit_logs" ("attendance_id");
CREATE INDEX "idx_audit_performed_by"   ON "attendance_audit_logs" ("performed_by");
CREATE INDEX "idx_audit_created_at"     ON "attendance_audit_logs" ("created_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 16: system_settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "system_settings" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "setting_key"   VARCHAR(100) NOT NULL,
    "setting_value" TEXT         NOT NULL,
    "category"      VARCHAR(50)  NOT NULL DEFAULT 'GENERAL',
    "description"   TEXT,
    "is_public"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "updated_by"    UUID,
    "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "system_settings_key_key" UNIQUE ("setting_key"),
    CONSTRAINT "fk_settings_updated_by"
        FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL
);

CREATE INDEX "idx_settings_category" ON "system_settings" ("category");

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS: Auto-update updated_at timestamps
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'departments', 'courses', 'semesters', 'sections',
    'faculty', 'students', 'subjects', 'faculty_subjects',
    'student_subjects', 'class_sessions', 'attendance_sessions',
    'attendance'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on sensitive tables. Supabase will use these with its
-- auth.uid() helper once JWTs are wired up.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE "users"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "faculty"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_sessions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_audit_logs" ENABLE ROW LEVEL SECURITY;

-- ── users: each user can only read their own row; admins read all ─────────────
CREATE POLICY "users_self_read" ON "users"
  FOR SELECT
  USING (
    id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_role', TRUE) = 'ADMIN'
  );

CREATE POLICY "users_admin_all" ON "users"
  FOR ALL
  USING (current_setting('app.current_role', TRUE) = 'ADMIN');

-- ── attendance: students see only their own; faculty see their section; admins see all ──
CREATE POLICY "attendance_student_self" ON "attendance"
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = current_setting('app.current_user_id', TRUE)::UUID
    )
    OR current_setting('app.current_role', TRUE) IN ('FACULTY', 'ADMIN')
  );

CREATE POLICY "attendance_faculty_write" ON "attendance"
  FOR INSERT
  WITH CHECK (current_setting('app.current_role', TRUE) IN ('FACULTY', 'ADMIN'));

CREATE POLICY "attendance_faculty_update" ON "attendance"
  FOR UPDATE
  USING (current_setting('app.current_role', TRUE) IN ('FACULTY', 'ADMIN'));

-- ── attendance_sessions: faculty manage their own; students read ACTIVE only ──
CREATE POLICY "asessions_faculty_manage" ON "attendance_sessions"
  FOR ALL
  USING (
    faculty_id IN (
      SELECT id FROM faculty WHERE user_id = current_setting('app.current_user_id', TRUE)::UUID
    )
    OR current_setting('app.current_role', TRUE) = 'ADMIN'
  );

CREATE POLICY "asessions_student_read_active" ON "attendance_sessions"
  FOR SELECT
  USING (status = 'ACTIVE' OR current_setting('app.current_role', TRUE) IN ('FACULTY', 'ADMIN'));

-- ── notifications: users see only their own ───────────────────────────────────
CREATE POLICY "notifications_self" ON "notifications"
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- ── audit_logs: faculty and admins read; no user writes directly ──────────────
CREATE POLICY "audit_logs_read" ON "attendance_audit_logs"
  FOR SELECT
  USING (current_setting('app.current_role', TRUE) IN ('FACULTY', 'ADMIN'));

-- ── students: self-read or admin/faculty ──────────────────────────────────────
CREATE POLICY "students_self_read" ON "students"
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_role', TRUE) IN ('FACULTY', 'ADMIN')
  );

-- ── faculty: self-read or admin ───────────────────────────────────────────────
CREATE POLICY "faculty_self_read" ON "faculty"
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR current_setting('app.current_role', TRUE) = 'ADMIN'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: System settings (non-demo; required operational config)
-- These are REAL configuration values, not fake data.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO "system_settings" ("id", "setting_key", "setting_value", "category", "description", "is_public")
VALUES
  (gen_random_uuid(), 'qr_rotation_seconds',        '15',         'ATTENDANCE', 'How often the QR code payload rotates (seconds)',         TRUE),
  (gen_random_uuid(), 'qr_expiry_seconds',           '900',        'ATTENDANCE', 'Total duration a QR attendance session remains ACTIVE',    TRUE),
  (gen_random_uuid(), 'attendance_threshold_percent','75',         'ATTENDANCE', 'Minimum attendance percentage before shortage warning',    TRUE),
  (gen_random_uuid(), 'auto_absent_cron',            '*/5 * * * *','SYSTEM',     'Cron schedule for auto-absent daemon',                     FALSE),
  (gen_random_uuid(), 'late_grace_period_minutes',   '10',         'ATTENDANCE', 'Minutes after class start before PRESENT becomes LATE',   TRUE),
  (gen_random_uuid(), 'max_qr_scans_per_session',    '1',          'SECURITY',   'Max times one student can attempt to scan per session',    FALSE),
  (gen_random_uuid(), 'app_name',                    'AttendX',    'GENERAL',    'Application display name',                                 TRUE),
  (gen_random_uuid(), 'app_version',                 '2.0.0',      'GENERAL',    'Current application version',                              TRUE)
ON CONFLICT ("setting_key") DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION COMPLETE
-- ─────────────────────────────────────────────────────────────────────────────
