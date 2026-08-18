import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  studentService,
  StudentDashboardStats,
  StudentAttendanceSummary,
} from '../../services';
import {
  QrCode,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  School,
  TrendingUp,
  Clock,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<StudentDashboardStats | null>(null);
  const [summaryData, setSummaryData] = useState<StudentAttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id || '';

  useEffect(() => {
    const loadDashboard = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const [stats, summary] = await Promise.all([
          studentService.getStudentDashboardStats(userId),
          studentService.getStudentAttendanceSummary(userId),
        ]);
        setDashboardData(stats);
        setSummaryData(summary);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, [userId]);

  const student = dashboardData?.student || studentProfile;
  const recentAttendance = dashboardData?.recentAttendance || [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'Student'}`}
        subtitle={`Roll: ${student?.roll_number || 'N/A'} • ${student?.course_name || 'Degree'} (${student?.section_name || 'Section'})`}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              onClick={() => navigate('/student/attendance')}
              icon={<Clock size={16} />}
            >
              Attendance History
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/student/scan')}
              icon={<QrCode size={16} />}
            >
              Scan Attendance QR
            </Button>
          </div>
        }
      />

      {/* Hero Banner: SCAN ATTENDANCE QR PRIORITY FLOW */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
          borderRadius: '16px',
          padding: '1.75rem',
          color: '#ffffff',
          marginBottom: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ maxWidth: '560px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Sparkles size={16} color="#fed7aa" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffedd5' }}>
              Real-Time QR Attendance
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            In Class Right Now?
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#ffedd5', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Open your camera and scan the active dynamic QR code projected on the screen to mark your attendance as PRESENT.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/student/scan')}
          style={{
            backgroundColor: '#ffffff',
            color: '#c2410c',
            fontWeight: 800,
            fontSize: '0.9375rem',
            padding: '0.85rem 1.75rem',
            borderRadius: '12px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease',
          }}
        >
          <QrCode size={20} />
          SCAN ATTENDANCE QR
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 4 Metric Cards */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Overall Attendance
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: summaryData?.summary.has_records ? '#0f172a' : '#64748b', lineHeight: 1.1 }}>
              {summaryData?.summary.has_records ? `${summaryData.summary.overall_percentage}%` : 'No attendance data available'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              {summaryData?.summary.has_records
                ? `${summaryData.summary.total_present} of ${summaryData.summary.total_sessions} sessions`
                : 'Zero sessions logged'}
            </span>
          </CardBody>
        </Card>

        {/* Card 2: Enrolled Cohort */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Enrolled Section
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {student?.section_name || 'Section A'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              {student?.course_name} • Semester {student?.semester_number}
            </span>
          </CardBody>
        </Card>

        {/* Card 3: Roll Number */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                University Roll No
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <School size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {student?.roll_number || 'N/A'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              Reg: {student?.register_number || 'N/A'}
            </span>
          </CardBody>
        </Card>

        {/* Card 4: Present Sessions */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                Present Sessions
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
              {summaryData?.summary.total_present ?? recentAttendance.length} Recorded
            </div>
            <span style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.35rem', display: 'block' }}>
              Verified presence logs
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      {summaryData && summaryData.subjectBreakdown.length > 0 && (
        <Card style={{ marginBottom: '1.75rem' }}>
          <CardHeader title="Subject-Wise Attendance Breakdown" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {summaryData.subjectBreakdown.map((sub) => {
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
                          Present: {sub.attended_classes} of {sub.total_classes} sessions
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isEligible ? '#16a34a' : '#dc2626' }}>
                          {sub.percentage}%
                        </span>
                      </div>
                    </div>

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

      {/* Recent QR Attendance Logs */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>My Recent Attendance Logs</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/attendance')}
              icon={<Calendar size={14} />}
            >
              View Full History
            </Button>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '1.25rem' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance logs from database...
            </div>
          ) : recentAttendance.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Attendance Logs Yet
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '420px', margin: '0.25rem auto 1.25rem' }}>
                Scan an active lecture QR code in your classroom to record your attendance.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/student/scan')}
                icon={<QrCode size={16} />}
              >
                Open Camera Scanner
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentAttendance.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '1rem 1.25rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                        {a.subject_name}
                      </span>
                      <Badge variant="primary">{a.subject_code}</Badge>
                      <Badge variant="info">{a.section_name}</Badge>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Marked at: {new Date(a.marked_at).toLocaleString()} • Method: {a.method}
                    </span>
                  </div>

                  <div>
                    <Badge variant={a.status === 'PRESENT' ? 'success' : 'danger'}>{a.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
