import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  LogOut,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Shield,
  GraduationCap,
  School,
  Menu,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleIcon = () => {
    if (role === 'ADMIN') return <Shield size={13} />;
    if (role === 'FACULTY') return <School size={13} />;
    return <GraduationCap size={13} />;
  };

  return (
    <header className="app-navbar">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }} className="hidden sm:block">
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="form-input"
            style={{
              paddingLeft: '2.5rem',
              paddingTop: '0.4rem',
              paddingBottom: '0.4rem',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
            }}
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              width: '36px',
              height: '36px',
              padding: 0,
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-500)',
                }}
              />
            )}
          </Button>

          {showNotifications && (
            <div
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                right: 0,
                top: '45px',
                width: '320px',
                zIndex: 'var(--z-dropdown)',
                backgroundColor: '#ffffff',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="card-header" style={{ padding: '0.75rem 1rem' }}>
                <div className="flex items-center gap-2">
                  <h4 style={{ fontSize: '0.9rem' }}>Notifications</h4>
                  {unreadCount > 0 && <Badge variant="primary">{unreadCount} New</Badge>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-600)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p className="text-muted text-xs" style={{ padding: '1rem', textAlign: 'center' }}>
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: n.is_read ? '#ffffff' : 'var(--primary-50)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.625rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {n.type === 'ATTENDANCE' && <CheckCircle2 size={16} color="var(--success-solid)" />}
                        {n.type === 'WARNING' && <AlertTriangle size={16} color="var(--warning-solid)" />}
                        {n.type === 'INFO' && <Info size={16} color="var(--info-solid)" />}
                        {n.type === 'SYSTEM' && <Clock size={16} color="var(--primary-500)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: n.is_read ? 500 : 700, color: 'var(--text-primary)' }}>
                          {n.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)' }} />

        {/* User Pill Profile */}
        <div className="flex items-center gap-2">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--primary-500)',
              }}
            />
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-500)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {user?.full_name.charAt(0) || 'U'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.full_name || 'User'}
            </span>
            <Badge variant="primary" icon={getRoleIcon()} style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem', marginTop: '2px' }}>
              {role}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{ marginLeft: '0.25rem', padding: '0.35rem', color: 'var(--text-muted)' }}
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
};
