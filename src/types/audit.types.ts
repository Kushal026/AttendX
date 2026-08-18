import { AttendanceStatus } from './attendance.types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE' | 'AUTO_MARK';

export interface AttendanceAuditLog {
  id: string;
  attendance_id: string;
  performed_by: string; // user_id
  performed_by_name?: string;
  action: AuditAction;
  previous_status?: AttendanceStatus;
  new_status: AttendanceStatus;
  reason?: string;
  ip_address?: string;
  created_at: string;
}
