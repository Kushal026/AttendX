import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { facultyService, FacultyAuthorizedStudent, FacultyClassDetail } from '../../services';
import {
  Users,
  Search,
} from 'lucide-react';

export const FacultyStudentsPage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFilterParam = searchParams.get('section_id') || '';

  const [students, setStudents] = useState<FacultyAuthorizedStudent[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<FacultyClassDetail[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState(sectionFilterParam);
  const [isLoading, setIsLoading] = useState(true);

  const facultyId = facultyProfile?.id || user?.id || '';

  useEffect(() => {
    const loadClasses = async () => {
      if (!facultyId) return;
      try {
        const classesData = await facultyService.getMyClasses(facultyId);
        setAssignedClasses(classesData);
      } catch (err) {
        console.error('Failed to load assigned classes:', err);
      }
    };
    loadClasses();
  }, [facultyId]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!facultyId) return;
      setIsLoading(true);
      try {
        const data = await facultyService.getAuthorizedStudents(facultyId, {
          section_id: selectedSectionId || undefined,
          search: search || undefined,
        });
        setStudents(data);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [facultyId, selectedSectionId, search]);

  const handleSectionChange = (secId: string) => {
    setSelectedSectionId(secId);
    if (secId) {
      setSearchParams({ section_id: secId });
    } else {
      setSearchParams({});
    }
  };

  const columns: Column<FacultyAuthorizedStudent>[] = [
    {
      header: 'Student Name & Email',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.full_name}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email}</span>
        </div>
      ),
    },
    {
      header: 'Roll Number',
      render: (s) => <Badge variant="primary">{s.roll_number}</Badge>,
    },
    {
      header: 'Course & Department',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.course_name}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.department_name}</span>
        </div>
      ),
    },
    {
      header: 'Semester & Section',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Sem {s.semester_number}</span>
          <Badge variant="info">{s.section_name}</Badge>
        </div>
      ),
    },
    {
      header: 'Enrollment Status',
      render: (s) => (
        <Badge variant={s.is_active ? 'success' : 'danger'}>
          {s.is_active ? 'Active Enrolled' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Authorized Student Directory"
        subtitle="Students enrolled in your assigned classroom sections and lecture cohorts"
      />

      {/* Filter & Search Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
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
                placeholder="Search by student name, roll number, email..."
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

            <select
              value={selectedSectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Authorized Sections ({assignedClasses.length})</option>
              {assignedClasses.map((c) => (
                <option key={c.section_id} value={c.section_id}>
                  {c.section_name} — {c.subject_code} ({c.course_name} Sem {c.semester_number})
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader title={`Enrolled Students (${students.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading authorized students from database...
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Users size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Students Found
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                No students enrolled in your assigned sections match the criteria.
              </p>
            </div>
          ) : (
            <Table data={students} columns={columns} keyExtractor={(s) => s.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
