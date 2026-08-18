import {
  User,
  StudentProfile,
  FacultyProfile,
  Department,
  Course,
  Semester,
  Section,
  Subject,
  FacultySubject,
  StudentSubject,
  ClassSession,
  AttendanceSession,
  AttendanceRecord,
  Notification,
  AttendanceAuditLog,
  SystemSetting,
  AttendanceSummary,
} from '../types';

// ============================================================================
// 1. MOCK USERS
// ============================================================================
export const mockUsers: User[] = [
  {
    id: 'usr_admin_1',
    email: 'admin@smartattendance.edu',
    full_name: 'Dr. Robert Vance',
    role: 'ADMIN',
    phone: '+1 (555) 234-5678',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    is_active: true,
    last_login_at: '2026-08-18T08:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-08-18T08:00:00Z',
  },
  {
    id: 'usr_faculty_1',
    email: 'faculty@smartattendance.edu',
    full_name: 'Prof. Elena Rostova',
    role: 'FACULTY',
    phone: '+1 (555) 345-6789',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    is_active: true,
    last_login_at: '2026-08-18T08:15:00Z',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2026-08-18T08:15:00Z',
  },
  {
    id: 'usr_faculty_2',
    email: 'marcus.chen@smartattendance.edu',
    full_name: 'Dr. Marcus Chen',
    role: 'FACULTY',
    phone: '+1 (555) 456-7890',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    is_active: true,
    last_login_at: '2026-08-17T16:00:00Z',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2026-08-17T16:00:00Z',
  },
  {
    id: 'usr_student_1',
    email: 'student@smartattendance.edu',
    full_name: 'Aiden Walker',
    role: 'STUDENT',
    phone: '+1 (555) 567-8901',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    is_active: true,
    last_login_at: '2026-08-18T07:45:00Z',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2026-08-18T07:45:00Z',
  },
  {
    id: 'usr_student_2',
    email: 'sophia.taylor@smartattendance.edu',
    full_name: 'Sophia Taylor',
    role: 'STUDENT',
    phone: '+1 (555) 678-9012',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    is_active: true,
    last_login_at: '2026-08-18T08:10:00Z',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2026-08-18T08:10:00Z',
  },
];

// ============================================================================
// 2. DEPARTMENTS
// ============================================================================
export const mockDepartments: Department[] = [
  {
    id: 'dept_cs',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    description: 'Department of Computer Science, Software Engineering & AI',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dept_ece',
    code: 'ECE',
    name: 'Electronics & Communication Engineering',
    description: 'Department of Microelectronics, Signal Processing and IoT',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dept_it',
    code: 'IT',
    name: 'Information Technology',
    description: 'Department of Cloud Computing, Cybersecurity & Networking',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// ============================================================================
// 3. COURSES
// ============================================================================
export const mockCourses: Course[] = [
  {
    id: 'course_btech_cse',
    department_id: 'dept_cs',
    code: 'CS-101',
    name: 'Bachelor of Technology in Computer Science',
    degree_type: 'B.Tech',
    total_semesters: 8,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'course_mtech_ai',
    department_id: 'dept_cs',
    code: 'AI-201',
    name: 'Master of Technology in Artificial Intelligence',
    degree_type: 'M.Tech',
    total_semesters: 4,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// ============================================================================
// 4. SEMESTERS
// ============================================================================
export const mockSemesters: Semester[] = [
  {
    id: 'sem_cs_6',
    course_id: 'course_btech_cse',
    semester_number: 6,
    academic_year: '2025-2026',
    is_current: true,
    start_date: '2026-01-10',
    end_date: '2026-06-15',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// ============================================================================
// 5. SECTIONS
// ============================================================================
export const mockSections: Section[] = [
  {
    id: 'sec_cs_6a',
    semester_id: 'sem_cs_6',
    name: 'Section 6-A',
    capacity: 65,
    room_number: 'Lab Complex 302',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sec_cs_6b',
    semester_id: 'sem_cs_6',
    name: 'Section 6-B',
    capacity: 60,
    room_number: 'Lecture Hall 104',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// ============================================================================
// 6. FACULTY PROFILES
// ============================================================================
export const mockFacultyProfiles: FacultyProfile[] = [
  {
    id: 'fac_1',
    user_id: 'usr_faculty_1',
    employee_id: 'EMP-CS-804',
    department_id: 'dept_cs',
    designation: 'Associate Professor',
    qualification: 'Ph.D. in Computer Science (MIT)',
    specialization: 'Distributed Systems & Cloud Computing',
    joining_date: '2020-07-15',
    office_room: 'Academic Block B - 412',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
  {
    id: 'fac_2',
    user_id: 'usr_faculty_2',
    employee_id: 'EMP-CS-912',
    department_id: 'dept_cs',
    designation: 'Assistant Professor',
    qualification: 'Ph.D. in Machine Learning (Stanford)',
    specialization: 'Deep Learning & Computer Vision',
    joining_date: '2022-08-01',
    office_room: 'Academic Block B - 408',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
];

// ============================================================================
// 7. STUDENT PROFILES
// ============================================================================
export const mockStudentProfiles: StudentProfile[] = [
  {
    id: 'std_1',
    user_id: 'usr_student_1',
    roll_number: '22CS042',
    register_number: 'REG2022CS0042',
    department_id: 'dept_cs',
    course_id: 'course_btech_cse',
    semester_id: 'sem_cs_6',
    section_id: 'sec_cs_6a',
    batch_year: '2022-2026',
    admission_date: '2022-08-15',
    parent_name: 'David Walker',
    parent_contact: '+1 (555) 998-1122',
    current_gpa: 3.88,
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-01T00:00:00Z',
    department_name: 'Computer Science and Engineering',
    course_name: 'B.Tech in Computer Science',
    semester_number: 6,
    section_name: 'Section 6-A',
  },
  {
    id: 'std_2',
    user_id: 'usr_student_2',
    roll_number: '22CS089',
    register_number: 'REG2022CS0089',
    department_id: 'dept_cs',
    course_id: 'course_btech_cse',
    semester_id: 'sem_cs_6',
    section_id: 'sec_cs_6a',
    batch_year: '2022-2026',
    admission_date: '2022-08-15',
    parent_name: 'Sarah Taylor',
    parent_contact: '+1 (555) 887-3344',
    current_gpa: 3.92,
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-01T00:00:00Z',
    department_name: 'Computer Science and Engineering',
    course_name: 'B.Tech in Computer Science',
    semester_number: 6,
    section_name: 'Section 6-A',
  },
];

// ============================================================================
// 8. SUBJECTS
// ============================================================================
export const mockSubjects: Subject[] = [
  {
    id: 'sub_cs601',
    course_id: 'course_btech_cse',
    semester_id: 'sem_cs_6',
    code: 'CS601',
    name: 'Distributed Systems & Cloud Architecture',
    credit_hours: 4,
    type: 'THEORY',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sub_cs602',
    course_id: 'course_btech_cse',
    semester_id: 'sem_cs_6',
    code: 'CS602',
    name: 'Machine Learning & Pattern Recognition',
    credit_hours: 4,
    type: 'THEORY',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sub_cs603',
    course_id: 'course_btech_cse',
    semester_id: 'sem_cs_6',
    code: 'CS603',
    name: 'Compiler Design & Optimization',
    credit_hours: 3,
    type: 'THEORY',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'sub_cs604',
    course_id: 'course_btech_cse',
    semester_id: 'sem_cs_6',
    code: 'CS604L',
    name: 'Cloud & DevOps Engineering Laboratory',
    credit_hours: 2,
    type: 'LAB',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// ============================================================================
// 9. FACULTY_SUBJECTS
// ============================================================================
export const mockFacultySubjects: FacultySubject[] = [
  {
    id: 'fac_sub_1',
    faculty_id: 'fac_1',
    subject_id: 'sub_cs601',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    is_primary: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[0],
    section: mockSections[0],
  },
  {
    id: 'fac_sub_2',
    faculty_id: 'fac_1',
    subject_id: 'sub_cs604',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    is_primary: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[3],
    section: mockSections[0],
  },
  {
    id: 'fac_sub_3',
    faculty_id: 'fac_2',
    subject_id: 'sub_cs602',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    is_primary: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[1],
    section: mockSections[0],
  },
];

// ============================================================================
// 10. STUDENT_SUBJECTS
// ============================================================================
export const mockStudentSubjects: StudentSubject[] = [
  {
    id: 'std_sub_1',
    student_id: 'std_1',
    subject_id: 'sub_cs601',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    status: 'ENROLLED',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[0],
  },
  {
    id: 'std_sub_2',
    student_id: 'std_1',
    subject_id: 'sub_cs602',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    status: 'ENROLLED',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[1],
  },
  {
    id: 'std_sub_3',
    student_id: 'std_1',
    subject_id: 'sub_cs603',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    status: 'ENROLLED',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[2],
  },
  {
    id: 'std_sub_4',
    student_id: 'std_1',
    subject_id: 'sub_cs604',
    section_id: 'sec_cs_6a',
    academic_year: '2025-2026',
    status: 'ENROLLED',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subject: mockSubjects[3],
  },
];

// ============================================================================
// 11. CLASS_SESSIONS
// ============================================================================
export const mockClassSessions: ClassSession[] = [
  {
    id: 'cls_101',
    subject_id: 'sub_cs601',
    faculty_id: 'fac_1',
    section_id: 'sec_cs_6a',
    date: '2026-08-18',
    start_time: '09:00',
    end_time: '10:00',
    room: 'Lab Complex 302',
    topic: 'Microservices & Event-Driven Message Brokers (Kafka/RabbitMQ)',
    status: 'ONGOING',
    created_at: '2026-08-18T00:00:00Z',
    updated_at: '2026-08-18T09:00:00Z',
    subject: mockSubjects[0],
    section: mockSections[0],
    faculty_name: 'Prof. Elena Rostova',
  },
  {
    id: 'cls_102',
    subject_id: 'sub_cs602',
    faculty_id: 'fac_2',
    section_id: 'sec_cs_6a',
    date: '2026-08-18',
    start_time: '11:00',
    end_time: '12:00',
    room: 'LH-104',
    topic: 'Transformer Architecture & Self-Attention Mechanisms',
    status: 'SCHEDULED',
    created_at: '2026-08-18T00:00:00Z',
    updated_at: '2026-08-18T00:00:00Z',
    subject: mockSubjects[1],
    section: mockSections[0],
    faculty_name: 'Dr. Marcus Chen',
  },
  {
    id: 'cls_103',
    subject_id: 'sub_cs604',
    faculty_id: 'fac_1',
    section_id: 'sec_cs_6a',
    date: '2026-08-18',
    start_time: '14:00',
    end_time: '16:00',
    room: 'Cloud Lab 2',
    topic: 'Kubernetes Pod Autoscaling & Ingress Configuration Lab',
    status: 'SCHEDULED',
    created_at: '2026-08-18T00:00:00Z',
    updated_at: '2026-08-18T00:00:00Z',
    subject: mockSubjects[3],
    section: mockSections[0],
    faculty_name: 'Prof. Elena Rostova',
  },
];

// ============================================================================
// 12. ATTENDANCE_SESSIONS
// ============================================================================
export const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: 'att_sess_101',
    class_session_id: 'cls_101',
    faculty_id: 'fac_1',
    session_token: 'sess_tok_98234ab1c890',
    qr_payload_hash: 'sha256_qr_hash_live_token_77a8b9c1d2e3',
    qr_rotation_seconds: 15,
    start_time: '2026-08-18T09:00:00Z',
    end_time: undefined,
    expires_at: '2026-08-18T09:15:00Z',
    status: 'ACTIVE',
    auto_absent_processed: false,
    total_enrolled: 62,
    total_present: 56,
    total_absent: 6,
    total_late: 3,
    cancelled_reason: undefined,
    finalized_at: undefined,
    created_at: '2026-08-18T09:00:00Z',
    updated_at: '2026-08-18T09:08:00Z',
    class_session: mockClassSessions[0],
  },
];

// ============================================================================
// 13. ATTENDANCE RECORDS
// ============================================================================
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att_rec_1',
    attendance_session_id: 'att_sess_101',
    student_id: 'std_1',
    marked_at: '2026-08-18T09:02:14Z',
    status: 'PRESENT',
    method: 'QR_SCAN',
    ip_address: '192.168.10.45',
    device_info: 'Chrome 122 (macOS / iPhone)',
    geo_latitude: 37.7749,
    geo_longitude: -122.4194,
    created_at: '2026-08-18T09:02:14Z',
    updated_at: '2026-08-18T09:02:14Z',
    student: mockStudentProfiles[0],
  },
  {
    id: 'att_rec_2',
    attendance_session_id: 'att_sess_101',
    student_id: 'std_2',
    marked_at: '2026-08-18T09:03:02Z',
    status: 'PRESENT',
    method: 'QR_SCAN',
    ip_address: '192.168.10.51',
    device_info: 'Safari 17.2 (iOS / iPad)',
    geo_latitude: 37.7749,
    geo_longitude: -122.4194,
    created_at: '2026-08-18T09:03:02Z',
    updated_at: '2026-08-18T09:03:02Z',
    student: mockStudentProfiles[1],
  },
];

// Student Attendance Summaries
export const mockStudentAttendanceSummaries: AttendanceSummary[] = [
  {
    subject_id: 'sub_cs601',
    subject_code: 'CS601',
    subject_name: 'Distributed Systems & Cloud Architecture',
    total_classes: 24,
    attended_classes: 23,
    absent_classes: 1,
    percentage: 95.8,
    is_shortage: false,
  },
  {
    subject_id: 'sub_cs602',
    subject_code: 'CS602',
    subject_name: 'Machine Learning & Pattern Recognition',
    total_classes: 22,
    attended_classes: 20,
    absent_classes: 2,
    percentage: 90.9,
    is_shortage: false,
  },
  {
    subject_id: 'sub_cs603',
    subject_code: 'CS603',
    subject_name: 'Compiler Design & Optimization',
    total_classes: 20,
    attended_classes: 15,
    absent_classes: 5,
    percentage: 75.0,
    is_shortage: false,
  },
  {
    subject_id: 'sub_cs604',
    subject_code: 'CS604L',
    subject_name: 'Cloud & DevOps Engineering Laboratory',
    total_classes: 12,
    attended_classes: 12,
    absent_classes: 0,
    percentage: 100.0,
    is_shortage: false,
  },
];

// ============================================================================
// 14. NOTIFICATIONS
// ============================================================================
export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    user_id: 'usr_student_1',
    title: 'Attendance Session Live',
    message: 'Prof. Elena Rostova opened attendance for CS601 (Distributed Systems).',
    type: 'ATTENDANCE',
    is_read: false,
    action_link: '/student/attendance',
    created_at: '2026-08-18T09:00:00Z',
  },
  {
    id: 'notif_2',
    user_id: 'usr_student_1',
    title: 'Attendance Verified',
    message: 'Your attendance for CS601 was recorded successfully as PRESENT.',
    type: 'INFO',
    is_read: true,
    read_at: '2026-08-18T09:03:00Z',
    action_link: '/student/attendance',
    created_at: '2026-08-18T09:02:15Z',
  },
  {
    id: 'notif_3',
    user_id: 'usr_faculty_1',
    title: 'Session Timer Alert',
    message: 'Attendance Session for CS601 will automatically close in 7 minutes.',
    type: 'WARNING',
    is_read: false,
    action_link: '/faculty/attendance',
    created_at: '2026-08-18T09:08:00Z',
  },
  {
    id: 'notif_4',
    user_id: 'usr_admin_1',
    title: 'Daily Attendance Audit Ready',
    message: 'Institutional attendance sync completed. 94.2% overall average.',
    type: 'SYSTEM',
    is_read: false,
    action_link: '/admin/audit-logs',
    created_at: '2026-08-18T08:00:00Z',
  },
];

// ============================================================================
// 15. ATTENDANCE AUDIT LOGS
// ============================================================================
export const mockAuditLogs: AttendanceAuditLog[] = [
  {
    id: 'audit_1',
    attendance_id: 'att_rec_1',
    performed_by: 'usr_student_1',
    performed_by_name: 'Aiden Walker (Self QR)',
    action: 'CREATE',
    previous_status: undefined,
    new_status: 'PRESENT',
    reason: 'Dynamic QR token scan verified via encrypted session signature',
    ip_address: '192.168.10.45',
    created_at: '2026-08-18T09:02:14Z',
  },
  {
    id: 'audit_2',
    attendance_id: 'att_rec_prev_1',
    performed_by: 'usr_faculty_1',
    performed_by_name: 'Prof. Elena Rostova',
    action: 'OVERRIDE',
    previous_status: 'ABSENT',
    new_status: 'EXCUSED',
    reason: 'Medical on-duty certificate provided for inter-collegiate hackathon',
    ip_address: '192.168.1.100',
    created_at: '2026-08-17T15:20:00Z',
  },
  {
    id: 'audit_3',
    attendance_id: 'att_rec_prev_2',
    performed_by: 'usr_admin_1',
    performed_by_name: 'Dr. Robert Vance (Admin Override)',
    action: 'UPDATE',
    previous_status: 'LATE',
    new_status: 'PRESENT',
    reason: 'Campus bus transit delay verified by transport department',
    ip_address: '192.168.1.1',
    created_at: '2026-08-16T11:40:00Z',
  },
];

// ============================================================================
// 16. SYSTEM SETTINGS
// ============================================================================
export const mockSystemSettings: SystemSetting[] = [
  {
    id: 'set_1',
    setting_key: 'QR_REFRESH_INTERVAL_SECONDS',
    setting_value: '10',
    category: 'QR_SECURITY',
    description: 'Duration in seconds after which dynamic QR code hash rotates to prevent screenshot sharing',
    is_public: true,
    updated_by: 'usr_admin_1',
    updated_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'set_2',
    setting_key: 'SESSION_GRACE_PERIOD_MINUTES',
    setting_value: '15',
    category: 'ATTENDANCE_RULES',
    description: 'Time window from class start time during which attendance session remains open',
    is_public: true,
    updated_by: 'usr_admin_1',
    updated_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'set_3',
    setting_key: 'AUTO_MARK_ABSENT_ENABLED',
    setting_value: 'true',
    category: 'ATTENDANCE_RULES',
    description: 'Automatically mark all unscanned enrolled students as ABSENT when session expires',
    is_public: true,
    updated_by: 'usr_admin_1',
    updated_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'set_4',
    setting_key: 'MINIMUM_ATTENDANCE_PERCENTAGE',
    setting_value: '75',
    category: 'ATTENDANCE_RULES',
    description: 'Minimum required institutional attendance percentage before triggering shortage alerts',
    is_public: true,
    updated_by: 'usr_admin_1',
    updated_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'set_5',
    setting_key: 'GEO_FENCING_ENABLED',
    setting_value: 'false',
    category: 'SECURITY',
    description: 'Enforce GPS classroom perimeter validation during student QR scanning',
    is_public: false,
    updated_by: 'usr_admin_1',
    updated_at: '2026-08-01T00:00:00Z',
  },
];
