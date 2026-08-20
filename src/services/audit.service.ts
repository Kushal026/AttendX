import { AttendanceAuditLog } from '../types';
import { API_BASE } from './api.config';

class AuditService {
  async getAuditLogs(): Promise<AttendanceAuditLog[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        return (data.logs || []).map((l: any) => ({
          ...l,
          performed_by_name: l.user?.full_name || l.performed_by,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
    return [];
  }

  async createAuditLog(log: Omit<AttendanceAuditLog, 'id' | 'created_at'>): Promise<AttendanceAuditLog | undefined> {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (res.ok) {
        const data = await res.json();
        return data.log;
      }
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
    return undefined;
  }
}

export const auditService = new AuditService();
