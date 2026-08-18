import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { auditService } from '../../services';
import { AttendanceAuditLog } from '../../types';
import { ShieldAlert, Terminal } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await auditService.getAuditLogs();
        setLogs(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  const columns: Column<AttendanceAuditLog>[] = [
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
      header: 'Performed By',
      accessor: (l) => (
        <div>
          <span className="font-semibold">{l.performed_by_name || l.performed_by}</span>
          {l.ip_address && (
            <p className="text-xs text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              IP: {l.ip_address}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status Change',
      render: (l) => (
        <span>
          {l.previous_status && (
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
              {l.previous_status}
            </span>
          )}
          <Badge variant={l.new_status === 'PRESENT' ? 'success' : l.new_status === 'ABSENT' ? 'danger' : 'warning'}>
            {l.new_status}
          </Badge>
        </span>
      ),
    },
    {
      header: 'Reason / Signature Verification',
      accessor: (l) => <span className="text-xs text-secondary">{l.reason || 'Verified system action'}</span>,
    },
    {
      header: 'Timestamp',
      accessor: (l) => (
        <span className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          {new Date(l.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Attendance Audit Trail & Security Logs"
        subtitle="Cryptographic tamper-evident audit logs of all attendance creations, scan events, and manual administrative overrides"
        badge={<Badge variant="info" icon={<ShieldAlert size={14} />}>Immutable Records</Badge>}
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Logs' }]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal size={18} color="var(--primary-500)" />
            <h3>System Audit History</h3>
          </div>
          <Badge variant="neutral">{logs.length} Total Audit Records</Badge>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <p className="text-muted text-sm" style={{ padding: '2rem', textAlign: 'center' }}>
              Loading audit logs...
            </p>
          ) : (
            <Table data={logs} columns={columns} keyExtractor={(l) => l.id} />
          )}
        </CardBody>
      </Card>
    </div>
  );
};
