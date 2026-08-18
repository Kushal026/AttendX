import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

export const UnauthorizedPage: React.FC = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { attemptedRole?: string; requiredRoles?: string[]; from?: string } | undefined;

  const handleReturnHome = () => {
    if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
    else if (role === 'FACULTY') navigate('/faculty/dashboard', { replace: true });
    else if (role === 'STUDENT') navigate('/student/dashboard', { replace: true });
    else navigate('/login', { replace: true });
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: '#f8fafc',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <Card>
          <CardBody style={{ padding: '2.5rem 1.75rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <ShieldAlert size={36} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Access Denied (403)
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your account role <strong>({role || 'UNAUTHENTICATED'})</strong> does not have permission to access the requested resource.
              {state?.requiredRoles && (
                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Required role: <strong>{state.requiredRoles.join(', ')}</strong>
                </span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
                Go Back
              </Button>

              <Button variant="primary" size="sm" onClick={handleReturnHome} icon={<Home size={16} />}>
                My Dashboard
              </Button>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '0.5rem' }}>
                Need to log in with a different account?
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ea580c',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
