export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  roll_number: string;
  register_number: string;
  department_id: string;
  course_id: string;
  semester_id: string;
  section_id: string;
  batch_year: string;
  admission_date?: string;
  parent_name?: string;
  parent_contact?: string;
  current_gpa?: number;
  created_at: string;
  updated_at: string;
  // Joined relational data
  user?: User;
  department_name?: string;
  course_name?: string;
  semester_number?: number;
  section_name?: string;
}

export interface FacultyProfile {
  id: string;
  user_id: string;
  employee_id: string;
  department_id: string;
  designation: string;
  qualification: string;
  specialization?: string;
  joining_date: string;
  office_room?: string;
  created_at: string;
  updated_at: string;
  // Joined relational data
  user?: User;
  department_name?: string;
}
