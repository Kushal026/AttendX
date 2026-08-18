import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { facultyService, FacultyDashboardStats, FacultyClassDetail } from '../../services';
import {
  QrCode,
  BookOpen,
  Layers,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  School,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<FacultyDashboardStats | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<FacultyClassDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const facultyId = facultyProfile?.id || user?.id || '';

  useEffect(() => {
    const loadDashboard = async () => {
      if (!facultyId) return;
      setIsLoading(true);
      try {
        const [statsData, classesData] = await Promise.all([
          facultyService.getDashboardStats(facultyId),
          facultyService.getMyClasses(facultyId),
        ]);
        setStats(statsData);
        setAssignedClasses(classesData);
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [facultyId]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'Professor'}`}
        subtitle={`${facultyProfile?.designation || 'Faculty Member'} • ${facultyProfile?.department_name || 'Academic Faculty'}`}
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

      {/* Hero Banner: Start Attendance Priority Flow */}
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
        <div style={{ maxWidth: '580px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Sparkles size={16} color="#fed7aa" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffedd5' }}>
              Attendance Engine Workflow
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Ready to conduct class attendance?
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#ffedd5', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Select your assigned subject and section to prepare an attendance session with custom duration parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/faculty/attendance/start')}
          style={{
            backgroundColor: '#ffffff',
            color: '#c2410c',
            fontWeight: 800,
            fontSize: '0.875rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease',
          }}
        >
          <QrCode size={18} />
          Start Attendance Session
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Assigned Subjects */}
        <Card onClick={() => navigate('/faculty/subjects')} style={{ cursor: 'pointer' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Assigned Subjects
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {isLoading ? '...' : stats?.assignedSubjectsCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              Curriculum teaching allocations
            </span>
          </CardBody>
        </Card>

        {/* Card 2: Assigned Classes */}
        <Card onClick={() => navigate('/faculty/classes')} style={{ cursor: 'pointer' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Assigned Classes
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {isLoading ? '...' : stats?.assignedClassesCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              Section classroom cohorts
            </span>
          </CardBody>
        </Card>

        {/* Card 3: Today's Classes */}
        <Card>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Today's Schedule
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {isLoading ? '...' : stats?.todayClassesCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              Lectures scheduled today
            </span>
          </CardBody>
        </Card>

        {/* Card 4: Total Students in Assigned Classes */}
        <Card onClick={() => navigate('/faculty/students')} style={{ cursor: 'pointer' }}>
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Enrolled Students
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {isLoading ? '...' : stats?.totalStudentsCount || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
              In your authorized sections
            </span>
          </CardBody>
        </Card>
      </div>

      {/* Assigned Classes List */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>My Teaching Allocations & Classes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/faculty/classes')}
              icon={<ArrowRight size={14} />}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '1.25rem' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading assigned classes from database...
            </div>
          ) : assignedClasses.length === 0 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <School size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>No Teaching Assignments Found</h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                You have not been assigned to any subjects or sections yet. Contact your administrator.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {assignedClasses.map((cls) => (
                <div
                  key={cls.assignment_id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <Badge variant="primary">{cls.subject_code}</Badge>
                      <Badge variant="info">{cls.section_name}</Badge>
                    </div>

                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                      {cls.subject_name}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                      <span>{cls.course_name} • Semester {cls.semester_number}</span>
                      <span>Room: {cls.room_number || 'Main Lecture Hall'}</span>
                      <span style={{ fontWeight: 600, color: '#ea580c' }}>
                        {cls.student_count} Students Enrolled
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/faculty/attendance/start')}
                    icon={<QrCode size={14} color="#ea580c" />}
                  >
                    Prepare Attendance
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
