import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { FileSpreadsheet, TrendingUp, AlertTriangle } from 'lucide-react';
import { attendanceService } from '../../services';
import { AttendanceSummary } from '../../types';

export const AdminReportsPage: React.FC = () => {
  const [reportsData, setReportsData] = useState<AttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const summaries = await attendanceService.getStudentAttendanceSummaries();
        setReportsData(summaries);
      } catch (err) {
        console.error('Error loading reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, []);

  const columns: Column<AttendanceSummary>[] = [
    {
      header: 'Subject Code',
      render: (r) => <Badge variant="primary">{r.subject_code}</Badge>,
    },
    {
      header: 'Subject Name',
      accessor: 'subject_name',
    },
    {
      header: 'Total Classes',
      accessor: (r) => `${r.total_classes} Sessions`,
    },
    {
      header: 'Attended Classes',
      accessor: (r) => (
        <span style={{ color: 'var(--success-solid)', fontWeight: 600 }}>
          {r.attended_classes}
        </span>
      ),
    },
    {
      header: 'Absent Classes',
      accessor: (r) => (
        <span style={{ color: r.absent_classes > 0 ? 'var(--danger-solid)' : 'var(--text-muted)' }}>
          {r.absent_classes}
        </span>
      ),
    },
    {
      header: 'Overall Attendance %',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontWeight: 700,
              color: r.percentage >= 75 ? 'var(--success-solid)' : 'var(--danger-solid)',
            }}
          >
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
          <Badge variant="danger">Exam Barred (&lt; 75%)</Badge>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Institutional Attendance Reports"
        subtitle="Live subject-wise student attendance records, shortage detection, and exam eligibility analytics"
      />

      {/* Aggregate Statistics */}
      <div className="grid grid-cols-1 grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">TOTAL SUBJECTS</span>
              <FileSpreadsheet size={18} className="text-primary" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>{reportsData.length}</h3>
            <span className="text-xs text-muted">Active courses in database</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">AVG INSTITUTIONAL ATTENDANCE</span>
              <TrendingUp size={18} color="var(--success-solid)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.4rem', color: 'var(--success-solid)' }}>
              {reportsData.length > 0
                ? Math.round(reportsData.reduce((acc, c) => acc + c.percentage, 0) / reportsData.length)
                : 0}
              %
            </h3>
            <span className="text-xs text-muted">Across all departments</span>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <span className="text-secondary text-xs font-medium">SHORTAGE SUBJECTS (&lt;75%)</span>
              <AlertTriangle size={18} color="var(--danger-solid)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.4rem', color: 'var(--danger-solid)' }}>
              {reportsData.filter((r) => r.is_shortage).length}
            </h3>
            <span className="text-xs text-muted">Requires administrative review</span>
          </CardBody>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader title="Subject Attendance Breakdown" />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance records from live database...
            </div>
          ) : reportsData.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No attendance session records found in the database yet.
            </div>
          ) : (
            <Table data={reportsData} columns={columns} keyExtractor={(r) => r.subject_id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
