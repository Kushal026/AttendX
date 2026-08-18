const API_BASE = 'http://localhost:5000/api/v1';

export interface FacultyDashboardStats {
  assignedSubjectsCount: number;
  assignedClassesCount: number;
  todayClassesCount: number;
  totalStudentsCount: number;
  faculty: {
    id: string;
    name: string;
    department: string;
  };
}

export interface FacultySubjectWithSections {
  id: string;
  code: string;
  name: string;
  credit_hours: number;
  type: string;
  department_name: string;
  course_name: string;
  semester_number: number;
  academic_year: string;
  sections: Array<{
    id: string;
    name: string;
    capacity: number;
    room_number?: string;
  }>;
}

export interface FacultyClassDetail {
  assignment_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  section_id: string;
  section_name: string;
  room_number?: string;
  course_name: string;
  department_name: string;
  semester_number: number;
  academic_year: string;
  student_count: number;
  capacity: number;
}

export interface FacultyAuthorizedStudent {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  roll_number: string;
  register_number: string;
  course_name: string;
  department_name: string;
  semester_number: number;
  section_name: string;
  section_id: string;
  is_active: boolean;
}

export interface FacultyFullProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  employee_id: string;
  department_name: string;
  department_code: string;
  designation: string;
  qualification: string;
  office_room?: string;
  specialization?: string;
  joining_date: string;
  is_active: boolean;
}

export interface AttendanceSessionDetail {
  id: string;
  session_token: string;
  start_time: string;
  expires_at: string;
  remaining_seconds: number;
  duration_seconds?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'FINALIZED' | 'CANCELLED';
  total_enrolled: number;
  total_present?: number;
  total_absent?: number;
  subject: {
    id: string;
    code: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
    room_number?: string;
  };
  faculty: {
    id: string;
    name: string;
  };
  qr_payload: string | null;
}

class FacultyService {
  async createAttendanceSession(
    facultyId: string,
    data: { subject_id: string; section_id: string; duration_seconds: number }
  ): Promise<{ success: boolean; session?: AttendanceSessionDetail; error?: string; isConflict?: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/attendance/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, session: json.session };
      }
      return {
        success: false,
        error: json.error || 'Failed to create attendance session',
        session: json.session,
        isConflict: res.status === 409,
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async getAttendanceSession(facultyId: string, sessionId: string): Promise<AttendanceSessionDetail | null> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/attendance/sessions/${sessionId}`);
      if (res.ok) {
        const json = await res.json();
        return json.session || null;
      }
    } catch (e) {
      console.error('getAttendanceSession error:', e);
    }
    return null;
  }

  async cancelAttendanceSession(facultyId: string, sessionId: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/attendance/sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch (e) {
      console.error('cancelAttendanceSession error:', e);
      return false;
    }
  }

  async finalizeAttendanceSession(
    facultyId: string,
    sessionId: string
  ): Promise<{ success: boolean; error?: string; total_enrolled?: number; total_present?: number; total_absent?: number }> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/attendance/sessions/${sessionId}/finalize`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        return {
          success: true,
          total_enrolled: json.total_enrolled,
          total_present: json.total_present,
          total_absent: json.total_absent,
        };
      }
      return { success: false, error: json.error || 'Failed to finalize session' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async getSessionSummary(
    facultyId: string,
    sessionId: string,
    q?: string
  ): Promise<{
    session: any;
    roster: Array<{
      id: string;
      student_id: string;
      student_name: string;
      roll_number: string;
      register_number?: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      method: string;
      marked_at: string;
    }>;
  } | null> {
    try {
      const url = `${API_BASE}/faculty/${facultyId}/attendance/sessions/${sessionId}/summary${
        q ? `?q=${encodeURIComponent(q)}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('getSessionSummary error:', e);
    }
    return null;
  }

  async getFacultyAttendanceHistory(
    facultyId: string,
    filters?: {
      subject_id?: string;
      section_id?: string;
      status?: string;
      date_range?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<Array<{
    id: string;
    session_token: string;
    start_time: string;
    end_time: string | null;
    expires_at: string;
    finalized_at: string | null;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FINALIZED';
    total_enrolled: number;
    total_present: number;
    total_absent: number;
    subject_id?: string;
    subject_name: string;
    subject_code: string;
    section_name: string;
    section_id: string;
  }>> {
    try {
      const params = new URLSearchParams();
      if (filters?.subject_id) params.append('subject_id', filters.subject_id);
      if (filters?.section_id) params.append('section_id', filters.section_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_range) params.append('date_range', filters.date_range);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      const url = `${API_BASE}/faculty/${facultyId}/attendance/sessions${
        params.toString() ? `?${params.toString()}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.sessions || [];
      }
    } catch (e) {
      console.error('getFacultyAttendanceHistory error:', e);
    }
    return [];
  }

  async getFacultySubjectsSummary(facultyId: string): Promise<Array<{
    assignment_id: string;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    section_id: string;
    section_name: string;
    total_sessions: number;
    total_enrolled: number;
    average_attendance_percentage: number;
  }>> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/subjects/summary`);
      if (res.ok) {
        const json = await res.json();
        return json.summaries || [];
      }
    } catch (e) {
      console.error('getFacultySubjectsSummary error:', e);
    }
    return [];
  }

  async getDashboardStats(facultyId: string): Promise<FacultyDashboardStats | null> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/dashboard-stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('getDashboardStats error:', e);
    }
    return null;
  }

  async getMySubjects(facultyId: string): Promise<FacultySubjectWithSections[]> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/subjects`);
      if (res.ok) {
        const json = await res.json();
        return json.subjects || [];
      }
    } catch (e) {
      console.error('getMySubjects error:', e);
    }
    return [];
  }

  async getMyClasses(facultyId: string): Promise<FacultyClassDetail[]> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/classes`);
      if (res.ok) {
        const json = await res.json();
        return json.classes || [];
      }
    } catch (e) {
      console.error('getMyClasses error:', e);
    }
    return [];
  }

  async getAuthorizedStudents(facultyId: string, filter?: { section_id?: string; search?: string }): Promise<FacultyAuthorizedStudent[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.section_id) params.append('section_id', filter.section_id);
      if (filter?.search) params.append('search', filter.search);

      const res = await fetch(`${API_BASE}/faculty/${facultyId}/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.students || [];
      }
    } catch (e) {
      console.error('getAuthorizedStudents error:', e);
    }
    return [];
  }

  async generateAttendanceReport(
    facultyId: string,
    filters: {
      subject_id?: string;
      section_id?: string;
      student_id?: string;
      date_range?: string;
      date_from?: string;
      date_to?: string;
      threshold?: number;
      status?: string;
    }
  ): Promise<AttendanceReportResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (res.ok) {
        const json = await res.json();
        return json.report;
      }
      const errJson = await res.json();
      throw new Error(errJson.error || 'Failed to generate report.');
    } catch (e: any) {
      console.error('generateAttendanceReport error:', e);
      throw e;
    }
  }

  getExportCSVUrl(
    facultyId: string,
    filters: {
      subject_id?: string;
      section_id?: string;
      student_id?: string;
      date_range?: string;
      date_from?: string;
      date_to?: string;
      threshold?: number;
      status?: string;
    }
  ): string {
    const params = new URLSearchParams();
    if (filters.subject_id) params.append('subject_id', filters.subject_id);
    if (filters.section_id) params.append('section_id', filters.section_id);
    if (filters.student_id) params.append('student_id', filters.student_id);
    if (filters.date_range) params.append('date_range', filters.date_range);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.threshold) params.append('threshold', String(filters.threshold));
    if (filters.status) params.append('status', filters.status);

    return `${API_BASE}/faculty/${facultyId}/reports/export-csv?${params.toString()}`;
  }

  async verifyAssignment(facultyId: string, subjectId: string, sectionId: string): Promise<{ authorized: boolean; assignment?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/verify-assignment?subject_id=${subjectId}&section_id=${sectionId}`);
      const json = await res.json();
      return {
        authorized: json.authorized || false,
        assignment: json.assignment,
        error: json.error,
      };
    } catch (e: any) {
      return { authorized: false, error: e.message || 'Network error' };
    }
  }

  async getFacultyProfile(facultyId: string): Promise<FacultyFullProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/faculty/${facultyId}/profile`);
      if (res.ok) {
        const json = await res.json();
        return json.faculty || null;
      }
    } catch (e) {
      console.error('getFacultyProfile error:', e);
    }
    return null;
  }
}

export const facultyService = new FacultyService();

export interface AttendanceReportResponse {
  summary: {
    total_students: number;
    total_sessions: number;
    total_present: number;
    total_absent: number;
    overall_percentage: number;
    threshold: number;
    low_attendance_count: number;
    has_data: boolean;
  };
  students: Array<{
    student_id: string;
    student_name: string;
    roll_number: string;
    register_number: string;
    section_name: string;
    total_sessions: number;
    present_count: number;
    absent_count: number;
    percentage: number;
    is_low_attendance: boolean;
  }>;
  low_attendance_students: Array<{
    student_id: string;
    student_name: string;
    roll_number: string;
    percentage: number;
    present_count: number;
    total_sessions: number;
  }>;
  sessions: Array<{
    id: string;
    date: string;
    subject_code: string;
    subject_name: string;
    section_name: string;
    total_enrolled: number;
    total_present: number;
    total_absent: number;
    turnout_percentage: number;
  }>;
  metadata: {
    generated_at: string;
    faculty_name: string;
    subject_name: string;
    subject_code: string;
    section_name: string;
    date_range: string;
    threshold: number;
  };
}
