import {
  Department,
  Course,
  Semester,
  Section,
  Subject,
  FacultySubject,
  StudentSubject,
  ClassSession,
} from '../types';
import { API_BASE } from './api.config';

class AcademicService {
  // ── DEPARTMENTS ──
  async getDepartments(): Promise<Department[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/departments`);
      if (res.ok) {
        const json = await res.json();
        return json.departments || [];
      }
    } catch (e) {
      console.error('getDepartments error:', e);
    }
    return [];
  }

  async createDepartment(data: { code: string; name: string; description?: string }): Promise<{ success: boolean; department?: Department; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create department' };
      return { success: true, department: json.department };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; is_active?: boolean }): Promise<{ success: boolean; department?: Department; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to update department' };
      return { success: true, department: json.department };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  // ── COURSES ──
  async getCourses(deptId?: string): Promise<Course[]> {
    try {
      const url = deptId ? `${API_BASE}/admin/courses?department_id=${deptId}` : `${API_BASE}/admin/courses`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.courses || [];
      }
    } catch (e) {
      console.error('getCourses error:', e);
    }
    return [];
  }

  async createCourse(data: { department_id: string; code: string; name: string; degree_type?: string; total_semesters?: number }): Promise<{ success: boolean; course?: Course; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create course' };
      return { success: true, course: json.course };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  // ── SEMESTERS ──
  async getSemesters(courseId?: string): Promise<Semester[]> {
    try {
      const url = courseId ? `${API_BASE}/admin/semesters?course_id=${courseId}` : `${API_BASE}/admin/semesters`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.semesters || [];
      }
    } catch (e) {
      console.error('getSemesters error:', e);
    }
    return [];
  }

  async createSemester(data: { course_id: string; semester_number: number; academic_year: string; is_current?: boolean }): Promise<{ success: boolean; semester?: Semester; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/semesters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create semester' };
      return { success: true, semester: json.semester };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  // ── SECTIONS ──
  async getSections(semesterId?: string): Promise<Section[]> {
    try {
      const url = semesterId ? `${API_BASE}/admin/sections?semester_id=${semesterId}` : `${API_BASE}/admin/sections`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.sections || [];
      }
    } catch (e) {
      console.error('getSections error:', e);
    }
    return [];
  }

  async createSection(data: { semester_id: string; name: string; capacity?: number; room_number?: string }): Promise<{ success: boolean; section?: Section; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create section' };
      return { success: true, section: json.section };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  // ── SUBJECTS ──
  async getSubjects(courseId?: string, semesterId?: string): Promise<Subject[]> {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', courseId);
      if (semesterId) params.append('semester_id', semesterId);
      const res = await fetch(`${API_BASE}/admin/subjects?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.subjects || [];
      }
    } catch (e) {
      console.error('getSubjects error:', e);
    }
    return [];
  }

  async createSubject(data: { course_id: string; semester_id?: string; code: string; name: string; subject_type?: string; credits?: number; total_hours?: number }): Promise<{ success: boolean; subject?: Subject; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to create subject' };
      return { success: true, subject: json.subject };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  // ── FACULTY SUBJECT ASSIGNMENTS ──
  async getFacultySubjectAssignments(): Promise<FacultySubject[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/faculty-subjects`);
      if (res.ok) {
        const json = await res.json();
        return json.assignments || [];
      }
    } catch (e) {
      console.error('getFacultySubjectAssignments error:', e);
    }
    return [];
  }

  async assignFacultyToSubject(data: { faculty_id: string; subject_id: string; section_id: string; academic_year?: string }): Promise<{ success: boolean; assignment?: FacultySubject; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/faculty-subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to assign faculty' };
      return { success: true, assignment: json.assignment };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }

  async removeFacultySubjectAssignment(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/faculty-subjects/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getFacultySubjects(facultyId: string): Promise<FacultySubject[]> {
    const all = await this.getFacultySubjectAssignments();
    return all.filter((fs) => fs.faculty_id === facultyId);
  }

  async getStudentSubjects(_studentId: string): Promise<StudentSubject[]> {
    return [];
  }

  async getClassSessions(facultyId?: string): Promise<ClassSession[]> {
    try {
      const url = facultyId
        ? `${API_BASE}/faculty/classes?faculty_id=${facultyId}`
        : `${API_BASE}/faculty/classes`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.classes || [];
      }
    } catch {
      // ignore
    }
    return [];
  }

  async bulkAssignStudentsToSection(data: {
    student_ids: string[];
    section_id: string;
    semester_id?: string;
    course_id?: string;
    department_id?: string;
  }): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/students/bulk-assign-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to bulk assign students' };
      return { success: true, count: json.assigned_count };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  }
}

export const academicService = new AcademicService();
