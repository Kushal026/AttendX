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
  Layers,
  Users,
  QrCode,
  Search,
} from 'lucide-react';

export const FacultyClassesPage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<FacultyClassDetail[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const facultyId = facultyProfile?.id || user?.id || '';

  useEffect(() => {
    const loadClasses = async () => {
      if (!facultyId) return;
      setIsLoading(true);
      try {
        const data = await facultyService.getMyClasses(facultyId);
        setClasses(data);
      } catch (err) {
        console.error('Failed to load faculty classes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadClasses();
  }, [facultyId]);

  const filteredClasses = classes.filter(
    (c) =>
      c.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      c.section_name.toLowerCase().includes(search.toLowerCase()) ||
      c.course_name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<FacultyClassDetail>[] = [
    {
      header: 'Subject & Code',
      render: (c) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.subject_name}</span>
          <Badge variant="primary" style={{ width: 'fit-content', marginTop: '0.2rem' }}>
            {c.subject_code}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Section Cohort',
      render: (c) => <Badge variant="info">{c.section_name}</Badge>,
    },
    {
      header: 'Course & Term',
      render: (c) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.course_name}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Semester {c.semester_number} ({c.academic_year})
          </span>
        </div>
      ),
    },
    {
      header: 'Room',
      accessor: (c) => c.room_number || 'Main Lecture Hall',
    },
    {
      header: 'Student Enrollment',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Users size={14} color="#ea580c" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.student_count}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ {c.capacity} capacity</span>
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (c) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/faculty/students?section_id=${c.section_id}`)}
            icon={<Users size={12} />}
          >
            View Students
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/faculty/attendance/start')}
            icon={<QrCode size={12} />}
          >
            Start
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Assigned Classes & Sections"
        subtitle="Classroom cohorts, enrolled students, and timetable section allocations assigned to you"
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

      {/* Filter / Search Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search by class, subject, section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                fontSize: '0.8125rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader title={`Authorized Class Cohorts (${filteredClasses.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading assigned classes from database...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Layers size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Classes Assigned
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                You have no active class or section assignments. Contact your administrator.
              </p>
            </div>
          ) : (
            <Table data={filteredClasses} columns={columns} keyExtractor={(c) => c.assignment_id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
