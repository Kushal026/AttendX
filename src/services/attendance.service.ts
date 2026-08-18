import {
  AttendanceSession,
  AttendanceRecord,
  AttendanceSummary,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

class AttendanceService {
  async getActiveSessions(): Promise<AttendanceSession[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, class_session:class_sessions(*, subject:subjects(*), section:sections(*))')
        .eq('status', 'ACTIVE');
      if (!error && data) return data as AttendanceSession[];
    }
    return [];
  }

  async getAllSessions(): Promise<AttendanceSession[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, class_session:class_sessions(*, subject:subjects(*), section:sections(*))')
        .order('start_time', { ascending: false });
      if (!error && data) return data as AttendanceSession[];
    }
    return [];
  }

  async getSessionById(sessionId: string): Promise<AttendanceSession | undefined> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, class_session:class_sessions(*, subject:subjects(*), section:sections(*))')
        .eq('id', sessionId)
        .single();
      if (!error && data) return data as AttendanceSession;
    }
    return undefined;
  }

  async getRecordsBySession(sessionId: string): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, student:students(*, user:users(*))')
        .eq('attendance_session_id', sessionId);
      if (!error && data) return data as AttendanceRecord[];
    }
    return [];
  }

  async getRecordsByStudent(studentId: string): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, attendance_session:attendance_sessions(*, class_session:class_sessions(*, subject:subjects(*)))')
        .eq('student_id', studentId)
        .order('marked_at', { ascending: false });
      if (!error && data) return data as AttendanceRecord[];
    }
    return [];
  }

  async getStudentAttendanceSummaries(_studentId?: string): Promise<AttendanceSummary[]> {
    if (isSupabaseConfigured) {
      const { data: records } = await supabase
        .from('attendance')
        .select(`
          status,
          attendance_session:attendance_sessions (
            class_session:class_sessions (
              subject:subjects (id, code, name)
            )
          )
        `);

      if (records && records.length > 0) {
        const subjectMap = new Map<string, { code: string; name: string; total: number; attended: number; absent: number }>();

        for (const r of records as any[]) {
          const subj = r.attendance_session?.class_session?.subject;
          if (!subj) continue;

          const existing = subjectMap.get(subj.id) || {
            code: subj.code,
            name: subj.name,
            total: 0,
            attended: 0,
            absent: 0,
          };

          existing.total += 1;
          if (r.status === 'PRESENT' || r.status === 'LATE') existing.attended += 1;
          else if (r.status === 'ABSENT') existing.absent += 1;

          subjectMap.set(subj.id, existing);
        }

        const summaries: AttendanceSummary[] = [];
        subjectMap.forEach((val, key) => {
          const percentage = val.total > 0 ? Math.round((val.attended / val.total) * 100) : 0;
          summaries.push({
            subject_id: key,
            subject_code: val.code,
            subject_name: val.name,
            total_classes: val.total,
            attended_classes: val.attended,
            absent_classes: val.absent,
            percentage,
            is_shortage: percentage < 75,
          });
        });

        if (summaries.length > 0) return summaries;
      }
    }
    return [];
  }
}

export const attendanceService = new AttendanceService();
