import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, GraduationCap, School, CheckCircle2 } from 'lucide-react';

export const RoleSwitcherBanner: React.FC = () => {
  const { role, user } = useAuth();

  const getRoleIcon = () => {
    if (role === 'ADMIN') return <Shield size={12} />;
    if (role === 'FACULTY') return <School size={12} />;
    return <GraduationCap size={12} />;
  };

  return (
    <div className="role-banner">
      <div className="flex items-center gap-2">
        <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
          PHASE 3 ACTIVE
        </span>
        <span className="text-muted text-xs hidden sm:inline">
          Signed in as: <strong>{user?.full_name}</strong> ({user?.email})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Authorized Role:</span>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-600)',
            fontWeight: 700,
            fontSize: '0.75rem',
            border: '1px solid var(--primary-100)',
          }}
        >
          {getRoleIcon()}
          <span>{role}</span>
          <CheckCircle2 size={12} color="#10b981" />
        </div>
      </div>
    </div>
  );
};
