import { User, StudentProfile, FacultyProfile, UserRole } from '../types';
import { API_BASE } from './api.config';

class UserService {
  // ── USERS ──
  async getAllUsers(_roleFilter?: UserRole): Promise<User[]> {
    try {
      const [students, faculty] = await Promise.all([
        this.getAllStudents(),
        this.getAllFaculty(),
      ]);
      const users: User[] = [];
      students.forEach((s) => { if (s.user) users.push(s.user); });
      faculty.forEach((f) => { if (f.user) users.push(f.user); });
      return users;
    } catch {
      return [];
    }
  }

  // ── STUDENTS ──
  async getAllStudents(filter?: { department_id?: string; course_id?: string; semester_id?: string; section_id?: string; search?: string }): Promise<StudentProfile[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.department_id) params.append('department_id', filter.department_id);
      if (filter?.course_id) params.append('course_id', filter.course_id);
      if (filter?.semester_id) params.append('semester_id', filter.semester_id);
      if (filter?.section_id) params.append('section_id', filter.section_id);
      if (filter?.search) params.append('search', filter.search);

      const res = await fetch(`${API_BASE}/admin/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return (json.students || []).map((s: any) => ({
          ...s,
          department_name: s.department?.name,
          course_name: s.course?.name,
          semester_number: s.semester?.semester_number,
          section_name: s.section?.name,
        }));
      }
    } catch (e) {
      console.error('getAllStudents error:', e);
    }
    return [];
  }

  async createStudent(data: {
    full_name: string;
    email: string;
    password?: string;
    phone?: string;
    roll_number: string;
    register_number?: string;
    department_id: string;
    course_id: string;
    semester_id: string;
    section_id: string;
  }): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create student' };
      return { success: true, student: json.student };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async updateStudent(id: string, data: {
    full_name?: string;
    phone?: string;
    roll_number?: string;
    register_number?: string;
    department_id?: string;
    course_id?: string;
    semester_id?: string;
    section_id?: string;
  }): Promise<{ success: boolean; student?: StudentProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to update student' };
      return { success: true, student: json.student };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async toggleStudentStatus(id: string): Promise<{ success: boolean; is_active?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/students/${id}/status`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error };
      return { success: true, is_active: json.is_active };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // ── FACULTY ──
  async getAllFaculty(filter?: { department_id?: string; search?: string }): Promise<FacultyProfile[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.department_id) params.append('department_id', filter.department_id);
      if (filter?.search) params.append('search', filter.search);

      const res = await fetch(`${API_BASE}/admin/faculty?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return (json.faculty || []).map((f: any) => ({
          ...f,
          department_name: f.department?.name,
        }));
      }
    } catch (e) {
      console.error('getAllFaculty error:', e);
    }
    return [];
  }

  async createFaculty(data: {
    full_name: string;
    email: string;
    password?: string;
    phone?: string;
    employee_id: string;
    department_id: string;
    designation?: string;
    qualification?: string;
    office_room?: string;
  }): Promise<{ success: boolean; faculty?: FacultyProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create faculty' };
      return { success: true, faculty: json.faculty };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async updateFaculty(id: string, data: {
    full_name?: string;
    phone?: string;
    employee_id?: string;
    department_id?: string;
    designation?: string;
    qualification?: string;
    office_room?: string;
  }): Promise<{ success: boolean; faculty?: FacultyProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/faculty/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to update faculty' };
      return { success: true, faculty: json.faculty };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async toggleFacultyStatus(id: string): Promise<{ success: boolean; is_active?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/faculty/${id}/status`, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error };
      return { success: true, is_active: json.is_active };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async toggleUserStatus(userId: string): Promise<User | undefined> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, { method: 'PATCH' });
      if (res.ok) {
        const json = await res.json();
        return json.user;
      }
    } catch {
      // ignore
    }
    return undefined;
  }
}

export const userService = new UserService();
