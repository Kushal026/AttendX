import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import {
  facultyService,
  FacultyClassDetail,
  FacultyAuthorizedStudent,
  AttendanceReportResponse,
} from '../../services';
import {
  FileText,
  Download,
  Printer,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export const FacultyReportsPage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const facultyId = facultyProfile?.id || user?.id || '';

  // Filter States
  const [classes, setClasses] = useState<FacultyClassDetail[]>([]);
  const [students, setStudents] = useState<FacultyAuthorizedStudent[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(75);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Report Data & UI States
  const [report, setReport] = useState<AttendanceReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load Classes and Initial Report
  useEffect(() => {
    const initPage = async () => {
      if (!facultyId) return;
      try {
        const classList = await facultyService.getMyClasses(facultyId);
        setClasses(classList);
        if (classList.length > 0) {
          // Set default subject / section
          setSelectedSubject(classList[0].subject_id);
          setSelectedSection(classList[0].section_id);
        }
      } catch (e) {
        console.error('Failed to load classes for report:', e);
      }
    };
    initPage();
  }, [facultyId]);

  // Load students for selected section
  useEffect(() => {
    const loadStudents = async () => {
      if (!facultyId) return;
      try {
        const studentList = await facultyService.getAuthorizedStudents(facultyId, {
          section_id: selectedSection || undefined,
        });
        setStudents(studentList);
      } catch (e) {
        console.error('Failed to load students:', e);
      }
    };
    loadStudents();
  }, [facultyId, selectedSection]);

  const handleGenerateReport = async () => {
    if (!facultyId) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await facultyService.generateAttendanceReport(facultyId, {
        subject_id: selectedSubject || undefined,
        section_id: selectedSection || undefined,
        student_id: selectedStudent || undefined,
        date_range: selectedDateRange || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        threshold: Number(threshold) || 75,
        status: statusFilter || undefined,
      });
      setReport(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedSubject('');
    setSelectedSection('');
    setSelectedStudent('');
    setSelectedDateRange('');
    setDateFrom('');
    setDateTo('');
    setThreshold(75);
    setStatusFilter('');
    setReport(null);
    setErrorMessage('');
  };

  const handleExportCSV = () => {
    if (!facultyId || !report) return;
    const url = facultyService.getExportCSVUrl(facultyId, {
      subject_id: selectedSubject || undefined,
      section_id: selectedSection || undefined,
      student_id: selectedStudent || undefined,
      date_range: selectedDateRange || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      threshold: Number(threshold) || 75,
      status: statusFilter || undefined,
    });
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Unique subjects for filter dropdown
  const uniqueSubjects = Array.from(
    new Set(classes.map((c) => JSON.stringify({ id: c.subject_id, name: c.subject_name, code: c.subject_code })))
  ).map((s) => JSON.parse(s));

  // Student Roster Table Columns
  const studentColumns: Column<AttendanceReportResponse['students'][0]>[] = [
    {
      header: 'Student Name & USN',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.student_name}</div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
              Roll: {s.roll_number}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Total Sessions',
      accessor: (s) => <span style={{ fontWeight: 600 }}>{s.total_sessions}</span>,
    },
    {
      header: 'Present',
      render: (s) => (
        <span style={{ color: '#16a34a', fontWeight: 700 }}>
          {s.present_count}
        </span>
      ),
    },
    {
      header: 'Absent',
      render: (s) => (
        <span style={{ color: '#dc2626', fontWeight: 700 }}>
          {s.absent_count}
        </span>
      ),
    },
    {
      header: 'Attendance %',
      render: (s) => {
        const isEligible = !s.is_low_attendance;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, color: isEligible ? '#16a34a' : '#dc2626' }}>
              {s.percentage}%
            </span>
            <Badge variant={isEligible ? 'success' : 'danger'}>
              {isEligible ? 'ELIGIBLE' : 'SHORTAGE'}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Print CSS Rules */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, button, .action-bar {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-header {
            display: block !important;
            border-bottom: 2px solid #000000;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
          }
        }
        @media screen {
          .print-header {
            display: none;
          }
        }
      `}</style>

      {/* Screen Header */}
      <div className="no-print">
        <PageHeader
          title="Official Attendance Reports"
          subtitle="Generate, audit, export, and print comprehensive attendance reports for finalized classroom lectures"
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                icon={<RotateCcw size={15} />}
              >
                Reset Filters
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!report || !report.summary.has_data}
                icon={<Printer size={15} />}
              >
                Print Report
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                disabled={!report || !report.summary.has_data}
                icon={<Download size={15} />}
              >
                Export CSV
              </Button>
            </div>
          }
        />
      </div>

      {/* Printable Institutional Header */}
      <div className="print-header">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
            Smart Attendance Management System
          </h2>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0.2rem 0' }}>
            Official Lecture Attendance Report
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.8125rem', gap: '0.25rem', marginTop: '0.5rem' }}>
          <div><strong>Subject:</strong> {report?.metadata.subject_name} ({report?.metadata.subject_code})</div>
          <div><strong>Section:</strong> {report?.metadata.section_name}</div>
          <div><strong>Faculty Proctor:</strong> {report?.metadata.faculty_name}</div>
          <div><strong>Date Range:</strong> {report?.metadata.date_range}</div>
          <div><strong>Generated On:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
          <div><strong>Shortage Threshold:</strong> {report?.metadata.threshold}%</div>
        </div>
      </div>

      {/* Filter Control Card */}
      <div className="no-print">
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader title="Report Generation Filters" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Assigned Subjects ({uniqueSubjects.length})</option>
                  {uniqueSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Sections ({classes.length})</option>
                  {classes.map((c) => (
                    <option key={c.section_id} value={c.section_id}>
                      {c.section_name} ({c.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Student (Optional)
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Enrolled Students ({students.length})</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.roll_number} — {st.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Date Period
                </label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Completed Sessions</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>
              </div>

              {/* Custom Date Bounds */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Custom Start Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Custom End Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Shortage Threshold */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Shortage Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8125rem' }}
                >
                  <option value="">All Attendance</option>
                  <option value="LOW_ATTENDANCE">Shortage Only (&lt; {threshold}%)</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '0.8125rem' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <Button
                variant="primary"
                onClick={handleGenerateReport}
                disabled={isLoading}
                icon={<FileText size={16} />}
              >
                {isLoading ? 'Generating Report...' : 'Generate Attendance Report'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* REPORT CONTENT AREA */}
      {report && (
        <div className="print-container">
          {/* Summary KPIs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Overall Attendance
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.overall_percentage}%
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  {report.summary.total_present} of {report.summary.total_present + report.summary.total_absent} total marks
                </span>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Students
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.total_students}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Enrolled cohort count
                </span>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Finalized Sessions
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.total_sessions}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Completed lecture sessions
                </span>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: report.summary.low_attendance_count > 0 ? '#dc2626' : '#16a34a', textTransform: 'uppercase' }}>
                  Shortage Alerts (&lt; {report.summary.threshold}%)
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: report.summary.low_attendance_count > 0 ? '#dc2626' : '#16a34a', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.low_attendance_count} Students
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Below eligibility threshold
                </span>
              </CardBody>
            </Card>
          </div>

          {/* Low Attendance Warning Box */}
          {report.low_attendance_students.length > 0 && (
            <Card style={{ marginBottom: '1.5rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                  <AlertTriangle size={18} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                    Students Below Attendance Threshold ({report.summary.threshold}%)
                  </h3>
                </div>
              </CardHeader>
              <CardBody style={{ padding: '0.75rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {report.low_attendance_students.map((st) => (
                    <div
                      key={st.student_id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        padding: '0.75rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>{st.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Roll: {st.roll_number}</div>
                      <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#dc2626' }}>
                          {st.percentage}%
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                          {st.present_count} / {st.total_sessions} sessions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Detailed Student Roster Table */}
          <Card style={{ marginBottom: '1.5rem' }}>
            <CardHeader title={`Student Attendance Roster (${report.students.length})`} />
            <CardBody style={{ padding: 0 }}>
              {report.students.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  No student records match the selected filters.
                </div>
              ) : (
                <Table data={report.students} columns={studentColumns} keyExtractor={(s) => s.student_id} />
              )}
            </CardBody>
          </Card>

          {/* Session-Wise Breakdown Table */}
          {report.sessions.length > 0 && (
            <Card>
              <CardHeader title={`Completed Lecture Sessions (${report.sessions.length})`} />
              <CardBody style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Date & Time</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Subject & Section</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Present</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Absent</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Turnout %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sessions.map((sess, idx) => (
                      <tr key={sess.id} style={{ borderBottom: idx < report.sessions.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                          {new Date(sess.date).toLocaleDateString()} {new Date(sess.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                          {sess.subject_name} ({sess.section_name})
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>
                          {sess.total_present}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                          {sess.total_absent}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {sess.turnout_percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Initial Empty State Before Generation */}
      {!report && !isLoading && (
        <Card>
          <CardBody style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
              No Attendance Report Generated
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto 1.25rem' }}>
              Select your teaching subject, section, and date parameters above and click <strong>Generate Attendance Report</strong> to view student turnouts.
            </p>
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              icon={<FileText size={16} />}
            >
              Generate Report
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
