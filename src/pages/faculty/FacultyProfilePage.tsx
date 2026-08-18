import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { facultyService, FacultyFullProfile } from '../../services';
import {
  ShieldCheck,
} from 'lucide-react';

export const FacultyProfilePage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const [profile, setProfile] = useState<FacultyFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const facultyId = facultyProfile?.id || user?.id || '';

  useEffect(() => {
    const loadProfile = async () => {
      if (!facultyId) return;
      setIsLoading(true);
      try {
        const data = await facultyService.getFacultyProfile(facultyId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load faculty profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [facultyId]);

  return (
    <div>
      <PageHeader
        title="Faculty Academic Profile"
        subtitle="View official institution credentials, departmental affiliation, and employee details"
      />

      <div style={{ maxWidth: '800px' }}>
        <Card>
          <CardHeader title="Official Faculty Credentials" />
          <CardBody style={{ padding: '1.75rem' }}>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Loading profile from database...
              </div>
            ) : (
              <div>
                {/* Header Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.5rem',
                      border: '2px solid #bfdbfe',
                    }}
                  >
                    {profile?.full_name?.charAt(0) || 'P'}
                  </div>

                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {profile?.full_name || user?.full_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <Badge variant="primary">{profile?.designation || 'Faculty Member'}</Badge>
                      <Badge variant="info">{profile?.department_name || 'Academic Faculty'}</Badge>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      EMPLOYEE ID
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.employee_id || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      EMAIL ADDRESS
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.email || user?.email}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      PHONE NUMBER
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.phone || 'Not Registered'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      QUALIFICATION
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.qualification || 'Master of Engineering'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      OFFICE / CABIN
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.office_room || 'Room 304'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      ACCOUNT STATUS
                    </span>
                    <div style={{ marginTop: '0.25rem' }}>
                      <Badge variant={profile?.is_active ? 'success' : 'danger'}>
                        {profile?.is_active ? 'Active & Verified' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldCheck size={16} color="#16a34a" />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Profile managed by institution administrator. Contact registrar for modifications.
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
