# AttendX — QR-Based Smart College Attendance Management System

**AttendX** is an enterprise-grade, secure, dynamic QR-based smart attendance management platform designed for universities, colleges, and higher education institutions. Built on a resilient **PostgreSQL + Prisma ORM** foundation with **Node.js / Express** and **React 18 / Vite**, AttendX eliminates proxy attendance through cryptographically rotating QR codes, server-validated attendance sessions, automatic absence processing, and institutional analytics.

---

## 1. System Architecture Overview

```
                                    POSTGRESQL (Supabase)
                                      16 Core Entities
                                     Row Level Security
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             NODE.JS / EXPRESS REST API                 PRISMA ORM DATA ACCESS
           (Security, QR Tokens, Auto-Absent)        (Strict Relations, Indexing)
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
   REACT 18 / VITE SPA       HTML5 QR SCANNER
    (Tailwind CSS Design,   (Camera Lifecycle &
   Multi-Role Gateways)    Auto-Resource Cleanup)
```

---

## 2. Key Modules & Features

### 🏛️ 1. Administrator Portal (`/admin/*`)
- **Dashboard Overview:** Real-time KPI metrics for Students, Faculty, Departments, Courses, Semesters, Sections, Subjects, and Live Attendance Sessions.
- **Academic Management:** Complete hierarchical control:
  $$\text{Department} \longrightarrow \text{Course} \longrightarrow \text{Semester} \longrightarrow \text{Section} \longrightarrow \text{Students}$$
  $$\text{Course} \longrightarrow \text{Semester} \longrightarrow \text{Subjects}$$
- **Teaching & Student Assignments:** Faculty $\rightarrow$ Subject $\rightarrow$ Section assignments with duplicate conflict prevention, and bulk section student assignments.
- **User Management:** Secure password-hashed user provisioning with non-destructive deactivation (preserving historical attendance data).
- **System Audit Trail:** Immutable, append-only security logs for administrative updates.
- **Institutional Reports & Settings:** Attendance overview, configurable shortage thresholds ($75\%$), and academic session defaults.

### 👨‍🏫 2. Faculty Portal (`/faculty/*`)
- **Dynamic QR Attendance Engine:**
  - Select assigned Subject, Section, and Duration (5 to 30 minutes).
  - Generates HMAC-SHA256 cryptographically rotating dynamic QR payloads refreshed every 15 seconds.
  - Live session progress countdown timer with immediate session closure.
- **Live Classroom Roster:** Real-time live presence counter and student roster search.
- **Attendance Finalization:** Server-driven atomic auto-absent generator marking all unscanned students as `ABSENT`.
- **Attendance History & Session Details:** Chronological session ledger with multi-filtering (Date Range, Subject, Section, Status).
- **Official Reports & Exports:** Filterable student attendance percentage matrix, shortage alerts ($<75\%$), RFC-4180 CSV export, and print-ready institutional sheets.

### 🎓 3. Student Portal (`/student/*`)
- **Secure Camera QR Scanner:** In-browser environment camera scanner with automated stream cleanup, scan-locking, and collision prevention.
- **Server Validation Pipeline:**
  - Token authenticity & countdown validity verification.
  - Student section enrollment verification (prevents cross-section attendance).
  - Duplicate scan prevention (unique compound constraint).
- **Attendance Status Gauge & Subject Performance:** Color-coded exam eligibility indicators ($\ge 75\%$ `ELIGIBLE`, $< 75\%$ `SHORTAGE`).
- **Student Attendance Sheet:** Chronological history with proctor name, date, timestamp, and status.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 18, TypeScript, Vite, React Router 6, Lucide Icons, html5-qrcode |
| **Styling** | Custom Design System, HSL Design Tokens, Glassmorphism, CSS Modules |
| **Backend API** | Node.js, Express, TypeScript, tsx, CORS, Dotenv, Crypto |
| **Database & ORM**| Supabase PostgreSQL, Prisma ORM 7.x, Prisma Pg Adapter |
| **Security** | SHA-256 password hashing, rotating session tokens, Row Level Security |

---

## 4. 16 Relational Database Entities

1. `users` — User authentication, role-based access (`ADMIN`, `FACULTY`, `STUDENT`), and profile information.
2. `students` — University roll numbers, registration numbers, batch cohorts, and section mappings.
3. `faculty` — Employee identification, academic designations, and departmental associations.
4. `departments` — Academic departments (Computer Science, Electronics, Mechanical, etc.).
5. `courses` — Degree programs (B.Tech, M.Tech, MCA, etc.).
6. `semesters` — Academic terms and semester numbers.
7. `sections` — Classroom sections (Section A, Section B, etc.).
8. `subjects` — Academic curriculum courses with credit hours and subject types.
9. `faculty_subjects` — Mapping between faculty proctors, subjects, sections, and academic years.
10. `student_subjects` — Student course enrollments.
11. `class_sessions` — Timetable lecture entries with scheduled rooms and topics.
12. `attendance_sessions` — Attendance sessions with rotating tokens and expiry limits.
13. `attendance` — Verified individual student presence logs (`PRESENT`, `ABSENT`).
14. `attendance_audit_logs` — Append-only immutable administrative audit trail.
15. `system_settings` — Institutional thresholds and default parameters.
16. `notifications` — System notifications schema.

---

## 5. Getting Started & Local Development

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)
- Access to a PostgreSQL instance or Supabase Project

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-org/AttendX.git
   cd AttendX
   ```

2. **Install Dependencies:**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment Variables:**
   - Create `server/.env` with your PostgreSQL database connection:
     ```env
     PORT=5000
     DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?sslmode=require"
     DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?sslmode=require"
     JWT_SECRET="your-secure-jwt-secret"
     ```

4. **Run Database Migrations & Verification:**
   ```bash
   cd server
   npx prisma generate
   npm run db:verify
   cd ..
   ```

5. **Start Development Servers:**
   ```bash
   # Terminal 1 — Start Backend Server (port 5000)
   cd server
   npm run dev

   # Terminal 2 — Start Frontend Application (port 5173)
   npm run dev
   ```

6. **Open the Application:**
   - Frontend: `http://localhost:5173`
   - Backend Health API: `http://localhost:5000/api/v1/health`

---

## 6. Automated Test Suites

All functional capabilities are verified through automated Prisma test runners:

| Command | Phase Tested | Tests | Status |
| :--- | :--- | :---: | :---: |
| `npm run test:phase3-auth` | Phase 3 Authentication & RBAC | 20 | ✅ 100% Pass |
| `npm run test:phase4-admin` | Phase 4 Admin Module Hierarchy | 22 | ✅ 100% Pass |
| `npm run test:phase5-faculty` | Phase 5 Faculty Teaching Portal | 23 | ✅ 100% Pass |
| `npm run test:phase6-qr` | Phase 6 Dynamic QR Session Engine | 24 | ✅ 100% Pass |
| `npm run test:phase7-student` | Phase 7 Student Scanner & Validation | 24 | ✅ 100% Pass |
| `npm run test:phase8-finalization` | Phase 8 Auto-Absent & Finalization | 25 | ✅ 100% Pass |
| `npm run test:phase9-history` | Phase 9 Attendance History & Stats | 26 | ✅ 100% Pass |
| `npm run test:phase10-reports` | Phase 10 Attendance Reports & CSV | 26 | ✅ 100% Pass |
| `npm run test:phase11-admin` | Phase 11 Admin & System Management | 27 | ✅ 100% Pass |
| **`npm run test:phase12-final`** | **Phase 12 Comprehensive 50-Point Suite** | **50** | **✅ 100% Pass** |

---

## 7. Complete End-to-End Workflow

```
ADMIN                                FACULTY                                 STUDENT
  │                                     │                                       │
  ├── 1. Setup Department & Course      │                                       │
  ├── 2. Create Subject & Section       │                                       │
  ├── 3. Assign Faculty to Subject      │                                       │
  └── 4. Assign Student to Section      │                                       │
                                        │                                       │
                                        ├── 5. Faculty Logs In                  │
                                        ├── 6. Starts Attendance Session        │
                                        ├── 7. Displays Dynamic QR Code         │
                                        │                                       │
                                        │                                       ├── 8. Student Opens Scanner
                                        │                                       ├── 9. Scans Dynamic QR
                                        │                                       └── 10. Marked PRESENT
                                        │
                                        ├── 11. Session Timer Closes
                                        ├── 12. Finalization Triggered
                                        │       (Unscanned Students -> ABSENT)
                                        ├── 13. Inspects Attendance History
                                        └── 14. Generates & Exports Reports
                                                                                │
                                                                                ├── 15. Views Attendance %
                                                                                └── 16. Prints Official Report
```

---

## 8. Security & Production Standards

- **Zero Privileged Secrets in Frontend:** Service-role keys and database passwords reside exclusively in `server/.env`.
- **Read-Only Attendance Governance:** Finalized attendance records are immutable.
- **Resource Lifecycle Management:** Camera video tracks in the student scanner are terminated on unmount or scan completion to conserve device battery and memory.
- **Database Consistency Invariant:**
  $$\text{Total Enrolled Cohort} = \text{Total Present} + \text{Total Absent}$$

---

## 9. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
