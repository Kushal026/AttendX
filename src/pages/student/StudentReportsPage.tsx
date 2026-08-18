import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { studentService } from '../../services';
import {
  Printer,
} from 'lucide-react';

export const StudentReportsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const data = await studentService.getStudentReport(userId);
        setReport(data);
      } catch (err) {
        console.error('Failed to load student report:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [userId]);

  const historyColumns: Column<any>[] = [
    {
      header: 'Subject',
      render: (h) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.subject_name}</div>
          <Badge variant="primary">{h.subject_code}</Badge>
        </div>
      ),
    },
    {
      header: 'Faculty Proctor',
      accessor: (h) => <span style={{ color: '#334155', fontWeight: 600 }}>{h.faculty_name}</span>,
    },
    {
      header: 'Date & Time',
      render: (h) => (
        <div>
          <div style={{ fontWeight: 600, color: '#334155' }}>
            {new Date(h.date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (h) => (
        <Badge variant={h.status === 'PRESENT' ? 'success' : 'danger'}>
          {h.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      {/* Print CSS Rules */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, button {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .print-header {
            display: block !important;
            border-bottom: 2px solid #000000;
            padding-bottom: 12px;
            margin-bottom: 16px;
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
          title="My Attendance Report"
          subtitle="Official student academic attendance record and course eligibility breakdown"
          actions={
            <Button
              variant="outline"
              onClick={() => window.print()}
              disabled={!report}
              icon={<Printer size={15} />}
            >
              Print My Report
            </Button>
          }
        />
      </div>

      {/* Printable Header */}
      <div className="print-header">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
            Smart Attendance Management System
          </h2>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0.2rem 0' }}>
            Official Student Attendance Summary Sheet
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '0.8125rem', gap: '0.25rem', marginTop: '0.5rem' }}>
          <div><strong>Student:</strong> {report?.student.full_name}</div>
          <div><strong>Roll No:</strong> {report?.student.roll_number}</div>
          <div><strong>Course / Section:</strong> {report?.student.course} ({report?.student.section})</div>
          <div><strong>Report Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading your attendance report...
        </p>
      ) : !report ? (
        <Card>
          <CardBody style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No attendance report available.
          </CardBody>
        </Card>
      ) : (
        <div>
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
                  Overall Percentage
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: report.summary.overall_percentage !== null ? '#0f172a' : '#64748b', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.overall_percentage !== null ? `${report.summary.overall_percentage}%` : 'No attendance data available'}
                </div>
                <span style={{ fontSize: '0.75rem', color: report.summary.is_eligible ? '#16a34a' : '#dc2626', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                  {report.summary.overall_percentage !== null && report.summary.is_eligible
                    ? 'Eligible (≥ 75%)'
                    : report.summary.overall_percentage !== null
                    ? 'Attendance Shortage (< 75%)'
                    : 'Zero sessions logged'}
                </span>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Sessions
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.total_sessions}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                  Finalized classroom sessions
                </span>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  Attended Sessions
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.total_present}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem', display: 'block' }}>
                  Verified presence logs
                </span>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                  Missed Classes
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.1, marginTop: '0.35rem' }}>
                  {report.summary.total_absent}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem', display: 'block' }}>
                  Recorded absences
                </span>
              </CardBody>
            </Card>
          </div>

          {/* Subject-Wise Report Cards */}
          {report.subjects.length > 0 && (
            <Card style={{ marginBottom: '1.5rem' }}>
              <CardHeader title="Subject-Wise Academic Performance" />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {report.subjects.map((sub: any) => {
                    const isEligible = sub.percentage >= 75.0;
                    return (
                      <div
                        key={sub.subject_id}
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                              {sub.subject_name}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Present: {sub.present} of {sub.total} sessions
                            </span>
                          </div>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isEligible ? '#16a34a' : '#dc2626' }}>
                            {sub.percentage}%
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '0.65rem' }}>
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

          {/* Attendance History Log */}
          <Card>
            <CardHeader title={`Verified Attendance Logs (${report.history.length})`} />
            <CardBody style={{ padding: 0 }}>
              <Table data={report.history} columns={historyColumns} keyExtractor={(h) => h.id} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
