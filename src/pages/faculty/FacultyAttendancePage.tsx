import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { facultyService, FacultyClassDetail } from '../../services';
import {
  CalendarCheck,
  QrCode,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';

interface FacultySessionHistoryItem {
  id: string;
  session_token: string;
  start_time: string;
  end_time: string | null;
  expires_at: string;
  finalized_at: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FINALIZED';
  total_enrolled: number;
  total_present: number;
  total_absent: number;
  subject_id?: string;
  subject_name: string;
  subject_code: string;
  section_name: string;
  section_id: string;
}

export const FacultyAttendancePage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const navigate = useNavigate();

  const facultyId = facultyProfile?.id || user?.id || '';

  const [sessions, setSessions] = useState<FacultySessionHistoryItem[]>([]);
  const [classes, setClasses] = useState<FacultyClassDetail[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!facultyId) return;
    setIsLoading(true);
    try {
      const [historySessions, assignedClasses] = await Promise.all([
        facultyService.getFacultyAttendanceHistory(facultyId, {
          subject_id: selectedSubject || undefined,
          section_id: selectedSection || undefined,
          status: selectedStatus || undefined,
          date_range: selectedDateRange || undefined,
        }),
        facultyService.getMyClasses(facultyId),
      ]);

      setSessions(historySessions);
      setClasses(assignedClasses);
    } catch (err) {
      console.error('Failed to load attendance history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [facultyId, selectedSubject, selectedSection, selectedStatus, selectedDateRange]);

  // Extract unique subjects from assigned classes
  const uniqueSubjects = Array.from(
    new Set(classes.map((c) => JSON.stringify({ id: c.subject_id, name: c.subject_name, code: c.subject_code })))
  ).map((s) => JSON.parse(s));

  const columns: Column<FacultySessionHistoryItem>[] = [
    {
      header: 'Subject & Section',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.subject_name}</div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
            <Badge variant="primary">{s.subject_code}</Badge>
            <Badge variant="info">{s.section_name}</Badge>
          </div>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600, color: '#334155' }}>
            {new Date(s.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: 'Attendance Turnout',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#16a34a', fontWeight: 700 }}>
            <CheckCircle2 size={13} /> {s.total_present}
          </span>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#dc2626', fontWeight: 700 }}>
            <XCircle size={13} /> {s.total_absent}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            ({s.total_enrolled} Total)
          </span>
        </div>
      ),
    },
    {
      header: 'Session Status',
      render: (s) => {
        if (s.status === 'ACTIVE') return <Badge variant="success">ACTIVE</Badge>;
        if (s.status === 'EXPIRED') return <Badge variant="warning">EXPIRED</Badge>;
        if (s.status === 'FINALIZED') return <Badge variant="info">FINALIZED</Badge>;
        return <Badge variant="danger">CANCELLED</Badge>;
      },
    },
    {
      header: 'Actions',
      render: (s) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/faculty/attendance/session/${s.id}`)}
          icon={<Eye size={13} />}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Session History"
        subtitle="Completed lecture attendance sessions, verified student presence, and finalized turnouts"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/faculty/attendance/start')}
            icon={<QrCode size={16} />}
          >
            Start Attendance
          </Button>
        }
      />

      {/* Multi-Filter Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#475569', fontSize: '0.8125rem', fontWeight: 700 }}>
            <Filter size={14} color="#ea580c" />
            <span>Filter Attendance Sessions:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            {/* Subject Filter */}
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
                <option key={sub.id} value={sub.id}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Sections ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.section_id} value={c.section_id}>
                  {c.section_name} ({c.subject_code})
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            {/* Status Filter */}
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
              <option value="FINALIZED">FINALIZED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader title={`Attendance Sessions (${sessions.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading attendance sessions from database...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <CalendarCheck size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                No Attendance Sessions Found
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem', maxWidth: '400px', margin: '0.35rem auto 1.25rem' }}>
                {selectedSubject || selectedSection || selectedStatus || selectedDateRange
                  ? 'No sessions match your filter criteria. Try changing your filters.'
                  : 'Start a dynamic QR attendance session for your assigned subjects to generate attendance logs.'}
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/faculty/attendance/start')}
                icon={<QrCode size={16} />}
              >
                Start Attendance Session
              </Button>
            </div>
          ) : (
            <Table data={sessions} columns={columns} keyExtractor={(s) => s.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
