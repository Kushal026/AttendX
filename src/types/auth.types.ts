import { User, UserRole, StudentProfile, FacultyProfile } from './user.types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  // Faculty fields
  employee_id?: string;
  department_id?: string;
  designation?: string;
  qualification?: string;
  office_room?: string;
  // Student fields
  roll_number?: string;
  register_number?: string;
  course_id?: string;
  semester_id?: string;
  section_id?: string;
  batch_year?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  student_profile?: StudentProfile;
  faculty_profile?: FacultyProfile;
}

export interface AuthState {
  user: User | null;
  student_profile: StudentProfile | null;
  faculty_profile: FacultyProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
