import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { attendanceService, academicService, AdminAttendanceOverviewKPI } from '../../services';
import { AttendanceSession, AttendanceRecord, Department, Course, Section, Subject } from '../../types';
import {
  QrCode,
  CheckCircle2,
  Clock,
  TrendingUp,
  Eye,
  Info,
  X,
} from 'lucide-react';

type SessionStatusTab = 'ALL' | 'ACTIVE' | 'FINALIZED' | 'CANCELLED' | 'RECORDS';

export const AdminAttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SessionStatusTab>('ALL');
  const [overview, setOverview] = useState<AdminAttendanceOverviewKPI | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Selected Session Records View Modal
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ov, sessList, depts, crss, secs, subs] = await Promise.all([
        attendanceService.getAdminOverview(),
        attendanceService.getAllSessions(),
        academicService.getDepartments(),
        academicService.getCourses(),
        academicService.getSections(),
        academicService.getSubjects(),
      ]);
      setOverview(ov);
      setSessions(sessList);
      setDepartments(depts);
      setCourses(crss);
      setSections(secs);
      setSubjects(subs);
    } catch (e) {
      console.error('Failed to load admin attendance data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRecordsModal = async (session: AttendanceSession) => {
    setSelectedSession(session);
    setLoadingRecords(true);
    try {
      const records = await attendanceService.getRecordsBySession(session.id);
      setSessionRecords(records);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && s.status !== 'ACTIVE') return false;
      if (activeTab === 'FINALIZED' && s.status !== 'FINALIZED') return false;
      if (activeTab === 'CANCELLED' && s.status !== 'CANCELLED') return false;

      // Subject filter
      if (filterSubjectId && s.class_session?.subject_id !== filterSubjectId) return false;

      // Section filter
      if (filterSectionId && s.class_session?.section_id !== filterSectionId) return false;

      // Course filter
      if (filterCourseId && s.class_session?.subject?.course_id !== filterCourseId) return false;

      // Department filter
      if (filterDeptId) {
        const course = courses.find((c) => c.id === s.class_session?.subject?.course_id);
        if (course && course.department_id !== filterDeptId) return false;
      }

      // Date Range Filter
      if (filterDateRange !== 'ALL' && s.start_time) {
        const sessDate = new Date(s.start_time).getTime();
        const now = Date.now();
        if (filterDateRange === 'TODAY') {
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - sessDate > oneDay) return false;
        } else if (filterDateRange === 'WEEK') {
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (now - sessDate > sevenDays) return false;
        } else if (filterDateRange === 'MONTH') {
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (now - sessDate > thirtyDays) return false;
        }
      }

      return true;
    });
  }, [sessions, activeTab, filterSubjectId, filterSectionId, filterCourseId, filterDeptId, filterDateRange, courses]);

  const columns: Column<AttendanceSession>[] = [
    {
      header: 'Subject & Code',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            {s.class_session?.subject?.name || 'Class Session'}
          </span>
          <Badge variant="primary" style={{ width: 'fit-content', marginTop: '0.15rem' }}>
            {s.class_session?.subject?.code || 'N/A'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Faculty Instructor',
      render: (s) => (
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
          {s.faculty?.user?.full_name || 'Assigned Faculty'}
        </span>
      ),
    },
    {
      header: 'Section Cohort',
      render: (s) => (
        <Badge variant="info">{s.class_session?.section?.name || 'Section'}</Badge>
      ),
    },
    {
      header: 'Session Start Time',
      render: (s) => (
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {new Date(s.start_time).toLocaleDateString()}
          </div>
          <div>{new Date(s.start_time).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (s) => (
        <Badge
          variant={
            s.status === 'ACTIVE'
              ? 'warning'
              : s.status === 'FINALIZED'
              ? 'success'
              : s.status === 'CANCELLED'
              ? 'danger'
              : 'neutral'
          }
        >
          {s.status}
        </Badge>
      ),
    },
    {
      header: 'Turnout (Present / Enrolled)',
      render: (s) => {
        const pct = s.total_enrolled > 0 ? Math.round((s.total_present / s.total_enrolled) * 100) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: pct >= 75 ? '#16a34a' : '#ea580c' }}>
              {s.total_present} / {s.total_enrolled} ({pct}%)
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      render: (s) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenRecordsModal(s)}
          icon={<Eye size={12} />}
        >
          View Attendance
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Institutional Attendance Sessions"
        subtitle="Oversight of live classroom attendance sessions, student turnout equations, and finalized lecture records"
      />

      {/* Phase 6 Info Alert */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8125rem', color: '#1e40af' }}>
          <strong>Architecture Note:</strong> Live Dynamic QR Session launching and scanning execution are reserved for Phase 6. Real system attendance records and database sessions are monitored below.
        </span>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">TOTAL SESSIONS</span>
              <QrCode size={18} className="text-primary" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem' }}>
              {overview?.totalSessions ?? sessions.length}
            </h3>
            <span className="text-xs text-muted">All-time classroom lectures</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">ACTIVE SCANNING</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem', color: '#d97706' }}>
              {overview?.activeSessions ?? sessions.filter((s) => s.status === 'ACTIVE').length}
            </h3>
            <span className="text-xs text-muted">Currently awaiting student scans</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">FINALIZED SESSIONS</span>
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem', color: '#16a34a' }}>
              {overview?.finalizedSessions ?? sessions.filter((s) => s.status === 'FINALIZED').length}
            </h3>
            <span className="text-xs text-muted">Attendance finalized & locked</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">OVERALL TURNOUT RATE</span>
              <TrendingUp size={18} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem', color: '#2563eb' }}>
              {overview?.overallRate ?? 0}%
            </h3>
            <span className="text-xs text-muted">Present vs. enrolled ratio</span>
          </CardBody>
        </Card>
      </div>

      {/* Multi-Filters Section */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                Department
              </label>
              <select
                value={filterDeptId}
                onChange={(e) => setFilterDeptId(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                Course / Program
              </label>
              <select
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                <option value="">All Programs</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                Section Cohort
              </label>
              <select
                value={filterSectionId}
                onChange={(e) => setFilterSectionId(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                Subject
              </label>
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                <option value="">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                Date Filter
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as any)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today Only</option>
                <option value="WEEK">Past 7 Days</option>
                <option value="MONTH">Past 30 Days</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'ALL' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'ALL' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          All Sessions ({sessions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'ACTIVE' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'ACTIVE' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Active Sessions ({sessions.filter((s) => s.status === 'ACTIVE').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FINALIZED')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'FINALIZED' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'FINALIZED' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Completed / Finalized ({sessions.filter((s) => s.status === 'FINALIZED').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CANCELLED')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'CANCELLED' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'CANCELLED' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Cancelled Sessions ({sessions.filter((s) => s.status === 'CANCELLED').length})
        </button>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader title={`Attendance Sessions (${filteredSessions.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance sessions from live database...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <QrCode size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Attendance Sessions Found
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                No sessions match the selected filters in the database.
              </p>
            </div>
          ) : (
            <Table data={filteredSessions} columns={columns} keyExtractor={(s) => s.id} />
          )}
        </CardBody>
      </Card>

      {/* View Session Records Drawer / Modal */}
      {selectedSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Attendance Log: {selectedSession.class_session?.subject?.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Section {selectedSession.class_session?.section?.name} • Session Status: {selectedSession.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {loadingRecords ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading individual student scan records...
                </div>
              ) : sessionRecords.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No attendance records logged for this session yet.
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#475569' }}>Student</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#475569' }}>Roll No</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#475569' }}>Status</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#475569' }}>Method</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRecords.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>
                            {r.student?.user?.full_name || 'Enrolled Student'}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <Badge variant="primary">{r.student?.roll_number || 'N/A'}</Badge>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <Badge variant={r.status === 'PRESENT' ? 'success' : 'danger'}>
                              {r.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#64748b' }}>
                            {r.method || 'QR_SCAN'}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', fontSize: '0.75rem' }}>
                            {new Date(r.marked_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
