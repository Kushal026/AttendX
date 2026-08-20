import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import {
  attendanceService,
  academicService,
} from '../../services';
import {
  AttendanceSession,
  Department,
  Course,
  Semester,
  Section,
  Subject,
} from '../../types';
import {
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  Users,
} from 'lucide-react';

type ReportTab = 'SUBJECT' | 'DEFAULTERS' | 'SECTION' | 'SESSIONS';

export const AdminReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('SUBJECT');

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [
        sessList,
        depts,
        crss,
        sems,
        secs,
        subs,
      ] = await Promise.all([
        attendanceService.getAllSessions(),
        academicService.getDepartments(),
        academicService.getCourses(),
        academicService.getSemesters(),
        academicService.getSections(),
        academicService.getSubjects(),
      ]);

      setSessions(sessList);
      setDepartments(depts);
      setCourses(crss);
      setSemesters(sems);
      setSections(secs);
      setSubjects(subs);
    } catch (err: any) {
      console.error('Failed to load institutional reports:', err);
      setErrorMsg(err.message || 'Failed to load report datasets from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered Sessions based on active selection
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterSubjectId && s.class_session?.subject_id !== filterSubjectId) return false;
      if (filterSectionId && s.class_session?.section_id !== filterSectionId) return false;

      if (filterCourseId && s.class_session?.subject?.course_id !== filterCourseId) return false;

      if (filterDeptId) {
        const course = courses.find((c) => c.id === s.class_session?.subject?.course_id);
        if (course && course.department_id !== filterDeptId) return false;
      }

      if (filterDateRange !== 'ALL' && s.start_time) {
        const diffMs = Date.now() - new Date(s.start_time).getTime();
        if (filterDateRange === 'TODAY' && diffMs > 86400000) return false;
        if (filterDateRange === 'WEEK' && diffMs > 7 * 86400000) return false;
        if (filterDateRange === 'MONTH' && diffMs > 30 * 86400000) return false;
      }

      return true;
    });
  }, [sessions, filterSubjectId, filterSectionId, filterCourseId, filterDeptId, filterDateRange, courses]);

  // 1. Subject-Wise Aggregation
  const subjectSummaries = useMemo(() => {
    const map = new Map<string, {
      subject_id: string;
      subject_code: string;
      subject_name: string;
      department_name: string;
      course_name: string;
      total_sessions: number;
      total_enrolled: number;
      total_present: number;
      total_absent: number;
      percentage: number;
    }>();

    filteredSessions.forEach((s) => {
      const subj = s.class_session?.subject;
      if (!subj) return;

      const course = courses.find((c) => c.id === subj.course_id);
      const dept = departments.find((d) => d.id === course?.department_id);

      const existing = map.get(subj.id) || {
        subject_id: subj.id,
        subject_code: subj.code,
        subject_name: subj.name,
        department_name: dept?.name || 'Academic Dept',
        course_name: course?.name || 'Program',
        total_sessions: 0,
        total_enrolled: 0,
        total_present: 0,
        total_absent: 0,
        percentage: 0,
      };

      existing.total_sessions += 1;
      existing.total_enrolled += s.total_enrolled;
      existing.total_present += s.total_present;
      existing.total_absent += s.total_absent;

      map.set(subj.id, existing);
    });

    const result = Array.from(map.values()).map((row) => {
      const pct = row.total_enrolled > 0
        ? Math.round((row.total_present / row.total_enrolled) * 100)
        : 0;
      return { ...row, percentage: pct };
    });

    return result;
  }, [filteredSessions, courses, departments]);

  // 2. Section-Wise Aggregation
  const sectionSummaries = useMemo(() => {
    const map = new Map<string, {
      section_id: string;
      section_name: string;
      course_name: string;
      department_name: string;
      total_sessions: number;
      total_present: number;
      total_enrolled: number;
      percentage: number;
    }>();

    filteredSessions.forEach((s) => {
      const sec = s.class_session?.section;
      if (!sec) return;

      const sem = semesters.find((sm) => sm.id === sec.semester_id);
      const course = courses.find((c) => c.id === sem?.course_id);
      const dept = departments.find((d) => d.id === course?.department_id);

      const existing = map.get(sec.id) || {
        section_id: sec.id,
        section_name: sec.name,
        course_name: course?.name || 'Degree Program',
        department_name: dept?.name || 'Engineering Dept',
        total_sessions: 0,
        total_present: 0,
        total_enrolled: 0,
        percentage: 0,
      };

      existing.total_sessions += 1;
      existing.total_present += s.total_present;
      existing.total_enrolled += s.total_enrolled;

      map.set(sec.id, existing);
    });

    return Array.from(map.values()).map((row) => {
      const pct = row.total_enrolled > 0
        ? Math.round((row.total_present / row.total_enrolled) * 100)
        : 0;
      return { ...row, percentage: pct };
    });
  }, [filteredSessions, semesters, courses, departments]);

  // Overall Turnout Metrics
  const totalClassesCount = filteredSessions.length;
  const overallAvgRate = subjectSummaries.length > 0
    ? Math.round(subjectSummaries.reduce((acc, c) => acc + c.percentage, 0) / subjectSummaries.length)
    : 0;
  const shortageSubjectsCount = subjectSummaries.filter((s) => s.percentage < 75).length;

  // CSV Export Functionality
  const handleExportCSV = () => {
    if (activeTab === 'SUBJECT') {
      const csvRows = [
        ['Subject Code', 'Subject Name', 'Department', 'Course / Program', 'Lectures Held', 'Total Enrolled Marks', 'Present Marks', 'Absent Marks', 'Attendance Rate (%)', 'Eligibility Status'],
        ...subjectSummaries.map((s) => [
          `"${s.subject_code}"`,
          `"${s.subject_name.replace(/"/g, '""')}"`,
          `"${s.department_name}"`,
          `"${s.course_name}"`,
          s.total_sessions,
          s.total_enrolled,
          s.total_present,
          s.total_absent,
          `${s.percentage}%`,
          s.percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE (< 75%)',
        ]),
      ];
      downloadCSV(csvRows, `subject_attendance_report_${Date.now()}.csv`);
    } else if (activeTab === 'SECTION') {
      const csvRows = [
        ['Section Cohort', 'Program / Course', 'Department', 'Lectures Held', 'Attendance Rate (%)'],
        ...sectionSummaries.map((sec) => [
          `"${sec.section_name}"`,
          `"${sec.course_name}"`,
          `"${sec.department_name}"`,
          sec.total_sessions,
          `${sec.percentage}%`,
        ]),
      ];
      downloadCSV(csvRows, `section_attendance_report_${Date.now()}.csv`);
    } else {
      const csvRows = [
        ['Session ID', 'Date', 'Subject Code', 'Subject Name', 'Faculty Instructor', 'Section', 'Status', 'Present', 'Enrolled', 'Turnout %'],
        ...filteredSessions.map((s) => [
          `"${s.id}"`,
          `"${new Date(s.start_time).toLocaleString()}"`,
          `"${s.class_session?.subject?.code || ''}"`,
          `"${(s.class_session?.subject?.name || '').replace(/"/g, '""')}"`,
          `"${s.faculty?.user?.full_name || ''}"`,
          `"${s.class_session?.section?.name || ''}"`,
          `"${s.status}"`,
          s.total_present,
          s.total_enrolled,
          `${s.total_enrolled > 0 ? Math.round((s.total_present / s.total_enrolled) * 100) : 0}%`,
        ]),
      ];
      downloadCSV(csvRows, `sessions_attendance_log_${Date.now()}.csv`);
    }
  };

  const downloadCSV = (rows: any[][], filename: string) => {
    const csvContent = rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns for Subject Attendance
  const subjectColumns: Column<any>[] = [
    {
      header: 'Subject Code',
      render: (r) => <Badge variant="primary">{r.subject_code}</Badge>,
    },
    {
      header: 'Subject Name',
      accessor: 'subject_name',
    },
    {
      header: 'Department',
      accessor: 'department_name',
    },
    {
      header: 'Lectures Held',
      accessor: (r) => `${r.total_sessions} Sessions`,
    },
    {
      header: 'Present Marks',
      accessor: (r) => (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>{r.total_present}</span>
      ),
    },
    {
      header: 'Absent Marks',
      accessor: (r) => (
        <span style={{ color: r.total_absent > 0 ? '#dc2626' : '#64748b' }}>{r.total_absent}</span>
      ),
    },
    {
      header: 'Attendance %',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: r.percentage >= 75 ? '#16a34a' : '#dc2626' }}>
            {r.percentage}%
          </span>
          {r.percentage < 75 && (
            <Badge variant="danger" icon={<AlertTriangle size={10} />}>
              Shortage
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Eligibility Status',
      render: (r) =>
        r.percentage >= 75 ? (
          <Badge variant="success">Eligible for Exams</Badge>
        ) : (
          <Badge variant="danger">Barred (&lt; 75%)</Badge>
        ),
    },
  ];

  // Columns for Section Attendance
  const sectionColumns: Column<any>[] = [
    {
      header: 'Section Cohort',
      render: (sec) => <Badge variant="info">{sec.section_name}</Badge>,
    },
    {
      header: 'Program / Course',
      accessor: 'course_name',
    },
    {
      header: 'Department',
      accessor: 'department_name',
    },
    {
      header: 'Lectures Held',
      accessor: (sec) => `${sec.total_sessions} Sessions`,
    },
    {
      header: 'Turnout Rate',
      render: (sec) => (
        <span style={{ fontWeight: 700, color: sec.percentage >= 75 ? '#16a34a' : '#ea580c' }}>
          {sec.percentage}%
        </span>
      ),
    },
  ];

  // Columns for Sessions Log
  const sessionLogColumns: Column<AttendanceSession>[] = [
    {
      header: 'Date & Time',
      render: (s) => (
        <div style={{ fontSize: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {new Date(s.start_time).toLocaleDateString()}
          </div>
          <div style={{ color: '#64748b' }}>{new Date(s.start_time).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      header: 'Subject',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.class_session?.subject?.name || 'Class'}</span>
          <Badge variant="primary" style={{ width: 'fit-content', marginTop: '0.15rem' }}>{s.class_session?.subject?.code}</Badge>
        </div>
      ),
    },
    {
      header: 'Faculty Instructor',
      render: (s) => <span>{s.faculty?.user?.full_name || 'Faculty Member'}</span>,
    },
    {
      header: 'Section',
      render: (s) => <Badge variant="info">{s.class_session?.section?.name || 'Section'}</Badge>,
    },
    {
      header: 'Present / Enrolled',
      render: (s) => {
        const pct = s.total_enrolled > 0 ? Math.round((s.total_present / s.total_enrolled) * 100) : 0;
        return (
          <span style={{ fontWeight: 600, color: pct >= 75 ? '#16a34a' : '#dc2626' }}>
            {s.total_present} / {s.total_enrolled} ({pct}%)
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (s) => (
        <Badge variant={s.status === 'FINALIZED' ? 'success' : s.status === 'ACTIVE' ? 'warning' : 'neutral'}>
          {s.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Institutional Attendance Reports & Analytics"
        subtitle="Comprehensive subject breakdown, student shortage detection (<75%), section analytics, and RFC-4180 export"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              icon={<Printer size={16} />}
            >
              Print Sheet
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleExportCSV}
              icon={<Download size={16} />}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {errorMsg && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">TOTAL LECTURES CONDUCTED</span>
              <FileSpreadsheet size={18} className="text-primary" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem' }}>{totalClassesCount}</h3>
            <span className="text-xs text-muted">Sessions in live database</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">AVG INSTITUTIONAL ATTENDANCE</span>
              <TrendingUp size={18} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem', color: '#16a34a' }}>
              {overallAvgRate}%
            </h3>
            <span className="text-xs text-muted">Across all active subject cohorts</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">SHORTAGE COHORTS (&lt;75%)</span>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem', color: '#dc2626' }}>
              {shortageSubjectsCount}
            </h3>
            <span className="text-xs text-muted">Requires academic review</span>
          </CardBody>
        </Card>
      </div>

      {/* Filter Control Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
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
                Program / Course
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
                Curriculum Subject
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
                Date Range
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as any)}
                style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
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
          onClick={() => setActiveTab('SUBJECT')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'SUBJECT' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'SUBJECT' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Subject Attendance ({subjectSummaries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SECTION')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'SECTION' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'SECTION' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Course / Section Attendance ({sectionSummaries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SESSIONS')}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'SESSIONS' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'SESSIONS' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
          }}
        >
          Daily & Recent Lecture Logs ({filteredSessions.length})
        </button>
      </div>

      {/* Main Table Content */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
              Loading report datasets from live database...
            </div>
          ) : activeTab === 'SUBJECT' ? (
            subjectSummaries.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <FileSpreadsheet size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  No Subject Attendance Data Found
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                  No finalized attendance sessions have been logged for these criteria yet.
                </p>
              </div>
            ) : (
              <Table data={subjectSummaries} columns={subjectColumns} keyExtractor={(s) => s.subject_id} />
            )
          ) : activeTab === 'SECTION' ? (
            sectionSummaries.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <Users size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  No Section Attendance Data Found
                </h4>
              </div>
            ) : (
              <Table data={sectionSummaries} columns={sectionColumns} keyExtractor={(sec) => sec.section_id} />
            )
          ) : (
            filteredSessions.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  No Lecture Sessions Recorded
                </h4>
              </div>
            ) : (
              <Table data={filteredSessions} columns={sessionLogColumns} keyExtractor={(s) => s.id} />
            )
          )}
        </CardBody>
      </Card>
    </div>
  );
};
