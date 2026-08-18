import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { academicService } from '../../services';
import { StudentSubject } from '../../types';
import { BookOpen } from 'lucide-react';

export const StudentSubjectsPage: React.FC = () => {
  const { studentProfile } = useAuth();
  const [enrolledSubjects, setEnrolledSubjects] = useState<StudentSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      const data = await academicService.getStudentSubjects(studentProfile?.id || 'std_1');
      setEnrolledSubjects(data);
      setIsLoading(false);
    };
    loadSubjects();
  }, [studentProfile]);

  return (
    <div>
      <PageHeader
        title="Enrolled Subjects & Curriculum"
        subtitle="Registered courses for Semester 6 (Academic Year 2025-2026)"
        breadcrumbs={[{ label: 'Student' }, { label: 'Enrolled Subjects' }]}
      />

      {isLoading ? (
        <p className="text-muted text-sm">Loading course enrollments...</p>
      ) : (
        <div className="grid grid-cols-1 grid-cols-2 gap-6">
          {enrolledSubjects.map((es) => (
            <Card key={es.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen size={20} color="var(--primary-500)" />
                  <div>
                    <h3 style={{ fontSize: '1.05rem' }}>{es.subject?.name}</h3>
                    <span className="text-xs text-muted">{es.subject?.code}</span>
                  </div>
                </div>
                <Badge variant={es.subject?.type === 'LAB' ? 'warning' : 'primary'}>
                  {es.subject?.type}
                </Badge>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                    }}
                  >
                    <span className="text-xs text-muted">Credits</span>
                    <h4 style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>
                      {es.subject?.credit_hours || 3} Credit Hours
                    </h4>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-subtle)',
                    }}
                  >
                    <span className="text-xs text-muted">Enrollment Status</span>
                    <h4 style={{ fontSize: '0.95rem', marginTop: '0.25rem', color: 'var(--success-solid)' }}>
                      {es.status}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Semester 6 • Core Subject</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
