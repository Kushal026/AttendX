import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  GraduationCap,
  QrCode,
  UserCheck,
  BarChart3,
  Award,
  X,
  School,
  Calendar,
  Layers,
  Link2,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  return (
    <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header justify-between">
        <div className="flex items-center gap-2">
          <div className="sidebar-brand-icon">
            <QrCode size={20} />
          </div>
          <div className="sidebar-brand-text">
            <h3>AttendX</h3>
            <p>Admin Operations</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm md:hidden"
            style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation list based on role */}
      <nav className="sidebar-nav">
        {role === 'ADMIN' && (
          <>
            <div className="nav-section-title">Core Management</div>
            <NavLink
              to="/admin/dashboard"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/students"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <GraduationCap size={18} />
              <span>Students</span>
            </NavLink>

            <NavLink
              to="/admin/faculty"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <School size={18} />
              <span>Faculty</span>
            </NavLink>

            <div className="nav-section-title">Academic Hierarchy</div>
            <NavLink
              to="/admin/academics?tab=departments"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Building2 size={18} />
              <span>Departments</span>
            </NavLink>

            <NavLink
              to="/admin/academics?tab=courses"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Courses</span>
            </NavLink>

            <NavLink
              to="/admin/academics?tab=semesters"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Calendar size={18} />
              <span>Semesters</span>
            </NavLink>

            <NavLink
              to="/admin/academics?tab=sections"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Layers size={18} />
              <span>Sections</span>
            </NavLink>

            <NavLink
              to="/admin/academics?tab=subjects"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileSpreadsheet size={18} />
              <span>Subjects</span>
            </NavLink>

            <NavLink
              to="/admin/assignments"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Link2 size={18} />
              <span>Assignments</span>
            </NavLink>

            <div className="nav-section-title">Operations & Logs</div>
            <NavLink
              to="/admin/attendance"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CalendarCheck size={18} />
              <span>Attendance (Phase 5)</span>
            </NavLink>

            <NavLink
              to="/admin/reports"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              <span>Reports</span>
            </NavLink>

            <NavLink
              to="/admin/audit-logs"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <ShieldAlert size={18} />
              <span>Audit Logs</span>
            </NavLink>

            <NavLink
              to="/admin/settings"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </>
        )}

        {role === 'FACULTY' && (
          <>
            <div className="nav-section-title">Teaching Portal</div>
            <NavLink
              to="/faculty/dashboard"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/faculty/subjects"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>My Subjects</span>
            </NavLink>

            <NavLink
              to="/faculty/classes"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Layers size={18} />
              <span>My Classes</span>
            </NavLink>

            <NavLink
              to="/faculty/students"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <GraduationCap size={18} />
              <span>Students</span>
            </NavLink>

            <div className="nav-section-title">Attendance Operations</div>
            <NavLink
              to="/faculty/attendance/start"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <QrCode size={18} />
              <span>Start Attendance</span>
            </NavLink>

            <NavLink
              to="/faculty/attendance"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CalendarCheck size={18} />
              <span>Attendance History</span>
            </NavLink>

            <NavLink
              to="/faculty/reports"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              <span>Reports</span>
            </NavLink>

            <div className="nav-section-title">Account</div>
            <NavLink
              to="/faculty/profile"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <School size={18} />
              <span>Profile</span>
            </NavLink>
          </>
        )}

        {role === 'STUDENT' && (
          <>
            <div className="nav-section-title">Student Portal</div>
            <NavLink
              to="/student/dashboard"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Overview & Status</span>
            </NavLink>
            <NavLink
              to="/student/scan"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <QrCode size={18} />
              <span>Scan Attendance QR</span>
            </NavLink>
            <NavLink
              to="/student/attendance"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UserCheck size={18} />
              <span>Attendance Records</span>
            </NavLink>
            <NavLink
              to="/student/subjects"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Award size={18} />
              <span>Enrolled Courses</span>
            </NavLink>
            <NavLink
              to="/student/reports"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileSpreadsheet size={18} />
              <span>Attendance Report</span>
            </NavLink>
            <NavLink
              to="/student/profile"
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <GraduationCap size={18} />
              <span>Academic Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="card" style={{ padding: '0.65rem 0.75rem', backgroundColor: 'var(--bg-surface-subtle)', boxShadow: 'none' }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              SYSTEM ARCHITECTURE
            </span>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              Phase 4 Active
            </span>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: '0.2rem', lineHeight: 1.3 }}>
            Admin Module Online
          </p>
        </div>
      </div>
    </aside>
  );
};
