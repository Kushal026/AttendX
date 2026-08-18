import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { facultyService, FacultySubjectWithSections } from '../../services';
import {
  BookOpen,
  Search,
  QrCode,
} from 'lucide-react';

export const FacultySubjectsPage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<FacultySubjectWithSections[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const facultyId = facultyProfile?.id || user?.id || '';

  useEffect(() => {
    const loadSubjects = async () => {
      if (!facultyId) return;
      setIsLoading(true);
      try {
        const data = await facultyService.getMySubjects(facultyId);
        setSubjects(data);
      } catch (err) {
        console.error('Failed to load faculty subjects:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubjects();
  }, [facultyId]);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.department_name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<FacultySubjectWithSections>[] = [
    {
      header: 'Subject Code',
      render: (s) => <Badge variant="primary">{s.code}</Badge>,
    },
    {
      header: 'Subject Title & Type',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {s.course_name} • {s.type || 'Theory'}
          </span>
        </div>
      ),
    },
    {
      header: 'Department & Semester',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.department_name}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Semester {s.semester_number}</span>
        </div>
      ),
    },
    {
      header: 'Credits',
      accessor: (s) => `${s.credit_hours} Credits`,
    },
    {
      header: 'Assigned Sections',
      render: (s) => (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {s.sections.map((sec) => (
            <Badge key={sec.id} variant="info">
              {sec.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (_s) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/faculty/attendance/start')}
          icon={<QrCode size={14} color="#ea580c" />}
        >
          Start Attendance
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Assigned Subjects"
        subtitle="Curriculum subjects and teaching allocations assigned to your academic profile"
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
              placeholder="Search by subject code, title, department..."
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

      {/* Subjects Table */}
      <Card>
        <CardHeader title={`Authorized Subjects (${filteredSubjects.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading assigned subjects from database...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <BookOpen size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Subjects Assigned
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                You have not been assigned to teach any subjects yet. Contact your department administrator.
              </p>
            </div>
          ) : (
            <Table data={filteredSubjects} columns={columns} keyExtractor={(s) => s.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
