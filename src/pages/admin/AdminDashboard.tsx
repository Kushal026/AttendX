import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  GraduationCap,
  School,
  Building2,
  BookOpen,
  Calendar,
  Layers,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  Link2,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

interface AdminStats {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalCourses: number;
  totalSemesters: number;
  totalSections: number;
  totalSubjects: number;
  totalUsers: number;
  totalActiveSessions?: number;
  totalFinalizedSessions?: number;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalCourses: 0,
    totalSemesters: 0,
    totalSections: 0,
    totalSubjects: 0,
    totalUsers: 0,
    totalActiveSessions: 0,
    totalFinalizedSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/v1/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <GraduationCap size={22} />,
      color: '#f97316',
      bgColor: '#fff7ed',
      route: '/admin/students',
      desc: 'Active student enrollments',
    },
    {
      title: 'Total Faculty',
      value: stats.totalFaculty,
      icon: <School size={22} />,
      color: '#2563eb',
      bgColor: '#eff6ff',
      route: '/admin/faculty',
      desc: 'Teaching professors & lecturers',
    },
    {
      title: 'Departments',
      value: stats.totalDepartments,
      icon: <Building2 size={22} />,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      route: '/admin/academics?tab=departments',
      desc: 'Academic faculties & wings',
    },
    {
      title: 'Courses / Degrees',
      value: stats.totalCourses,
      icon: <BookOpen size={22} />,
      color: '#059669',
      bgColor: '#ecfdf5',
      route: '/admin/academics?tab=courses',
      desc: 'Programs of study',
    },
    {
      title: 'Active Semesters',
      value: stats.totalSemesters,
      icon: <Calendar size={22} />,
      color: '#d97706',
      bgColor: '#fffbeb',
      route: '/admin/academics?tab=semesters',
      desc: 'Academic timeline cohorts',
    },
    {
      title: 'Class Sections',
      value: stats.totalSections,
      icon: <Layers size={22} />,
      color: '#0891b2',
      bgColor: '#ecfeff',
      route: '/admin/academics?tab=sections',
      desc: 'Classrooms & section cohorts',
    },
    {
      title: 'Curriculum Subjects',
      value: stats.totalSubjects,
      icon: <FileSpreadsheet size={22} />,
      color: '#e11d48',
      bgColor: '#fff1f2',
      route: '/admin/academics?tab=subjects',
      desc: 'Theory, labs & electives',
    },
    {
      title: 'Total System Users',
      value: stats.totalUsers,
      icon: <Users size={22} />,
      color: '#475569',
      bgColor: '#f8fafc',
      route: '/admin/students',
      desc: 'Admin, Faculty & Students',
    },
    {
      title: 'Active Sessions',
      value: stats.totalActiveSessions || 0,
      icon: <QrCode size={22} />,
      color: '#16a34a',
      bgColor: '#f0fdf4',
      route: '/admin/reports',
      desc: 'Live QR attendance rooms',
    },
    {
      title: 'Finalized Sessions',
      value: stats.totalFinalizedSessions || 0,
      icon: <CheckCircle2 size={22} />,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      route: '/admin/reports',
      desc: 'Completed & audited classes',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Institutional Administration Overview"
        subtitle="Manage academic hierarchy, students, faculty, subjects, and departmental operations with real-time PostgreSQL synchronization."
      />

      {/* 8 Metric KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={() => navigate(card.route)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            className="card-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.title}
              </span>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: card.bgColor,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </div>
            </div>

            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {isLoading ? '...' : card.value}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Action Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <Card>
          <CardHeader title="Academic Management Shortcuts" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/students')}
                icon={<UserPlus size={16} color="#f97316" />}
              >
                Student Directory
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/faculty')}
                icon={<School size={16} color="#2563eb" />}
              >
                Faculty Directory
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/academics')}
                icon={<PlusCircle size={16} color="#7c3aed" />}
              >
                Academic Structure
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin/assignments')}
                icon={<Link2 size={16} color="#059669" />}
              >
                Subject Allocations
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="System Status" />
          <CardBody style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>PostgreSQL / Supabase</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} /> LIVE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Row-Level Security</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>ENFORCED</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Active Phase</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>PHASE 4 ADMIN</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
