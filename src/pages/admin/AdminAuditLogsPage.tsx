import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { auditService } from '../../services';
import { AttendanceAuditLog } from '../../types';
import {
  Terminal,
  Search,
  RotateCcw,
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getAuditLogs();
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter && l.action !== actionFilter) return false;

      if (roleFilter && (l as any).user?.role !== roleFilter) return false;

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const userName = (l.performed_by_name || l.performed_by || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        const target = (l.attendance_id || '').toLowerCase();
        if (!userName.includes(query) && !reason.includes(query) && !target.includes(query)) {
          return false;
        }
      }

      if (dateFilter !== 'ALL' && l.created_at) {
        const diffMs = Date.now() - new Date(l.created_at).getTime();
        if (dateFilter === 'TODAY' && diffMs > 86400000) return false;
        if (dateFilter === 'WEEK' && diffMs > 7 * 86400000) return false;
        if (dateFilter === 'MONTH' && diffMs > 30 * 86400000) return false;
      }

      return true;
    });
  }, [logs, actionFilter, roleFilter, search, dateFilter]);

  const columns: Column<AttendanceAuditLog>[] = [
    {
      header: 'Timestamp',
      render: (l) => (
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {new Date(l.created_at).toLocaleDateString()}
          </div>
          <div style={{ color: '#64748b' }}>
            {new Date(l.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      header: 'User & Role',
      render: (l) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            {l.performed_by_name || l.performed_by}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
            <Badge variant="primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
              {(l as any).user?.role || 'ADMIN'}
            </Badge>
            {(l as any).user?.email && (
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{(l as any).user.email}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Action',
      render: (l) => (
        <Badge
          variant={
            l.action === 'CREATE'
              ? 'success'
              : l.action === 'OVERRIDE'
              ? 'warning'
              : l.action === 'DELETE'
              ? 'danger'
              : 'primary'
          }
        >
          {l.action}
        </Badge>
      ),
    },
    {
      header: 'Target / Record ID',
      render: (l) => (
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>
          {l.attendance_id ? (l.attendance_id.length > 18 ? `${l.attendance_id.substring(0, 18)}...` : l.attendance_id) : 'system_event'}
        </span>
      ),
    },
    {
      header: 'Description / Reason',
      render: (l) => (
        <span style={{ fontSize: '0.8125rem', color: '#334155' }}>
          {l.reason || 'Verified administrative action recorded.'}
        </span>
      ),
    },
    {
      header: 'Status Change',
      render: (l) => (
        <span>
          {l.previous_status && (
            <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '0.35rem', fontSize: '0.75rem' }}>
              {l.previous_status}
            </span>
          )}
          <Badge
            variant={
              l.new_status === 'PRESENT'
                ? 'success'
                : l.new_status === 'ABSENT'
                ? 'danger'
                : 'warning'
            }
          >
            {l.new_status}
          </Badge>
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Institutional Audit Logs & Compliance Trail"
        subtitle="Immutable audit logs recording all administrative overrides, security actions, and attendance modifications"
        actions={
          <Button variant="outline" size="sm" onClick={loadLogs} icon={<RotateCcw size={14} />}>
            Refresh Logs
          </Button>
        }
      />

      {/* Filters Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search user, action, target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                }}
              />
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="OVERRIDE">OVERRIDE</option>
                <option value="CANCEL">CANCEL</option>
                <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="FACULTY">FACULTY</option>
                <option value="STUDENT">STUDENT</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today Only</option>
                <option value="WEEK">Past 7 Days</option>
                <option value="MONTH">Past 30 Days</option>
              </select>
            </div>

            {(search || actionFilter || roleFilter || dateFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setActionFilter('');
                  setRoleFilter('');
                  setDateFilter('ALL');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader title={`Audit Trail Records (${filteredLogs.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
              Loading audit logs from database...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Terminal size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Audit Log Records Found
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                No matching system events found in the database.
              </p>
            </div>
          ) : (
            <Table data={filteredLogs} columns={columns} keyExtractor={(l) => l.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
