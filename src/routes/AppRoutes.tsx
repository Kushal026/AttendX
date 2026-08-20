import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleGuard } from '../components/auth/RoleGuard';

// Public & Auth Pages
import { LandingPage } from '../pages/landing/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminStudentsPage } from '../pages/admin/AdminStudentsPage';
import { AdminFacultyPage } from '../pages/admin/AdminFacultyPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminAcademicsPage } from '../pages/admin/AdminAcademicsPage';
import { AdminAssignmentsPage } from '../pages/admin/AdminAssignmentsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminAttendancePage } from '../pages/admin/AdminAttendancePage';

// Faculty Pages
import { FacultyDashboard } from '../pages/faculty/FacultyDashboard';
import { FacultySubjectsPage } from '../pages/faculty/FacultySubjectsPage';
import { FacultyClassesPage } from '../pages/faculty/FacultyClassesPage';
import { FacultyStudentsPage } from '../pages/faculty/FacultyStudentsPage';
import { FacultyStartAttendancePage } from '../pages/faculty/FacultyStartAttendancePage';
import { FacultyQRSessionPage } from '../pages/faculty/FacultyQRSessionPage';
import { FacultyAttendancePage } from '../pages/faculty/FacultyAttendancePage';
import { FacultyReportsPage } from '../pages/faculty/FacultyReportsPage';
import { FacultyProfilePage } from '../pages/faculty/FacultyProfilePage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentScanPage } from '../pages/student/StudentScanPage';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';
import { StudentSubjectsPage } from '../pages/student/StudentSubjectsPage';
import { StudentReportsPage } from '../pages/student/StudentReportsPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ADMIN PROTECTED ROUTES (/admin/*) — STRICTLY ADMIN ONLY */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ADMIN']}>
              <AppShell />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="faculty" element={<AdminFacultyPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="academics" element={<AdminAcademicsPage />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
      </Route>

      {/* FACULTY PROTECTED ROUTES (/faculty/*) — STRICTLY FACULTY ONLY */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['FACULTY']}>
              <AppShell />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="subjects" element={<FacultySubjectsPage />} />
        <Route path="classes" element={<FacultyClassesPage />} />
        <Route path="students" element={<FacultyStudentsPage />} />
        <Route path="attendance/start" element={<FacultyStartAttendancePage />} />
        <Route path="attendance/session/:sessionId" element={<FacultyQRSessionPage />} />
        <Route path="attendance" element={<FacultyAttendancePage />} />
        <Route path="reports" element={<FacultyReportsPage />} />
        <Route path="profile" element={<FacultyProfilePage />} />
      </Route>

      {/* STUDENT PROTECTED ROUTES (/student/*) — STRICTLY STUDENT ONLY */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['STUDENT']}>
              <AppShell />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="scan" element={<StudentScanPage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="subjects" element={<StudentSubjectsPage />} />
        <Route path="reports" element={<StudentReportsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
