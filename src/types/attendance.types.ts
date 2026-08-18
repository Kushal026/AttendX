import { ClassSession } from './academic.types';
import { StudentProfile } from './user.types';

// Phase 2: status lifecycle  ACTIVE -> EXPIRED -> FINALIZED  |  ACTIVE -> CANCELLED
export type AttendanceSessionStatus = 'ACTIVE' | 'EXPIRED' | 'FINALIZED' | 'CANCELLED';

export interface AttendanceSession {
  id: string;
  class_session_id: string;
  faculty_id: string;
  // Security/QR fields (session_token is sent to clients; qr_secret_key is server-only)
  session_token: string;
  qr_payload_hash: string;
  qr_rotation_seconds: number;
  // Timing
  start_time: string;
  end_time?: string;
  expires_at: string;
  // Phase 2 lifecycle status
  status: AttendanceSessionStatus;
  // Counters
  total_enrolled: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  auto_absent_processed: boolean;
  // Metadata
  cancelled_reason?: string;
  finalized_at?: string;
  created_at: string;
  updated_at: string;
  // Joined relational data
  class_session?: ClassSession;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type AttendanceMethod = 'QR_SCAN' | 'MANUAL_FACULTY' | 'AUTO_ABSENT' | 'RFID_CARD';

export interface AttendanceRecord {
  id: string;
  attendance_session_id: string;
  student_id: string;
  marked_at: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  ip_address?: string;
  device_info?: string;
  geo_latitude?: number;
  geo_longitude?: number;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: StudentProfile;
}

export interface AttendanceSummary {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  percentage: number;
  is_shortage: boolean; // true if < 75%
}
