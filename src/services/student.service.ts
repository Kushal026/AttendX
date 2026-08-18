const API_BASE = 'http://localhost:5000/api/v1';

export interface ScanAttendanceResult {
  success: boolean;
  message?: string;
  error?: string;
  isDuplicate?: boolean;
  isExpired?: boolean;
  isWrongSection?: boolean;
  attendance?: {
    id: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    marked_at: string;
    subject_name: string;
    subject_code: string;
    section_name: string;
    student_name: string;
    roll_number: string;
  };
}

export interface StudentDashboardStats {
  student: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    roll_number: string;
    register_number: string;
    course_name: string;
    department_name: string;
    semester_number: number;
    section_name: string;
    section_id: string;
  };
  recentAttendance: Array<{
    id: string;
    status: string;
    marked_at: string;
    method: string;
    subject_name: string;
    subject_code: string;
    section_name: string;
  }>;
}

export interface StudentAttendanceHistoryLog {
  id: string;
  session_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  method: string;
  marked_at: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  section_name: string;
  faculty_name: string;
}

export interface StudentAttendanceSummary {
  summary: {
    total_sessions: number;
    total_present: number;
    total_absent: number;
    overall_percentage: number | null;
    has_records: boolean;
  };
  subjectBreakdown: Array<{
    subject_id: string;
    subject_name: string;
    subject_code: string;
    total_classes: number;
    attended_classes: number;
    absent_classes: number;
    percentage: number;
  }>;
}

class StudentService {
  async scanAttendance(
    userId: string,
    data: {
      qr_payload: string;
      ip_address?: string;
      device_info?: string;
      geo_latitude?: number;
      geo_longitude?: number;
    }
  ): Promise<ScanAttendanceResult> {
    try {
      const res = await fetch(`${API_BASE}/student/scan-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...data,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        return {
          success: true,
          message: json.message,
          attendance: json.attendance,
        };
      }

      return {
        success: false,
        error: json.error || 'Failed to mark attendance.',
        isDuplicate: res.status === 409,
        isExpired: res.status === 410,
        isWrongSection: res.status === 403 && json.error?.includes('class'),
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Unable to connect. Please check your network connection.',
      };
    }
  }

  async getStudentDashboardStats(userId: string): Promise<StudentDashboardStats | null> {
    try {
      const res = await fetch(`${API_BASE}/student/${userId}/dashboard-stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('getStudentDashboardStats error:', e);
    }
    return null;
  }

  async getStudentAttendanceHistory(
    userId: string,
    filters?: { subject_id?: string; status?: string }
  ): Promise<StudentAttendanceHistoryLog[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject_id) params.append('subject_id', filters.subject_id);
      if (filters?.status) params.append('status', filters.status);

      const url = `${API_BASE}/student/${userId}/attendance-history${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.history || [];
      }
    } catch (e) {
      console.error('getStudentAttendanceHistory error:', e);
    }
    return [];
  }

  async getStudentAttendanceSummary(userId: string): Promise<StudentAttendanceSummary | null> {
    try {
      const res = await fetch(`${API_BASE}/student/${userId}/attendance-summary`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('getStudentAttendanceSummary error:', e);
    }
    return null;
  }

  async getStudentReport(userId: string): Promise<{
    student: {
      id: string;
      full_name: string;
      roll_number: string;
      register_number: string;
      course: string;
      section: string;
    };
    summary: {
      total_sessions: number;
      total_present: number;
      total_absent: number;
      overall_percentage: number | null;
      is_eligible: boolean;
    };
    subjects: Array<{
      subject_id: string;
      subject_name: string;
      subject_code: string;
      total: number;
      present: number;
      absent: number;
      percentage: number;
    }>;
    history: Array<{
      id: string;
      date: string;
      subject_name: string;
      subject_code: string;
      faculty_name: string;
      status: string;
      method: string;
    }>;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/student/${userId}/report`);
      if (res.ok) {
        const json = await res.json();
        return json.report;
      }
    } catch (e) {
      console.error('getStudentReport error:', e);
    }
    return null;
  }
}

export const studentService = new StudentService();
