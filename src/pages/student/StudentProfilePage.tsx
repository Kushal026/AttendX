import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Mail, Phone, Calendar, Shield } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, studentProfile } = useAuth();

  return (
    <div>
      <PageHeader
        title="Student Academic Profile"
        subtitle="Identity credentials, institutional registration, and parent contact details"
        breadcrumbs={[{ label: 'Student' }, { label: 'Academic Profile' }]}
      />

      <div className="grid grid-cols-1 grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card variant="glass">
          <CardBody style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}
              alt={user?.full_name}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid var(--primary-500)',
                margin: '0 auto 1rem auto',
              }}
            />
            <h3>{user?.full_name || 'Aiden Walker'}</h3>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
              {studentProfile?.course_name || 'B.Tech in Computer Science'}
            </p>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Badge variant="success">Enrolled Student</Badge>
              <Badge variant="primary">{studentProfile?.section_name || 'Section 6-A'}</Badge>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'left',
                fontSize: '0.8125rem',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <Mail size={16} color="var(--text-muted)" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <Phone size={16} color="var(--text-muted)" />
                <span>{user?.phone || '+1 (555) 567-8901'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} color="var(--text-muted)" />
                <span>Batch: {studentProfile?.batch_year || '2022-2026'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Academic Details */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card>
            <CardHeader>
              <h3>Institutional Registration Details</h3>
              <Badge variant="neutral">Verified Record</Badge>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span className="text-xs text-muted">Roll Number</span>
                  <h4 style={{ fontSize: '1rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                    {studentProfile?.roll_number || '22CS042'}
                  </h4>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span className="text-xs text-muted">University Register Number</span>
                  <h4 style={{ fontSize: '1rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                    {studentProfile?.register_number || 'REG2022CS0042'}
                  </h4>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span className="text-xs text-muted">Current Academic Standing</span>
                  <h4 style={{ fontSize: '1rem', marginTop: '0.25rem', color: 'var(--success-solid)' }}>
                    GPA: {studentProfile?.current_gpa || 3.88} / 4.0
                  </h4>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span className="text-xs text-muted">Department</span>
                  <h4 style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {studentProfile?.department_name || 'Computer Science & Engineering'}
                  </h4>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span className="text-xs text-muted">Emergency / Parent Contact</span>
                  <h4 style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                    {studentProfile?.parent_name || 'David Walker'}
                  </h4>
                  <span className="text-xs text-secondary">{studentProfile?.parent_contact || '+1 (555) 998-1122'}</span>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <span className="text-xs text-muted">Security Status</span>
                  <div className="flex items-center gap-1.5" style={{ marginTop: '0.25rem' }}>
                    <Shield size={16} color="var(--success-solid)" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--success-solid)' }}>
                      Account Active & Verified
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
