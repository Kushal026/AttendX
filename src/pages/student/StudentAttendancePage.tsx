import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  studentService,
  StudentAttendanceHistoryLog,
  StudentAttendanceSummary,
} from '../../services';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Filter,
  Calendar,
  Layers,
} from 'lucide-react';

export const StudentAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [history, setHistory] = useState<StudentAttendanceHistoryLog[]>([]);
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [logs, stats] = await Promise.all([
        studentService.getStudentAttendanceHistory(userId, {
          subject_id: selectedSubject || undefined,
          status: selectedStatus || undefined,
        }),
        studentService.getStudentAttendanceSummary(userId),
      ]);
      setHistory(logs);
      setSummary(stats);
    } catch (err) {
      console.error('Failed to load student attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, selectedSubject, selectedStatus]);

  const uniqueSubjects = summary?.subjectBreakdown || [];

  const columns: Column<StudentAttendanceHistoryLog>[] = [
    {
      header: 'Subject & Section',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.subject_name}</div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
            <Badge variant="primary">{r.subject_code}</Badge>
            <Badge variant="info">{r.section_name}</Badge>
          </div>
        </div>
      ),
    },
    {
      header: 'Faculty Proctor',
      accessor: (r) => (
        <span style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600 }}>
          {r.faculty_name}
        </span>
      ),
    },
    {
      header: 'Date & Time',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#334155' }}>
            {new Date(r.marked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'PRESENT' ? 'success' : 'danger'}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: 'Method',
      render: (r) => (
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
          {r.method === 'QR_SCAN' ? '📱 Dynamic QR' : r.method === 'AUTO_ABSENT' ? '⚡ Auto-Absent' : r.method}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Attendance Records & History"
        subtitle="Comprehensive verification history of your lecture attendance sessions and percentage metrics"
        breadcrumbs={[{ label: 'Student' }, { label: 'Attendance Records' }]}
      />

      {/* Top Statistical Summary KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Overall Percentage */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Overall Attendance
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: summary?.summary.has_records ? '#0f172a' : '#64748b', lineHeight: 1.1 }}>
              {summary?.summary.has_records ? `${summary.summary.overall_percentage}%` : 'No attendance data available'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              {summary?.summary.has_records && summary.summary.overall_percentage !== null && summary.summary.overall_percentage >= 75
                ? 'Meets 75% eligibility criteria'
                : summary?.summary.has_records
                ? 'Attendance shortage alert'
                : 'Zero sessions logged'}
            </span>
          </CardBody>
        </Card>

        {/* Card 2: Total Sessions */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Sessions
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {summary?.summary.total_sessions ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              Completed lecture sessions
            </span>
          </CardBody>
        </Card>

        {/* Card 3: Present Sessions */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                Present Sessions
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
              {summary?.summary.total_present ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.35rem', display: 'block' }}>
              Verified presence logs
            </span>
          </CardBody>
        </Card>

        {/* Card 4: Absent Sessions */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                Absent Sessions
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
              {summary?.summary.total_absent ?? 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.35rem', display: 'block' }}>
              Missed classes
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Subject-Wise Attendance Breakdown Cards */}
      {summary && summary.subjectBreakdown.length > 0 && (
        <Card style={{ marginBottom: '1.75rem' }}>
          <CardHeader title="Subject-Wise Attendance Breakdown" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {summary.subjectBreakdown.map((sub) => {
                const isEligible = sub.percentage >= 75;
                return (
                  <div
                    key={sub.subject_id}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                            {sub.subject_name}
                          </span>
                          <Badge variant="primary">{sub.subject_code}</Badge>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                          Present: {sub.attended_classes} of {sub.total_classes} sessions (Missed: {sub.absent_classes})
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isEligible ? '#16a34a' : '#dc2626' }}>
                          {sub.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '0.5rem' }}>
                      <div
                        style={{
                          width: `${Math.min(100, sub.percentage)}%`,
                          height: '100%',
                          backgroundColor: isEligible ? '#16a34a' : '#dc2626',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filter Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#475569', fontSize: '0.8125rem', fontWeight: 700 }}>
            <Filter size={14} color="#ea580c" />
            <span>Filter Attendance History:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Subjects ({uniqueSubjects.length})</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub.subject_id} value={sub.subject_id}>
                  {sub.subject_code} — {sub.subject_name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader title={`Attendance Logs (${history.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance history from database...
            </p>
          ) : history.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <Calendar size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                No Attendance Records Found
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto' }}>
                Your attendance history will appear here once attendance sessions are completed in your classroom.
              </p>
            </div>
          ) : (
            <Table data={history} columns={columns} keyExtractor={(r) => r.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
