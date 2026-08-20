import { FacultyProfile } from './user.types';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  head_of_department_id?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  department_id: string;
  code: string;
  name: string;
  degree_type: string;
  total_semesters: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  department_name?: string;
}

export interface Semester {
  id: string;
  course_id: string;
  semester_number: number;
  academic_year: string; // e.g. "2025-2026"
  is_current: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Section {
  id: string;
  semester_id: string;
  name: string; // e.g. "Section A", "Section B"
  capacity: number;
  room_number?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  semester?: Semester;
}

export type SubjectType = 'THEORY' | 'LAB' | 'ELECTIVE' | 'SEMINAR';

export interface Subject {
  id: string;
  course_id: string;
  semester_id?: string;
  code: string;
  name: string;
  subject_type?: string;
  type?: SubjectType;
  credits?: number;
  credit_hours?: number;
  total_hours?: number;
  is_active?: boolean;
  syllabus_url?: string;
  created_at: string;
  updated_at: string;
  course?: Course;
  semester?: Semester;
}

export interface FacultySubject {
  id: string;
  faculty_id: string;
  subject_id: string;
  section_id: string;
  academic_year: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  // Joined relational data
  faculty?: FacultyProfile;
  subject?: Subject;
  section?: Section;
}

export interface StudentSubject {
  id: string;
  student_id: string;
  subject_id: string;
  section_id: string;
  academic_year: string;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export type ClassSessionStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface ClassSession {
  id: string;
  subject_id: string;
  faculty_id: string;
  section_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  room: string;
  topic?: string;
  status: ClassSessionStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  subject?: Subject;
  section?: Section;
  faculty_name?: string;
}
