import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  QrCode,
  Shield,
  School,
  GraduationCap,
  ArrowRight,
  Database,
  Layers,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const LandingPage: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handlePortalEnter = (portalRole: 'ADMIN' | 'FACULTY' | 'STUDENT') => {
    if (isAuthenticated && role === portalRole) {
      if (portalRole === 'ADMIN') navigate('/admin/dashboard');
      else if (portalRole === 'FACULTY') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top Header */}
      <header
        style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <QrCode size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>Smart Attendance</h3>
            <span className="text-xs text-muted">QR Attendance Management Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="primary">Phase 1 Foundation</Badge>
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
            Sign In Portal
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1160px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3rem auto' }}>
          <Badge variant="primary" icon={<Sparkles size={14} />} style={{ marginBottom: '0.875rem' }}>
            Phase 1: Architecture, 16 Relational Models & Role Routing
          </Badge>
          <h1 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Enterprise QR-Based <span className="orange-gradient-text">Smart Attendance System</span>
          </h1>
          <p className="text-secondary text-base" style={{ lineHeight: 1.6 }}>
            Engineered with strict role separation for <strong>Admin</strong>, <strong>Faculty</strong>, and <strong>Student</strong> portals, backed by 16 relational data entities and scalable services.
          </p>
        </div>

        {/* 3 Role Portals Grid */}
        <div className="grid grid-cols-1 grid-cols-3 gap-6" style={{ marginBottom: '3.5rem' }}>
          {/* Admin Role Card */}
          <Card className="card-hover">
            <CardBody style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Admin Portal</h3>
              <p className="text-secondary text-sm" style={{ marginTop: '0.4rem', flex: 1, lineHeight: 1.5 }}>
                Institutional oversight, user & role provisioning, academic hierarchy (departments, courses, sections), system settings, and security audit logs.
              </p>
              <div style={{ marginTop: '1.25rem' }}>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handlePortalEnter('ADMIN')}
                  icon={<ArrowRight size={16} />}
                >
                  Enter Admin Dashboard
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Faculty Role Card */}
          <Card className="card-hover">
            <CardBody style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <School size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Faculty Portal</h3>
              <p className="text-secondary text-sm" style={{ marginTop: '0.4rem', flex: 1, lineHeight: 1.5 }}>
                Live class schedules, assigned subjects & section tracking, real-time attendance monitor, student attendance records, and exportable reports.
              </p>
              <div style={{ marginTop: '1.25rem' }}>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePortalEnter('FACULTY')}
                  icon={<ArrowRight size={16} />}
                >
                  Enter Faculty Dashboard
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Student Role Card */}
          <Card className="card-hover">
            <CardBody style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <GraduationCap size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Student Portal</h3>
              <p className="text-secondary text-sm" style={{ marginTop: '0.4rem', flex: 1, lineHeight: 1.5 }}>
                Real-time subject-wise percentage, attendance shortage alerts (&lt;75%), class timeline, verified scan history, and profile records.
              </p>
              <div style={{ marginTop: '1.25rem' }}>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePortalEnter('STUDENT')}
                  icon={<ArrowRight size={16} />}
                >
                  Enter Student Dashboard
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Phase 1 Deliverables Summary Card */}
        <div className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Phase 1 Architecture Foundation</h3>
            <p className="text-xs text-secondary">
              Core entities and system modules scaffolded and verified.
            </p>
          </div>

          <div className="grid grid-cols-1 grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Database size={18} color="var(--primary-500)" style={{ marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem' }}>16 Database Entities</h4>
                <p className="text-xs text-muted">
                  Strictly typed in TypeScript, PostgreSQL/MySQL DDL (`schema.sql`), and Prisma (`schema.prisma`).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Layers size={18} color="var(--accent-cyan)" style={{ marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem' }}>Role-Based Routing</h4>
                <p className="text-xs text-muted">
                  Protected route trees for `/admin/*`, `/faculty/*`, and `/student/*` with guards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock size={18} color="var(--primary-600)" style={{ marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9rem' }}>Phase 1 Guardrails</h4>
                <p className="text-xs text-muted">
                  QR generation, scanning, and auto-absent background jobs safely stubbed for Phase 2/3.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
