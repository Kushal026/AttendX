import express, { NextFunction } from 'express';
type Request = any;
type Response = any;
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Health / Status
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    phase: 'PHASE_4_ADMIN_MODULE',
    timestamp: new Date().toISOString(),
    supported_roles: ['ADMIN', 'FACULTY', 'STUDENT'],
    entities_count: 16,
    database: {
      orm: 'Prisma 7.x',
      provider: 'PostgreSQL 14+ (Supabase)',
      rls_enabled: true,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalCourses,
      totalSemesters,
      totalSections,
      totalSubjects,
      totalUsers,
      totalActiveSessions,
      totalFinalizedSessions,
      totalPresentRecords,
      totalAbsentRecords,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.department.count(),
      prisma.course.count(),
      prisma.semester.count(),
      prisma.section.count(),
      prisma.subject.count(),
      prisma.user.count(),
      prisma.attendanceSession.count({ where: { status: 'ACTIVE' } }),
      prisma.attendanceSession.count({ where: { status: 'FINALIZED' } }),
      prisma.attendance.count({ where: { status: 'PRESENT' } }),
      prisma.attendance.count({ where: { status: 'ABSENT' } }),
    ]);

    res.json({
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalCourses,
      totalSemesters,
      totalSections,
      totalSubjects,
      totalUsers,
      totalActiveSessions,
      totalFinalizedSessions,
      totalPresentRecords,
      totalAbsentRecords,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Admin Stats Error]:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC STRUCTURE (Dropdowns helper)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/academics/structure', async (_req: Request, res: Response) => {
  try {
    const [departments, courses, semesters, sections, subjects] = await Promise.all([
      prisma.department.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } }),
      prisma.course.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } }),
      prisma.semester.findMany({ orderBy: { semester_number: 'asc' } }),
      prisma.section.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } }),
      prisma.subject.findMany({ where: { is_active: true }, orderBy: { name: 'asc' } }),
    ]);

    res.json({ departments, courses, semesters, sections, subjects });
  } catch (err: any) {
    console.error('[Academics Structure Error]:', err);
    res.status(500).json({ error: 'Failed to load academic structure' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION: SIGN UP & LOGIN
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/v1/auth/signup', async (req: Request, res: Response) => {
  const {
    email,
    password,
    full_name,
    role,
    phone,
    avatar_url,
    employee_id,
    department_id,
    designation,
    qualification,
    office_room,
    roll_number,
    register_number,
    course_id,
    semester_id,
    section_id,
    batch_year,
  } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Email, password, full name, and role are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: full_name.trim(),
          role: role as any,
          phone: phone || null,
          avatar_url: avatar_url || null,
          is_active: true,
        },
      });

      let profileData = null;

      if (role === 'FACULTY') {
        if (!department_id || !employee_id) {
          throw new Error('Department and Employee ID are required for Faculty registration.');
        }

        profileData = await tx.faculty.create({
          data: {
            user_id: newUser.id,
            employee_id: employee_id.trim(),
            department_id,
            designation: designation || 'Assistant Professor',
            qualification: qualification || 'Master of Technology',
            joining_date: new Date(),
            office_room: office_room || null,
          },
        });
      } else if (role === 'STUDENT') {
        if (!department_id || !course_id || !semester_id || !section_id || !roll_number) {
          throw new Error('Department, Course, Semester, Section, and Roll Number are required for Student registration.');
        }

        profileData = await tx.student.create({
          data: {
            user_id: newUser.id,
            roll_number: roll_number.trim(),
            register_number: register_number ? register_number.trim() : `REG-${Date.now().toString().slice(-6)}`,
            department_id,
            course_id,
            semester_id,
            section_id,
            batch_year: batch_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
            admission_date: new Date(),
            current_gpa: 3.5,
          },
        });
      }

      return { user: newUser, profile: profileData };
    });

    const token = `jwt_${result.user.role.toLowerCase()}_${result.user.id}_${Date.now()}`;

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        role: result.user.role,
        phone: result.user.phone,
        avatar_url: result.user.avatar_url,
        is_active: result.user.is_active,
      },
      token,
      profile: result.profile,
    });
  } catch (err: any) {
    console.error('[Signup Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create account.' });
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        student: {
          include: {
            department: true,
            course: true,
            semester: true,
            section: true,
          },
        },
        faculty: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account is deactivated. Contact the administrator.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const token = `jwt_${user.role.toLowerCase()}_${user.id}_${Date.now()}`;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
      },
      student_profile: user.student,
      faculty_profile: user.faculty,
      token,
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'Authentication service error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. STUDENTS CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/students', async (req: Request, res: Response) => {
  try {
    const { department_id, course_id, semester_id, section_id, search } = req.query;

    const students = await prisma.student.findMany({
      where: {
        department_id: department_id ? String(department_id) : undefined,
        course_id: course_id ? String(course_id) : undefined,
        semester_id: semester_id ? String(semester_id) : undefined,
        section_id: section_id ? String(section_id) : undefined,
        OR: search
          ? [
              { roll_number: { contains: String(search), mode: 'insensitive' } },
              { register_number: { contains: String(search), mode: 'insensitive' } },
              { user: { full_name: { contains: String(search), mode: 'insensitive' } } },
              { user: { email: { contains: String(search), mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            phone: true,
            avatar_url: true,
            is_active: true,
            last_login_at: true,
            created_at: true,
            updated_at: true,
          },
        },
        department: true,
        course: true,
        semester: true,
        section: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ students });
  } catch (err: any) {
    console.error('[Get Students Error]:', err);
    res.status(500).json({ error: 'Failed to fetch students list' });
  }
});

app.post('/api/v1/admin/students', async (req: Request, res: Response) => {
  const {
    full_name,
    email,
    password,
    phone,
    roll_number,
    register_number,
    department_id,
    course_id,
    semester_id,
    section_id,
    batch_year,
  } = req.body;

  if (!full_name || !email || !roll_number || !department_id || !course_id || !semester_id || !section_id) {
    return res.status(400).json({ error: 'Missing required student fields.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const existingRoll = await prisma.student.findUnique({ where: { roll_number: roll_number.trim() } });
    if (existingRoll) {
      return res.status(409).json({ error: 'A student with this roll number already exists.' });
    }

    const passwordHash = crypto.createHash('sha256').update(password || 'password123').digest('hex');

    const newStudent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: full_name.trim(),
          role: 'STUDENT',
          phone: phone || null,
          is_active: true,
        },
      });

      const student = await tx.student.create({
        data: {
          user_id: user.id,
          roll_number: roll_number.trim(),
          register_number: register_number ? register_number.trim() : `REG-${Date.now().toString().slice(-6)}`,
          department_id,
          course_id,
          semester_id,
          section_id,
          batch_year: batch_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
          admission_date: new Date(),
          current_gpa: 3.5,
        },
        include: {
          user: true,
          department: true,
          course: true,
          semester: true,
          section: true,
        },
      });

      return student;
    });

    res.status(201).json({ message: 'Student created successfully', student: newStudent });
  } catch (err: any) {
    console.error('[Create Student Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create student' });
  }
});

app.put('/api/v1/admin/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, phone, roll_number, register_number, department_id, course_id, semester_id, section_id } = req.body;

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const updated = await prisma.$transaction(async (tx) => {
      if (full_name || phone !== undefined) {
        await tx.user.update({
          where: { id: student.user_id },
          data: {
            full_name: full_name ? full_name.trim() : undefined,
            phone: phone !== undefined ? phone : undefined,
          },
        });
      }

      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          roll_number: roll_number ? roll_number.trim() : undefined,
          register_number: register_number ? register_number.trim() : undefined,
          department_id: department_id || undefined,
          course_id: course_id || undefined,
          semester_id: semester_id || undefined,
          section_id: section_id || undefined,
        },
        include: {
          user: true,
          department: true,
          course: true,
          semester: true,
          section: true,
        },
      });

      return updatedStudent;
    });

    res.json({ message: 'Student updated successfully', student: updated });
  } catch (err: any) {
    console.error('[Update Student Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to update student' });
  }
});

app.patch('/api/v1/admin/students/:id/status', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const student: any = await prisma.student.findUnique({ where: { id: String(id) }, include: { user: true } });
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const updatedUser = await prisma.user.update({
      where: { id: student.user_id },
      data: { is_active: !student.user.is_active },
    });

    res.json({ message: `Student status updated to ${updatedUser.is_active ? 'ACTIVE' : 'INACTIVE'}`, is_active: updatedUser.is_active });
  } catch (err: any) {
    console.error('[Toggle Student Status Error]:', err);
    res.status(500).json({ error: 'Failed to update student status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. FACULTY CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/faculty', async (req: Request, res: Response) => {
  try {
    const { department_id, search } = req.query;

    const faculty = await prisma.faculty.findMany({
      where: {
        department_id: department_id ? String(department_id) : undefined,
        OR: search
          ? [
              { employee_id: { contains: String(search), mode: 'insensitive' } },
              { designation: { contains: String(search), mode: 'insensitive' } },
              { user: { full_name: { contains: String(search), mode: 'insensitive' } } },
              { user: { email: { contains: String(search), mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            phone: true,
            avatar_url: true,
            is_active: true,
            last_login_at: true,
            created_at: true,
            updated_at: true,
          },
        },
        department: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ faculty });
  } catch (err: any) {
    console.error('[Get Faculty Error]:', err);
    res.status(500).json({ error: 'Failed to fetch faculty list' });
  }
});

app.post('/api/v1/admin/faculty', async (req: Request, res: Response) => {
  const { full_name, email, password, phone, employee_id, department_id, designation, qualification, office_room } = req.body;

  if (!full_name || !email || !employee_id || !department_id) {
    return res.status(400).json({ error: 'Full name, email, employee ID, and department are required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const existingEmp = await prisma.faculty.findUnique({ where: { employee_id: employee_id.trim() } });
    if (existingEmp) {
      return res.status(409).json({ error: 'Faculty with this Employee ID already exists.' });
    }

    const passwordHash = crypto.createHash('sha256').update(password || 'password123').digest('hex');

    const newFaculty = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: full_name.trim(),
          role: 'FACULTY',
          phone: phone || null,
          is_active: true,
        },
      });

      const faculty = await tx.faculty.create({
        data: {
          user_id: user.id,
          employee_id: employee_id.trim(),
          department_id,
          designation: designation || 'Assistant Professor',
          qualification: qualification || 'Ph.D. in Engineering',
          office_room: office_room || null,
          joining_date: new Date(),
        },
        include: {
          user: true,
          department: true,
        },
      });

      return faculty;
    });

    res.status(201).json({ message: 'Faculty member created successfully', faculty: newFaculty });
  } catch (err: any) {
    console.error('[Create Faculty Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create faculty member' });
  }
});

app.put('/api/v1/admin/faculty/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, phone, employee_id, department_id, designation, qualification, office_room } = req.body;

  try {
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) return res.status(404).json({ error: 'Faculty member not found.' });

    const updated = await prisma.$transaction(async (tx) => {
      if (full_name || phone !== undefined) {
        await tx.user.update({
          where: { id: faculty.user_id },
          data: {
            full_name: full_name ? full_name.trim() : undefined,
            phone: phone !== undefined ? phone : undefined,
          },
        });
      }

      const updatedFaculty = await tx.faculty.update({
        where: { id },
        data: {
          employee_id: employee_id ? employee_id.trim() : undefined,
          department_id: department_id || undefined,
          designation: designation || undefined,
          qualification: qualification || undefined,
          office_room: office_room !== undefined ? (office_room ? String(office_room).trim() : null) : undefined,
        },
        include: {
          user: true,
          department: true,
        },
      });

      return updatedFaculty;
    });

    res.json({ message: 'Faculty updated successfully', faculty: updated });
  } catch (err: any) {
    console.error('[Update Faculty Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to update faculty' });
  }
});

app.patch('/api/v1/admin/faculty/:id/status', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const faculty: any = await prisma.faculty.findUnique({ where: { id: String(id) }, include: { user: true } });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found.' });

    const updatedUser = await prisma.user.update({
      where: { id: faculty.user_id },
      data: { is_active: !faculty.user.is_active },
    });

    res.json({ message: `Faculty status updated to ${updatedUser.is_active ? 'ACTIVE' : 'INACTIVE'}`, is_active: updatedUser.is_active });
  } catch (err: any) {
    console.error('[Toggle Faculty Status Error]:', err);
    res.status(500).json({ error: 'Failed to update faculty status' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEPARTMENTS CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/departments', async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { courses: true, faculties: true, students: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ departments });
  } catch (err: any) {
    console.error('[Get Departments Error]:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.post('/api/v1/admin/departments', async (req: Request, res: Response) => {
  const { code, name, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Department code and name are required.' });
  }

  try {
    const existing = await prisma.department.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: `Department code "${code.toUpperCase().trim()}" is already in use.` });
    }

    const dept = await prisma.department.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description ? description.trim() : null,
        is_active: true,
      },
    });

    res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (err: any) {
    console.error('[Create Department Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create department' });
  }
});

app.put('/api/v1/admin/departments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;

  try {
    const dept = await prisma.department.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
      },
    });
    res.json({ message: 'Department updated successfully', department: dept });
  } catch (err: any) {
    console.error('[Update Department Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to update department' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. COURSES CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/courses', async (req: Request, res: Response) => {
  try {
    const { department_id } = req.query;
    const courses = await prisma.course.findMany({
      where: department_id ? { department_id: String(department_id) } : undefined,
      include: {
        department: true,
        _count: { select: { semesters: true, students: true, subjects: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ courses });
  } catch (err: any) {
    console.error('[Get Courses Error]:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/api/v1/admin/courses', async (req: Request, res: Response) => {
  const { department_id, code, name, degree_type, total_semesters } = req.body;
  if (!department_id || !code || !name) {
    return res.status(400).json({ error: 'Department, course code, and course name are required.' });
  }

  try {
    const existing = await prisma.course.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: `Course code "${code.toUpperCase().trim()}" already exists.` });
    }

    const course = await prisma.course.create({
      data: {
        department_id,
        code: code.toUpperCase().trim(),
        name: name.trim(),
        degree_type: degree_type || 'B_TECH',
        total_semesters: total_semesters ? Number(total_semesters) : 8,
        is_active: true,
      },
      include: { department: true },
    });

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err: any) {
    console.error('[Create Course Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create course' });
  }
});

app.put('/api/v1/admin/courses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, department_id, degree_type, total_semesters, is_active } = req.body;

  try {
    const course = await prisma.course.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        department_id: department_id || undefined,
        degree_type: degree_type || undefined,
        total_semesters: total_semesters ? Number(total_semesters) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
      },
      include: { department: true },
    });
    res.json({ message: 'Course updated successfully', course });
  } catch (err: any) {
    console.error('[Update Course Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to update course' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. SEMESTERS CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/semesters', async (req: Request, res: Response) => {
  try {
    const { course_id } = req.query;
    const semesters = await prisma.semester.findMany({
      where: course_id ? { course_id: String(course_id) } : undefined,
      include: {
        course: { include: { department: true } },
        sections: true,
        _count: { select: { sections: true, students: true, subjects: true } },
      },
      orderBy: [{ academic_year: 'desc' }, { semester_number: 'asc' }],
    });
    res.json({ semesters });
  } catch (err: any) {
    console.error('[Get Semesters Error]:', err);
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

app.post('/api/v1/admin/semesters', async (req: Request, res: Response) => {
  const { course_id, semester_number, academic_year, is_current, start_date, end_date } = req.body;
  if (!course_id || !semester_number || !academic_year) {
    return res.status(400).json({ error: 'Course, semester number, and academic year are required.' });
  }

  try {
    const existing = await prisma.semester.findUnique({
      where: {
        course_id_semester_number_academic_year: {
          course_id,
          semester_number: Number(semester_number),
          academic_year: academic_year.trim(),
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: `Semester ${semester_number} for this course in ${academic_year} already exists.` });
    }

    const semester = await prisma.semester.create({
      data: {
        course_id,
        semester_number: Number(semester_number),
        academic_year: academic_year.trim(),
        is_current: is_current !== undefined ? Boolean(is_current) : true,
        start_date: start_date ? new Date(start_date) : new Date(),
        end_date: end_date ? new Date(end_date) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      include: { course: true },
    });

    res.status(201).json({ message: 'Semester created successfully', semester });
  } catch (err: any) {
    console.error('[Create Semester Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create semester' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECTIONS CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/sections', async (req: Request, res: Response) => {
  try {
    const { semester_id } = req.query;
    const sections = await prisma.section.findMany({
      where: semester_id ? { semester_id: String(semester_id) } : undefined,
      include: {
        semester: {
          include: { course: true },
        },
        _count: { select: { students: true, faculty_subjects: true, class_sessions: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ sections });
  } catch (err: any) {
    console.error('[Get Sections Error]:', err);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

app.post('/api/v1/admin/sections', async (req: Request, res: Response) => {
  const { semester_id, name, capacity, room_number } = req.body;
  if (!semester_id || !name) {
    return res.status(400).json({ error: 'Semester and Section name (e.g. A, B, C) are required.' });
  }

  try {
    const existing = await prisma.section.findUnique({
      where: {
        semester_id_name: {
          semester_id,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: `Section "${name.trim()}" already exists in this semester.` });
    }

    const section = await prisma.section.create({
      data: {
        semester_id,
        name: name.trim(),
        capacity: capacity ? Number(capacity) : 60,
        room_number: room_number ? room_number.trim() : null,
        is_active: true,
      },
      include: { semester: { include: { course: true } } },
    });

    res.status(201).json({ message: 'Section created successfully', section });
  } catch (err: any) {
    console.error('[Create Section Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create section' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUBJECTS CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/subjects', async (req: Request, res: Response) => {
  try {
    const { course_id, semester_id } = req.query;
    const subjects = await prisma.subject.findMany({
      where: {
        course_id: course_id ? String(course_id) : undefined,
        semester_id: semester_id ? String(semester_id) : undefined,
      },
      include: {
        course: true,
        semester: true,
        _count: { select: { faculty_subjects: true, student_subjects: true, class_sessions: true } },
      },
      orderBy: { code: 'asc' },
    });
    res.json({ subjects });
  } catch (err: any) {
    console.error('[Get Subjects Error]:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

app.post('/api/v1/admin/subjects', async (req: Request, res: Response) => {
  const { course_id, semester_id, code, name, subject_type, credits, total_hours } = req.body;
  if (!course_id || !code || !name) {
    return res.status(400).json({ error: 'Course, subject code, and subject name are required.' });
  }

  try {
    const existing = await prisma.subject.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: `Subject code "${code.toUpperCase().trim()}" is already registered.` });
    }

    const subject = await prisma.subject.create({
      data: {
        course_id,
        semester_id,
        code: code.toUpperCase().trim(),
        name: name.trim(),
        type: (subject_type as any) || 'THEORY',
        credit_hours: credits ? Number(credits) : 4,
        is_active: true,
      },
      include: { course: true, semester: true },
    });

    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (err: any) {
    console.error('[Create Subject Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to create subject' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. FACULTY SUBJECT ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/admin/faculty-subjects', async (_req: Request, res: Response) => {
  try {
    const assignments = await prisma.facultySubject.findMany({
      include: {
        faculty: { include: { user: true, department: true } },
        subject: { include: { course: true } },
        section: { include: { semester: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json({ assignments });
  } catch (err: any) {
    console.error('[Get Faculty Assignments Error]:', err);
    res.status(500).json({ error: 'Failed to fetch faculty subject assignments' });
  }
});

app.post('/api/v1/admin/faculty-subjects', async (req: Request, res: Response) => {
  const { faculty_id, subject_id, section_id, academic_year } = req.body;
  if (!faculty_id || !subject_id || !section_id) {
    return res.status(400).json({ error: 'Faculty, Subject, and Section are required.' });
  }

  const yr = academic_year || '2025-2026';

  try {
    const existing = await prisma.facultySubject.findUnique({
      where: {
        faculty_id_subject_id_section_id_academic_year: {
          faculty_id,
          subject_id,
          section_id,
          academic_year: yr,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'This faculty member is already assigned to this subject and section for this academic year.' });
    }

    const assignment = await prisma.facultySubject.create({
      data: {
        faculty_id,
        subject_id,
        section_id,
        academic_year: yr,
        is_primary: true,
      },
      include: {
        faculty: { include: { user: true } },
        subject: true,
        section: true,
      },
    });

    res.status(201).json({ message: 'Faculty assigned to subject successfully', assignment });
  } catch (err: any) {
    console.error('[Assign Faculty Subject Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to assign faculty to subject' });
  }
});

app.delete('/api/v1/admin/faculty-subjects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.facultySubject.delete({ where: { id } });
    res.json({ message: 'Faculty assignment removed successfully' });
  } catch (err: any) {
    console.error('[Delete Assignment Error]:', err);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// 9. Bulk Student Section Assignment
app.post('/api/v1/admin/students/bulk-assign-section', async (req: Request, res: Response) => {
  const { student_ids, section_id, semester_id, course_id, department_id } = req.body;

  if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0 || !section_id) {
    return res.status(400).json({ error: 'List of student IDs and target section ID are required.' });
  }

  try {
    const section = await prisma.section.findUnique({
      where: { id: section_id },
      include: { semester: { include: { course: true } } },
    });

    if (!section) {
      return res.status(404).json({ error: 'Target section not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      return tx.student.updateMany({
        where: { id: { in: student_ids } },
        data: {
          section_id,
          semester_id: semester_id || section.semester_id,
          course_id: course_id || section.semester.course_id,
          department_id: department_id || section.semester.course.department_id,
        },
      });
    });

    res.json({
      message: `Successfully assigned ${updated.count} student(s) to ${section.name}`,
      assigned_count: updated.count,
    });
  } catch (err: any) {
    console.error('[Bulk Assign Students Error]:', err);
    res.status(500).json({ error: 'Failed to assign students to section.' });
  }
});

// 10. System-Wide Attendance Overview (Admin Read-Only)
app.get('/api/v1/admin/attendance-overview', async (_req: Request, res: Response) => {
  try {
    const [
      totalSessions,
      activeSessions,
      finalizedSessions,
      cancelledSessions,
      totalPresent,
      totalAbsent,
    ] = await Promise.all([
      prisma.attendanceSession.count(),
      prisma.attendanceSession.count({ where: { status: 'ACTIVE' } }),
      prisma.attendanceSession.count({ where: { status: 'FINALIZED' } }),
      prisma.attendanceSession.count({ where: { status: 'CANCELLED' } }),
      prisma.attendance.count({ where: { status: 'PRESENT' } }),
      prisma.attendance.count({ where: { status: 'ABSENT' } }),
    ]);

    const totalRecords = totalPresent + totalAbsent;
    const overallRate = totalRecords > 0 ? Number(((totalPresent / totalRecords) * 100).toFixed(2)) : 0.0;

    res.json({
      totalSessions,
      activeSessions,
      finalizedSessions,
      cancelledSessions,
      totalPresent,
      totalAbsent,
      overallRate,
      isReadOnly: true,
    });
  } catch (err: any) {
    console.error('[Admin Attendance Overview Error]:', err);
    res.status(500).json({ error: 'Failed to fetch attendance overview.' });
  }
});

// 11. System Audit Logs (Append-Only)
app.get('/api/v1/admin/audit-logs', async (req: Request, res: Response) => {
  try {
    const { action, limit } = req.query;

    const logs = await prisma.attendanceAuditLog.findMany({
      where: action ? { action: action as any } : undefined,
      include: {
        user: { select: { id: true, full_name: true, email: true, role: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit ? Math.min(100, Number(limit)) : 50,
    });

    res.json({ logs });
  } catch (err: any) {
    console.error('[Get Audit Logs Error]:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

app.post('/api/v1/admin/audit-logs', async (req: Request, res: Response) => {
  const { performed_by, action, attendance_id, previous_status, new_status, reason, metadata } = req.body;

  if (!performed_by || !action || !new_status) {
    return res.status(400).json({ error: 'performed_by, action, and new_status are required.' });
  }

  try {
    const log = await prisma.attendanceAuditLog.create({
      data: {
        performed_by,
        action,
        attendance_id: attendance_id || 'system_event',
        previous_status: previous_status || null,
        new_status,
        reason: reason || null,
        metadata: metadata || null,
      },
    });

    res.status(201).json({ message: 'Audit log recorded', log });
  } catch (err: any) {
    console.error('[Create Audit Log Error]:', err);
    res.status(500).json({ error: 'Failed to create audit log.' });
  }
});

// 12. System Settings CRUD
app.get('/api/v1/admin/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });
    res.json({ settings });
  } catch (err: any) {
    console.error('[Get Settings Error]:', err);
    res.status(500).json({ error: 'Failed to fetch system settings.' });
  }
});

app.put('/api/v1/admin/settings/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  const { setting_value, description } = req.body;

  if (setting_value === undefined) {
    return res.status(400).json({ error: 'setting_value is required.' });
  }

  try {
    const setting = await prisma.systemSetting.upsert({
      where: { setting_key: key },
      update: {
        setting_value: String(setting_value),
        description: description !== undefined ? description : undefined,
      },
      create: {
        setting_key: key,
        setting_value: String(setting_value),
        category: 'GENERAL',
        description: description || null,
      },
    });

    res.json({ message: 'Setting updated successfully', setting });
  } catch (err: any) {
    console.error('[Update Setting Error]:', err);
    res.status(500).json({ error: 'Failed to update system setting.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5: FACULTY MODULE REST APIS (STRICT AUTHORIZATION ENFORCED)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to resolve faculty entity whether caller passed faculty.id or user.id
 */
async function resolveFaculty(idOrUserId: string) {
  let faculty = await prisma.faculty.findUnique({
    where: { id: idOrUserId },
    include: { user: true, department: true },
  });

  if (!faculty) {
    faculty = await prisma.faculty.findUnique({
      where: { user_id: idOrUserId },
      include: { user: true, department: true },
    });
  }

  return faculty;
}

// 1. Faculty Dashboard Stats
app.get('/api/v1/faculty/:facultyId/dashboard-stats', async (req: Request, res: Response) => {
  const { facultyId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    // Get all assignments for this faculty member
    const assignments = await prisma.facultySubject.findMany({
      where: { faculty_id: faculty.id },
      include: {
        section: true,
        subject: true,
      },
    });

    const uniqueSubjectIds = Array.from(new Set(assignments.map((a) => a.subject_id)));
    const uniqueSectionIds = Array.from(new Set(assignments.map((a) => a.section_id)));

    // Count students enrolled in those assigned sections
    const totalStudents = await prisma.student.count({
      where: {
        section_id: { in: uniqueSectionIds },
      },
    });

    // Count today's scheduled classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayClassesCount = await prisma.classSession.count({
      where: {
        faculty_id: faculty.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    res.json({
      assignedSubjectsCount: uniqueSubjectIds.length,
      assignedClassesCount: uniqueSectionIds.length,
      todayClassesCount,
      totalStudentsCount: totalStudents,
      faculty: {
        id: faculty.id,
        name: faculty.user.full_name,
        department: faculty.department.name,
      },
    });
  } catch (err: any) {
    console.error('[Faculty Dashboard Stats Error]:', err);
    res.status(500).json({ error: 'Failed to fetch faculty dashboard statistics.' });
  }
});

// 2. Faculty Assigned Subjects
app.get('/api/v1/faculty/:facultyId/subjects', async (req: Request, res: Response) => {
  const { facultyId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    const assignments = await prisma.facultySubject.findMany({
      where: { faculty_id: faculty.id },
      include: {
        subject: {
          include: {
            course: { include: { department: true } },
            semester: true,
          },
        },
        section: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Group sections by subject
    const subjectMap = new Map<string, any>();

    for (const asgn of assignments) {
      const subj = asgn.subject;
      if (!subj) continue;

      if (!subjectMap.has(subj.id)) {
        subjectMap.set(subj.id, {
          id: subj.id,
          code: subj.code,
          name: subj.name,
          credit_hours: subj.credit_hours,
          type: subj.type,
          department_name: subj.course?.department?.name || faculty.department.name,
          course_name: subj.course?.name || 'B.Tech',
          semester_number: subj.semester?.semester_number || 1,
          academic_year: asgn.academic_year,
          sections: [],
        });
      }

      if (asgn.section) {
        const item = subjectMap.get(subj.id);
        item.sections.push({
          id: asgn.section.id,
          name: asgn.section.name,
          capacity: asgn.section.capacity,
          room_number: asgn.section.room_number,
        });
      }
    }

    res.json({ subjects: Array.from(subjectMap.values()) });
  } catch (err: any) {
    console.error('[Faculty Subjects Error]:', err);
    res.status(500).json({ error: 'Failed to fetch assigned subjects.' });
  }
});

// 3. Faculty Assigned Classes / Sections
app.get('/api/v1/faculty/:facultyId/classes', async (req: Request, res: Response) => {
  const { facultyId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    const assignments = await prisma.facultySubject.findMany({
      where: { faculty_id: faculty.id },
      include: {
        section: {
          include: {
            semester: {
              include: {
                course: { include: { department: true } },
              },
            },
          },
        },
        subject: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // For each assigned class, calculate enrolled student count
    const classesWithStudentCounts = await Promise.all(
      assignments.map(async (asgn) => {
        const studentCount = await prisma.student.count({
          where: { section_id: asgn.section_id },
        });

        return {
          assignment_id: asgn.id,
          subject_id: asgn.subject_id,
          subject_code: asgn.subject.code,
          subject_name: asgn.subject.name,
          section_id: asgn.section_id,
          section_name: asgn.section.name,
          room_number: asgn.section.room_number,
          course_name: asgn.section.semester.course.name,
          department_name: asgn.section.semester.course.department.name,
          semester_number: asgn.section.semester.semester_number,
          academic_year: asgn.academic_year,
          student_count: studentCount,
          capacity: asgn.section.capacity,
        };
      })
    );

    res.json({ classes: classesWithStudentCounts });
  } catch (err: any) {
    console.error('[Faculty Classes Error]:', err);
    res.status(500).json({ error: 'Failed to fetch assigned classes.' });
  }
});

// 4. Faculty Authorized Students List
// STRICT AUTHORIZATION: Returns ONLY students enrolled in sections assigned to this faculty member.
app.get('/api/v1/faculty/:facultyId/students', async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const { section_id, subject_id, search } = req.query;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    // Step 1: Find all section IDs assigned to this faculty member
    const assignments = await prisma.facultySubject.findMany({
      where: { faculty_id: faculty.id },
      select: { section_id: true, subject_id: true },
    });

    if (assignments.length === 0) {
      return res.json({ students: [] });
    }

    let authorizedSectionIds = Array.from(new Set(assignments.map((a) => a.section_id)));

    // If section_id was filtered in query, verify faculty is assigned to it!
    if (section_id) {
      const secStr = String(section_id);
      if (!authorizedSectionIds.includes(secStr)) {
        return res.status(403).json({ error: 'Access denied: You are not assigned to this section.' });
      }
      authorizedSectionIds = [secStr];
    }

    // Step 2: Fetch students ONLY from the authorized section IDs
    const students = await prisma.student.findMany({
      where: {
        section_id: { in: authorizedSectionIds },
        OR: search
          ? [
              { roll_number: { contains: String(search), mode: 'insensitive' } },
              { register_number: { contains: String(search), mode: 'insensitive' } },
              { user: { full_name: { contains: String(search), mode: 'insensitive' } } },
              { user: { email: { contains: String(search), mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: {
        user: true,
        department: true,
        course: true,
        semester: true,
        section: true,
      },
      orderBy: { roll_number: 'asc' },
    });

    res.json({
      students: students.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        full_name: s.user.full_name,
        email: s.user.email,
        phone: s.user.phone,
        roll_number: s.roll_number,
        register_number: s.register_number,
        course_name: s.course.name,
        department_name: s.department.name,
        semester_number: s.semester.semester_number,
        section_name: s.section.name,
        section_id: s.section_id,
        is_active: s.user.is_active,
      })),
    });
  } catch (err: any) {
    console.error('[Faculty Students Error]:', err);
    res.status(500).json({ error: 'Failed to fetch authorized students.' });
  }
});

// 5. Verify Assignment Relationship (Backend Security Check)
app.get('/api/v1/faculty/:facultyId/verify-assignment', async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const { subject_id, section_id } = req.query;

  if (!subject_id || !section_id) {
    return res.status(400).json({ error: 'subject_id and section_id query parameters are required.' });
  }

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    const assignment = await prisma.facultySubject.findFirst({
      where: {
        faculty_id: faculty.id,
        subject_id: String(subject_id),
        section_id: String(section_id),
      },
      include: {
        subject: true,
        section: true,
      },
    });

    if (!assignment) {
      return res.status(403).json({
        authorized: false,
        error: 'Unauthorized: You are not assigned to teach this subject in this section.',
      });
    }

    res.json({
      authorized: true,
      assignment: {
        id: assignment.id,
        subject: assignment.subject,
        section: assignment.section,
        academic_year: assignment.academic_year,
      },
    });
  } catch (err: any) {
    console.error('[Verify Assignment Error]:', err);
    res.status(500).json({ error: 'Failed to verify assignment authorization.' });
  }
});

// 6. Faculty Profile
app.get('/api/v1/faculty/:facultyId/profile', async (req: Request, res: Response) => {
  const { facultyId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member not found.' });
    }

    res.json({
      faculty: {
        id: faculty.id,
        user_id: faculty.user_id,
        full_name: faculty.user.full_name,
        email: faculty.user.email,
        phone: faculty.user.phone,
        avatar_url: faculty.user.avatar_url,
        employee_id: faculty.employee_id,
        department_name: faculty.department.name,
        department_code: faculty.department.code,
        designation: faculty.designation,
        qualification: faculty.qualification,
        office_room: faculty.office_room,
        specialization: faculty.specialization,
        joining_date: faculty.joining_date,
        is_active: faculty.user.is_active,
      },
    });
  } catch (err: any) {
    console.error('[Faculty Profile Error]:', err);
    res.status(500).json({ error: 'Failed to fetch faculty profile.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6: DYNAMIC QR ATTENDANCE ENGINE & SECURE SESSION LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// 7. Create Attendance Session with Cryptographically Secure Token
app.post('/api/v1/faculty/:facultyId/attendance/sessions', async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const { subject_id, section_id, duration_seconds } = req.body;

  if (!subject_id || !section_id) {
    return res.status(400).json({ error: 'Subject and Section are required to start an attendance session.' });
  }

  const duration = duration_seconds ? Number(duration_seconds) : 60;
  if (isNaN(duration) || duration < 15 || duration > 600) {
    return res.status(400).json({ error: 'Attendance duration must be between 15 and 600 seconds.' });
  }

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member profile not found.' });
    }

    // Step 1: Strict Backend Authorization Check — Verify Faculty Subject Assignment
    const assignment = await prisma.facultySubject.findFirst({
      where: {
        faculty_id: faculty.id,
        subject_id: String(subject_id),
        section_id: String(section_id),
      },
      include: {
        subject: true,
        section: true,
      },
    });

    if (!assignment) {
      return res.status(403).json({
        error: 'Unauthorized: You are not authorized to conduct attendance for this subject and section cohort.',
      });
    }

    // Step 2: Prevent Multiple Simultaneous Active Sessions for the same subject & section
    const now = new Date();
    const existingActiveSession = await prisma.attendanceSession.findFirst({
      where: {
        faculty_id: faculty.id,
        status: 'ACTIVE',
        expires_at: { gt: now },
        class_session: {
          subject_id: String(subject_id),
          section_id: String(section_id),
        },
      },
      include: {
        class_session: {
          include: {
            subject: true,
            section: true,
          },
        },
      },
    });

    if (existingActiveSession) {
      return res.status(409).json({
        error: 'An attendance session is already active for this class.',
        session: {
          id: existingActiveSession.id,
          session_token: existingActiveSession.session_token,
          expires_at: existingActiveSession.expires_at,
          remaining_seconds: Math.max(0, Math.floor((new Date(existingActiveSession.expires_at).getTime() - now.getTime()) / 1000)),
        },
      });
    }

    // Step 3: Get or create ClassSession entry for today's lecture
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let classSession = await prisma.classSession.findFirst({
      where: {
        faculty_id: faculty.id,
        subject_id: String(subject_id),
        section_id: String(section_id),
        date: { gte: today, lt: tomorrow },
      },
    });

    if (!classSession) {
      classSession = await prisma.classSession.create({
        data: {
          faculty_id: faculty.id,
          subject_id: String(subject_id),
          section_id: String(section_id),
          date: today,
          start_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          end_time: new Date(Date.now() + duration * 1000).toLocaleTimeString('en-US', { hour12: false }),
          room: assignment.section.room_number || 'Main Lecture Hall',
          status: 'SCHEDULED',
        },
      });
    }

    // Step 4: Count enrolled students in section
    const totalEnrolled = await prisma.student.count({
      where: { section_id: String(section_id) },
    });

    // Step 5: Cryptographically Secure Random Token Generation
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const qrSecretKey = crypto.randomBytes(32).toString('hex');
    const qrPayloadHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const startTime = new Date();
    const expiresAt = new Date(startTime.getTime() + duration * 1000);

    const session = await prisma.attendanceSession.create({
      data: {
        class_session_id: classSession.id,
        faculty_id: faculty.id,
        session_token: sessionToken,
        qr_secret_key: qrSecretKey,
        qr_payload_hash: qrPayloadHash,
        qr_rotation_seconds: 15,
        start_time: startTime,
        expires_at: expiresAt,
        status: 'ACTIVE',
        total_enrolled: totalEnrolled,
        total_present: 0,
        total_absent: 0,
      },
      include: {
        class_session: {
          include: {
            subject: true,
            section: true,
          },
        },
        faculty: {
          include: { user: true },
        },
      },
    });

    const qrPayload = JSON.stringify({
      t: sessionToken,
      sid: session.id,
      sub: assignment.subject.code,
      sec: assignment.section.name,
      exp: expiresAt.toISOString(),
    });

    res.status(201).json({
      message: 'Attendance session created successfully',
      session: {
        id: session.id,
        session_token: session.session_token,
        start_time: session.start_time,
        expires_at: session.expires_at,
        duration_seconds: duration,
        status: session.status,
        total_enrolled: session.total_enrolled,
        subject: assignment.subject,
        section: assignment.section,
        faculty: {
          id: faculty.id,
          name: faculty.user.full_name,
        },
        qr_payload: qrPayload,
      },
    });
  } catch (err: any) {
    console.error('[Create Attendance Session Error]:', err);
    res.status(500).json({ error: 'Failed to create attendance session.' });
  }
});

/**
 * Helper: Atomic Attendance Session Finalization & Auto-Absent Engine
 * Wraps missing student identification, ABSENT record creation, and FINALIZED status update in a transaction.
 */
async function atomicFinalizeSession(sessionId: string, facultyId: string) {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class_session: {
          include: { subject: true, section: true },
        },
        faculty: { include: { user: true } },
      },
    });

    if (!session) {
      throw new Error('Attendance session not found.');
    }

    if (session.faculty_id !== facultyId) {
      throw new Error('Access denied: You do not own this attendance session.');
    }

    if (session.status === 'CANCELLED') {
      throw new Error('Cannot finalize a cancelled attendance session.');
    }

    // Idempotency: If already finalized, return summary directly without duplicate processing
    if (session.status === 'FINALIZED') {
      const attendances = await tx.attendance.findMany({
        where: { attendance_session_id: session.id },
        include: { student: { include: { user: true } } },
        orderBy: { student: { roll_number: 'asc' } },
      });
      return {
        session,
        attendances,
        total_enrolled: session.total_enrolled,
        total_present: session.total_present,
        total_absent: session.total_absent,
      };
    }

    // Step 1: Identify all students enrolled in the session's section
    const enrolledStudents = await tx.student.findMany({
      where: {
        section_id: session.class_session.section_id,
        is_active: true,
      },
      include: { user: true },
      orderBy: { roll_number: 'asc' },
    });

    // Step 2: Identify existing attendance records (e.g. PRESENT students)
    const existingAttendances = await tx.attendance.findMany({
      where: { attendance_session_id: session.id },
    });

    const presentStudentIds = new Set(existingAttendances.map((a) => a.student_id));

    // Step 3: Identify missing students who did not scan
    const missingStudents = enrolledStudents.filter((s) => !presentStudentIds.has(s.id));
    const now = new Date();

    // Step 4: Batch create ABSENT records for all missing students
    if (missingStudents.length > 0) {
      await tx.attendance.createMany({
        data: missingStudents.map((s) => ({
          attendance_session_id: session.id,
          student_id: s.id,
          status: 'ABSENT' as any,
          method: 'AUTO_ABSENT' as any,
          marked_at: now,
        })),
        skipDuplicates: true,
      });
    }

    const finalPresentCount = existingAttendances.filter((a) => a.status === 'PRESENT').length;
    const finalAbsentCount = missingStudents.length + existingAttendances.filter((a) => a.status === 'ABSENT').length;
    const finalTotalEnrolled = finalPresentCount + finalAbsentCount;

    // Step 5: Update AttendanceSession to FINALIZED
    const updatedSession = await tx.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: 'FINALIZED',
        finalized_at: now,
        end_time: session.end_time || now,
        total_present: finalPresentCount,
        total_absent: finalAbsentCount,
        total_enrolled: finalTotalEnrolled,
        auto_absent_processed: true,
      },
      include: {
        class_session: {
          include: { subject: true, section: true },
        },
        faculty: { include: { user: true } },
      },
    });

    const allAttendances = await tx.attendance.findMany({
      where: { attendance_session_id: session.id },
      include: { student: { include: { user: true } } },
      orderBy: { student: { roll_number: 'asc' } },
    });

    return {
      session: updatedSession,
      attendances: allAttendances,
      total_enrolled: finalTotalEnrolled,
      total_present: finalPresentCount,
      total_absent: finalAbsentCount,
    };
  });
}

// 8. Get Single Attendance Session (with Auto-Finalization on Expiry)
app.get('/api/v1/faculty/:facultyId/attendance/sessions/:sessionId', async (req: Request, res: Response) => {
  const { facultyId, sessionId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member profile not found.' });
    }

    let session: any = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class_session: {
          include: {
            subject: true,
            section: true,
          },
        },
        faculty: {
          include: { user: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Attendance session not found.' });
    }

    // Strict Session Ownership Check
    if (session.faculty_id !== faculty.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this attendance session.' });
    }

    // Authoritative Server-Side Expiration Check -> Auto-Finalize if Expired!
    let currentStatus = session.status;
    const now = new Date();
    if (session.status === 'ACTIVE' && now >= new Date(session.expires_at)) {
      const finalizedResult = await atomicFinalizeSession(session.id, faculty.id);
      session = finalizedResult.session as any;
      currentStatus = 'FINALIZED';
    }

    const remainingSeconds = Math.max(0, Math.floor((new Date(session.expires_at).getTime() - now.getTime()) / 1000));

    const qrPayload = JSON.stringify({
      t: session.session_token,
      sid: session.id,
      sub: session.class_session.subject.code,
      sec: session.class_session.section.name,
      exp: session.expires_at.toISOString(),
    });

    res.json({
      session: {
        id: session.id,
        session_token: session.session_token,
        start_time: session.start_time,
        expires_at: session.expires_at,
        remaining_seconds: currentStatus === 'ACTIVE' ? remainingSeconds : 0,
        status: currentStatus,
        total_enrolled: session.total_enrolled,
        total_present: session.total_present,
        total_absent: session.total_absent,
        subject: session.class_session.subject,
        section: session.class_session.section,
        faculty: {
          id: faculty.id,
          name: faculty.user.full_name,
        },
        qr_payload: currentStatus === 'ACTIVE' ? qrPayload : null,
      },
    });
  } catch (err: any) {
    console.error('[Get Attendance Session Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance session.' });
  }
});

// 9. Finalize Attendance Session (Close & Auto-Mark ABSENT)
app.post('/api/v1/faculty/:facultyId/attendance/sessions/:sessionId/finalize', async (req: Request, res: Response) => {
  const { facultyId, sessionId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member profile not found.' });
    }

    const result = await atomicFinalizeSession(sessionId, faculty.id);

    res.json({
      message: 'Attendance session finalized successfully',
      session: result.session,
      total_enrolled: result.total_enrolled,
      total_present: result.total_present,
      total_absent: result.total_absent,
      attendances: result.attendances.map((a) => ({
        id: a.id,
        student_id: a.student_id,
        student_name: a.student.user.full_name,
        roll_number: a.student.roll_number,
        status: a.status,
        method: a.method,
        marked_at: a.marked_at,
      })),
    });
  } catch (err: any) {
    console.error('[Finalize Attendance Session Error]:', err);
    res.status(400).json({ error: err.message || 'Failed to finalize attendance session.' });
  }
});

// 10. Get Attendance Session Summary (with Search Query Filter)
app.get('/api/v1/faculty/:facultyId/attendance/sessions/:sessionId/summary', async (req: Request, res: Response) => {
  const { facultyId, sessionId } = req.params;
  const { q } = req.query;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member profile not found.' });
    }

    const session: any = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        class_session: {
          include: { subject: true, section: true },
        },
        faculty: { include: { user: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Attendance session not found.' });
    }

    if (session.faculty_id !== faculty.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this attendance session.' });
    }

    const allAttendances = await prisma.attendance.findMany({
      where: { attendance_session_id: session.id },
      include: { student: { include: { user: true } } },
      orderBy: { student: { roll_number: 'asc' } },
    });

    const presentCount = allAttendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = allAttendances.filter((a) => a.status === 'ABSENT').length;
    const totalEnrolled = allAttendances.length;

    // Filter by student name or roll number if query string provided
    let filteredAttendances = allAttendances;
    if (q && typeof q === 'string' && q.trim().length > 0) {
      const searchLower = q.trim().toLowerCase();
      filteredAttendances = allAttendances.filter(
        (a) =>
          a.student.user.full_name.toLowerCase().includes(searchLower) ||
          a.student.roll_number.toLowerCase().includes(searchLower) ||
          a.student.register_number.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      session: {
        id: session.id,
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time,
        finalized_at: session.finalized_at,
        subject: session.class_session.subject,
        section: session.class_session.section,
        total_enrolled: totalEnrolled,
        total_present: presentCount,
        total_absent: absentCount,
      },
      roster: filteredAttendances.map((a) => ({
        id: a.id,
        student_id: a.student_id,
        student_name: a.student.user.full_name,
        roll_number: a.student.roll_number,
        register_number: a.student.register_number,
        status: a.status,
        method: a.method,
        marked_at: a.marked_at,
      })),
    });
  } catch (err: any) {
    console.error('[Get Session Summary Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance session summary.' });
  }
});

// 11. List All Attendance Sessions for Faculty History (with Multi-Filters)
app.get('/api/v1/faculty/:facultyId/attendance/sessions', async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const { subject_id, section_id, status, date_range, date_from, date_to } = req.query;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member profile not found.' });
    }

    const whereClause: any = { faculty_id: faculty.id };

    if (subject_id) {
      whereClause.class_session = { ...whereClause.class_session, subject_id: String(subject_id) };
    }

    if (section_id) {
      whereClause.class_session = { ...whereClause.class_session, section_id: String(section_id) };
    }

    if (status && ['ACTIVE', 'EXPIRED', 'FINALIZED', 'CANCELLED'].includes(String(status))) {
      whereClause.status = status;
    }

    // Date Range filtering
    if (date_range === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.start_time = { gte: startOfDay };
    } else if (date_range === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      whereClause.start_time = { gte: startOfWeek };
    } else if (date_range === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(startOfMonth.getDate() - 30);
      whereClause.start_time = { gte: startOfMonth };
    } else if (date_from && date_to) {
      whereClause.start_time = {
        gte: new Date(String(date_from)),
        lte: new Date(new Date(String(date_to)).setHours(23, 59, 59, 999)),
      };
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        class_session: {
          include: {
            subject: true,
            section: true,
          },
        },
      },
      orderBy: { start_time: 'desc' },
    });

    res.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        session_token: s.session_token,
        start_time: s.start_time,
        end_time: s.end_time,
        expires_at: s.expires_at,
        finalized_at: s.finalized_at,
        status: s.status,
        total_enrolled: s.total_enrolled,
        total_present: s.total_present,
        total_absent: s.total_absent,
        subject_id: s.class_session.subject_id,
        subject_name: s.class_session.subject.name,
        subject_code: s.class_session.subject.code,
        section_name: s.class_session.section.name,
        section_id: s.class_session.section_id,
      })),
    });
  } catch (err: any) {
    console.error('[List Faculty Sessions Error]:', err);
    res.status(500).json({ error: 'Failed to fetch faculty attendance sessions.' });
  }
});

// 12. Faculty Subjects & Classes Attendance Summary Stats
app.get('/api/v1/faculty/:facultyId/subjects/summary', async (req: Request, res: Response) => {
  const { facultyId } = req.params;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member profile not found.' });
    }

    const assignments = await prisma.facultySubject.findMany({
      where: { faculty_id: faculty.id },
      include: {
        subject: true,
        section: true,
      },
    });

    const summaries = await Promise.all(
      assignments.map(async (a) => {
        const sessions = await prisma.attendanceSession.findMany({
          where: {
            faculty_id: faculty.id,
            status: 'FINALIZED',
            class_session: {
              subject_id: a.subject_id,
              section_id: a.section_id,
            },
          },
        });

        const totalEnrolled = await prisma.student.count({
          where: { section_id: a.section_id, is_active: true },
        });

        const totalSessions = sessions.length;
        const totalPresentSum = sessions.reduce((acc, s) => acc + s.total_present, 0);
        const totalPossibleSum = sessions.reduce((acc, s) => acc + s.total_enrolled, 0);

        const averageAttendance =
          totalPossibleSum > 0 ? Number(((totalPresentSum / totalPossibleSum) * 100).toFixed(1)) : 100.0;

        return {
          assignment_id: a.id,
          subject_id: a.subject_id,
          subject_code: a.subject.code,
          subject_name: a.subject.name,
          section_id: a.section_id,
          section_name: a.section.name,
          total_sessions: totalSessions,
          total_enrolled: totalEnrolled,
          average_attendance_percentage: averageAttendance,
        };
      })
    );

    res.json({ summaries });
  } catch (err: any) {
    console.error('[Faculty Subjects Summary Error]:', err);
    res.status(500).json({ error: 'Failed to fetch faculty subject summaries.' });
  }
});

// 14. Student Attendance History Logs (with Subject & Status Filter)
app.get('/api/v1/student/:userId/attendance-history', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { subject_id, status } = req.query;

  try {
    const student = await prisma.student.findUnique({
      where: { user_id: String(userId) },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const whereClause: any = { student_id: student.id };

    if (status && ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(String(status))) {
      whereClause.status = status;
    }

    if (subject_id) {
      whereClause.attendance_session = {
        class_session: {
          subject_id: String(subject_id),
        },
      };
    }

    const history = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        attendance_session: {
          include: {
            faculty: { include: { user: true } },
            class_session: {
              include: {
                subject: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { marked_at: 'desc' },
    });

    res.json({
      history: history.map((h) => ({
        id: h.id,
        session_id: h.attendance_session_id,
        status: h.status,
        method: h.method,
        marked_at: h.marked_at,
        subject_id: h.attendance_session.class_session.subject_id,
        subject_name: h.attendance_session.class_session.subject.name,
        subject_code: h.attendance_session.class_session.subject.code,
        section_name: h.attendance_session.class_session.section.name,
        faculty_name: h.attendance_session.faculty.user.full_name,
      })),
    });
  } catch (err: any) {
    console.error('[Student Attendance History Error]:', err);
    res.status(500).json({ error: 'Failed to fetch student attendance history.' });
  }
});

// 15. Student Attendance Statistical Summary (Overall + Subject-Wise)
app.get('/api/v1/student/:userId/attendance-summary', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { user_id: String(userId) },
      include: {
        section: true,
        semester: true,
        course: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const allAttendanceRecords = await prisma.attendance.findMany({
      where: { student_id: student.id },
      include: {
        attendance_session: {
          include: {
            class_session: {
              include: { subject: true },
            },
          },
        },
      },
    });

    const totalSessions = allAttendanceRecords.length;
    const totalPresent = allAttendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const totalAbsent = allAttendanceRecords.filter((a) => a.status === 'ABSENT').length;
    const overallPercentage =
      totalSessions > 0 ? Number(((totalPresent / totalSessions) * 100).toFixed(1)) : null;

    // Subject-Wise Grouping
    const subjectMap: Record<
      string,
      {
        subject_id: string;
        subject_name: string;
        subject_code: string;
        total_classes: number;
        attended_classes: number;
        absent_classes: number;
      }
    > = {};

    allAttendanceRecords.forEach((a) => {
      const sub = a.attendance_session.class_session.subject;
      if (!subjectMap[sub.id]) {
        subjectMap[sub.id] = {
          subject_id: sub.id,
          subject_name: sub.name,
          subject_code: sub.code,
          total_classes: 0,
          attended_classes: 0,
          absent_classes: 0,
        };
      }
      subjectMap[sub.id].total_classes++;
      if (a.status === 'PRESENT') {
        subjectMap[sub.id].attended_classes++;
      } else {
        subjectMap[sub.id].absent_classes++;
      }
    });

    const subjectBreakdown = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage: s.total_classes > 0 ? Number(((s.attended_classes / s.total_classes) * 100).toFixed(1)) : 0,
    }));

    res.json({
      summary: {
        total_sessions: totalSessions,
        total_present: totalPresent,
        total_absent: totalAbsent,
        overall_percentage: overallPercentage,
        has_records: totalSessions > 0,
      },
      subjectBreakdown,
    });
  } catch (err: any) {
    console.error('[Student Attendance Summary Error]:', err);
    res.status(500).json({ error: 'Failed to compute student attendance summary.' });
  }
});

// 12. Cancel Attendance Session
app.patch('/api/v1/faculty/:facultyId/attendance/sessions/:sessionId/cancel', async (req: Request, res: Response) => {
  const { facultyId, sessionId } = req.params;
  const { reason } = req.body;

  try {
    const faculty = await resolveFaculty(facultyId);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty member not found.' });
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Attendance session not found.' });
    }

    if (session.faculty_id !== faculty.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this attendance session.' });
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        cancelled_reason: reason || 'Cancelled by faculty member',
        end_time: new Date(),
      },
    });

    res.json({ message: 'Attendance session cancelled successfully', session: updated });
  } catch (err: any) {
    console.error('[Cancel Attendance Session Error]:', err);
    res.status(500).json({ error: 'Failed to cancel attendance session.' });
  }
});

// 13. Public Session Token Validator (For Future Phase 7 QR Scanners)
app.get('/api/v1/attendance/validate-session', async (req: Request, res: Response) => {
  const { session_token } = req.query;

  if (!session_token) {
    return res.status(400).json({ valid: false, error: 'Session token parameter is required.' });
  }

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { session_token: String(session_token) },
      include: {
        class_session: {
          include: {
            subject: true,
            section: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ valid: false, error: 'Invalid or unrecognized attendance QR session.' });
    }

    const now = new Date();
    if (session.status !== 'ACTIVE' || now >= new Date(session.expires_at)) {
      return res.status(410).json({
        valid: false,
        status: session.status === 'ACTIVE' ? 'EXPIRED' : session.status,
        error: `This attendance QR session is ${session.status === 'ACTIVE' ? 'EXPIRED' : session.status.toLowerCase()}. Scanning is closed.`,
      });
    }

    res.json({
      valid: true,
      sessionId: session.id,
      subject_name: session.class_session.subject.name,
      section_name: session.class_session.section.name,
      expires_at: session.expires_at,
    });
  } catch (err: any) {
    console.error('[Validate Session Error]:', err);
    res.status(500).json({ valid: false, error: 'Failed to validate attendance session.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7: STUDENT QR SCANNER & REAL-TIME ATTENDANCE MARKING
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// 12. Student Attendance QR Scan & Record Creation
app.post('/api/v1/student/scan-attendance', async (req: Request, res: Response) => {
  const { user_id, qr_payload, ip_address, device_info, geo_latitude, geo_longitude } = req.body;

  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required. Missing user identifier.' });
  }

  if (!qr_payload) {
    return res.status(400).json({ error: 'Invalid attendance QR code. Payload is required.' });
  }

  try {
    // CHECK 1 & 2: Validate Student Identity & Role from Database
    const student = await prisma.student.findUnique({
      where: { user_id: String(user_id) },
      include: {
        user: true,
        section: true,
        semester: true,
        course: true,
      },
    });

    if (!student || student.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Access denied: Only verified students can mark attendance.' });
    }

    if (!student.user.is_active || !student.is_active) {
      return res.status(403).json({ error: 'Access denied: Your student account is inactive.' });
    }

    // Parse Scanned QR Payload
    let token = String(qr_payload).trim();
    let sessionId: string | null = null;

    try {
      if (qr_payload.startsWith('{')) {
        const parsed = JSON.parse(qr_payload);
        token = parsed.t || parsed.session_token || token;
        sessionId = parsed.sid || parsed.sessionId || null;
      }
    } catch {
      // Raw string token fallback
    }

    // CHECK 3 & 4: Retrieve Attendance Session from Database
    let session = await prisma.attendanceSession.findFirst({
      where: sessionId
        ? { OR: [{ session_token: token }, { id: sessionId }] }
        : { session_token: token },
      include: {
        class_session: {
          include: {
            subject: true,
            section: true,
          },
        },
        faculty: {
          include: { user: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Invalid attendance QR code.' });
    }

    // CHECK 5: Session Status Lifecycle Check
    if (session.status === 'EXPIRED') {
      return res.status(410).json({ error: 'This attendance session has expired.' });
    }
    if (session.status === 'CANCELLED') {
      return res.status(410).json({ error: 'This attendance session has been cancelled.' });
    }
    if (session.status === 'FINALIZED') {
      return res.status(410).json({ error: 'Attendance for this session is closed.' });
    }
    if (session.status !== 'ACTIVE') {
      return res.status(410).json({ error: 'Attendance for this session is closed.' });
    }

    // CHECK 6: Authoritative Server-Side Expiration Check
    const now = new Date();
    if (now >= new Date(session.expires_at)) {
      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: 'EXPIRED',
          end_time: now,
        },
      });
      return res.status(410).json({ error: 'This attendance session has expired.' });
    }

    // CHECK 7 & 8: Verify Student Belongs to the Exact Class / Section
    if (student.section_id !== session.class_session.section_id) {
      return res.status(403).json({ error: 'You are not enrolled in this class.' });
    }

    // CHECK 9 & 11: Duplicate Scan Prevention (Application + Database Constraint)
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        attendance_session_id_student_id: {
          attendance_session_id: session.id,
          student_id: student.id,
        },
      },
    });

    if (existingAttendance) {
      return res.status(409).json({ error: 'Attendance has already been marked for this session.' });
    }

    // Step 10: Create PRESENT Attendance Record in Database
    const clientIp = ip_address || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const userAgent = (req.headers['user-agent'] as string) || null;

    const attendance = await prisma.attendance.create({
      data: {
        attendance_session_id: session.id,
        student_id: student.id,
        status: 'PRESENT',
        method: 'QR_SCAN',
        marked_at: now,
        ip_address: typeof clientIp === 'string' ? clientIp.slice(0, 45) : null,
        device_info: device_info ? String(device_info).slice(0, 100) : null,
        geo_latitude: geo_latitude !== undefined && geo_latitude !== null ? Number(geo_latitude) : null,
        geo_longitude: geo_longitude !== undefined && geo_longitude !== null ? Number(geo_longitude) : null,
        user_agent: userAgent ? userAgent.slice(0, 255) : null,
      },
    });

    // Increment Total Present Counter
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        total_present: { increment: 1 },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: {
        id: attendance.id,
        status: attendance.status,
        marked_at: attendance.marked_at,
        subject_name: session.class_session.subject.name,
        subject_code: session.class_session.subject.code,
        section_name: session.class_session.section.name,
        student_name: student.user.full_name,
        roll_number: student.roll_number,
      },
    });
  } catch (err: any) {
    console.error('[Student Attendance Scan Error]:', err);
    // Graceful handling of DB-level unique constraint collision
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Attendance has already been marked for this session.' });
    }
    res.status(500).json({ error: 'Unable to connect and mark attendance. Please try again.' });
  }
});

// 13. Student Dashboard Overview Stats
app.get('/api/v1/student/:userId/dashboard-stats', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { user_id: String(userId) },
      include: {
        user: true,
        section: true,
        semester: true,
        course: true,
        department: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const recentAttendance = await prisma.attendance.findMany({
      where: { student_id: student.id },
      include: {
        attendance_session: {
          include: {
            class_session: {
              include: {
                subject: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { marked_at: 'desc' },
      take: 10,
    });

    res.json({
      student: {
        id: student.id,
        user_id: student.user_id,
        full_name: student.user.full_name,
        email: student.user.email,
        roll_number: student.roll_number,
        register_number: student.register_number,
        course_name: student.course.name,
        department_name: student.department.name,
        semester_number: student.semester.semester_number,
        section_name: student.section.name,
        section_id: student.section_id,
      },
      recentAttendance: recentAttendance.map((a) => ({
        id: a.id,
        status: a.status,
        marked_at: a.marked_at,
        method: a.method,
        subject_name: a.attendance_session.class_session.subject.name,
        subject_code: a.attendance_session.class_session.subject.code,
        section_name: a.attendance_session.class_session.section.name,
      })),
    });
  } catch (err: any) {
    console.error('[Student Dashboard Stats Error]:', err);
    res.status(500).json({ error: 'Failed to fetch student dashboard statistics.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 10: ATTENDANCE REPORTS & EXPORT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

// Helper function to build authorized attendance report data
async function generateAuthorizedReport(facultyId: string, filters: {
  subject_id?: string;
  section_id?: string;
  student_id?: string;
  date_range?: string;
  date_from?: string;
  date_to?: string;
  threshold?: number;
  status?: string;
}) {
  const faculty = await resolveFaculty(facultyId);
  if (!faculty) {
    throw { status: 404, message: 'Faculty member profile not found.' };
  }

  // 1. Authorization verification for subject / section
  if (filters.subject_id) {
    const isAssigned = await prisma.facultySubject.findFirst({
      where: {
        faculty_id: faculty.id,
        subject_id: String(filters.subject_id),
      },
    });

    if (!isAssigned) {
      throw { status: 403, message: 'Access denied: You are not authorized to generate reports for this subject.' };
    }
  }

  // 2. Validate custom date bounds
  if (filters.date_from && filters.date_to) {
    const dFrom = new Date(filters.date_from);
    const dTo = new Date(filters.date_to);
    if (dFrom > dTo) {
      throw { status: 400, message: 'Invalid date range: Start date must be before or equal to end date.' };
    }
  }

  // 3. Build where clause: strictly FINALIZED attendance sessions
  const whereClause: any = {
    faculty_id: faculty.id,
    status: 'FINALIZED', // STRICTLY FINALIZED SESSIONS ONLY
  };

  if (filters.subject_id) {
    whereClause.class_session = { ...whereClause.class_session, subject_id: String(filters.subject_id) };
  }

  if (filters.section_id) {
    whereClause.class_session = { ...whereClause.class_session, section_id: String(filters.section_id) };
  }

  // Date Range Filtering
  if (filters.date_range === 'today') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    whereClause.start_time = { gte: startOfDay };
  } else if (filters.date_range === 'week') {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    whereClause.start_time = { gte: startOfWeek };
  } else if (filters.date_range === 'month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    whereClause.start_time = { gte: startOfMonth };
  } else if (filters.date_from && filters.date_to) {
    whereClause.start_time = {
      gte: new Date(filters.date_from),
      lte: new Date(new Date(filters.date_to).setHours(23, 59, 59, 999)),
    };
  }

  // 4. Retrieve Finalized Sessions
  const sessions = await prisma.attendanceSession.findMany({
    where: whereClause,
    include: {
      class_session: {
        include: {
          subject: true,
          section: true,
        },
      },
      attendances: {
        include: {
          student: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { start_time: 'asc' },
  });

  const sessionIds = sessions.map((s) => s.id);
  const targetSectionIds = Array.from(new Set(sessions.map((s) => s.class_session.section_id)));

  // If no sessions found but section selected, query section's enrolled students
  let sectionIdsToQuery = targetSectionIds;
  if (sectionIdsToQuery.length === 0 && filters.section_id) {
    sectionIdsToQuery = [filters.section_id];
  }

  // 5. Query Enrolled Students in target sections
  const enrolledStudents = sectionIdsToQuery.length > 0
    ? await prisma.student.findMany({
        where: {
          section_id: { in: sectionIdsToQuery },
          is_active: true,
        },
        include: { user: true, section: true },
        orderBy: { roll_number: 'asc' },
      })
    : [];

  const thresholdValue = Number(filters.threshold) || 75.0;

  // 6. Compute Student-Wise Records
  const studentMap: Record<string, {
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
  }> = {};

  // Initialize all enrolled students (including zero-attendance students)
  enrolledStudents.forEach((st) => {
    studentMap[st.id] = {
      student_id: st.id,
      student_name: st.user.full_name,
      roll_number: st.roll_number,
      register_number: st.register_number || st.roll_number,
      section_name: st.section.name,
      total_sessions: sessions.length,
      present_count: 0,
      absent_count: sessions.length, // Defaults to all absent if 0 present
      percentage: 0.0,
      is_low_attendance: sessions.length > 0,
    };
  });

  // Accumulate attendance marks from finalized sessions
  sessions.forEach((s) => {
    s.attendances.forEach((a) => {
      if (studentMap[a.student_id]) {
        if (a.status === 'PRESENT') {
          studentMap[a.student_id].present_count++;
        }
      }
    });
  });

  // Calculate percentages
  Object.values(studentMap).forEach((st) => {
    st.absent_count = Math.max(0, st.total_sessions - st.present_count);
    st.percentage = st.total_sessions > 0
      ? Number(((st.present_count / st.total_sessions) * 100).toFixed(2))
      : 0.0;
    st.is_low_attendance = st.total_sessions > 0 && st.percentage < thresholdValue;
  });

  let studentList = Object.values(studentMap);

  // Filter by single student if requested
  if (filters.student_id) {
    studentList = studentList.filter((s) => s.student_id === filters.student_id);
  }

  // Filter by status if requested (e.g. LOW_ATTENDANCE)
  if (filters.status === 'LOW_ATTENDANCE') {
    studentList = studentList.filter((s) => s.is_low_attendance);
  }

  const lowAttendanceStudents = studentList.filter((s) => s.is_low_attendance);

  // 7. Aggregate Summary Totals
  const totalStudents = studentList.length;
  const totalSessionsCount = sessions.length;
  const totalPresentCount = studentList.reduce((acc, s) => acc + s.present_count, 0);
  const totalAbsentCount = studentList.reduce((acc, s) => acc + s.absent_count, 0);
  const totalPossibleMarks = totalPresentCount + totalAbsentCount;
  const overallPercentage = totalPossibleMarks > 0
    ? Number(((totalPresentCount / totalPossibleMarks) * 100).toFixed(2))
    : 0.0;

  // 8. Session-wise breakdown
  const sessionList = sessions.map((s) => ({
    id: s.id,
    date: s.start_time,
    subject_code: s.class_session.subject.code,
    subject_name: s.class_session.subject.name,
    section_name: s.class_session.section.name,
    total_enrolled: s.total_enrolled,
    total_present: s.total_present,
    total_absent: s.total_absent,
    turnout_percentage: s.total_enrolled > 0
      ? Number(((s.total_present / s.total_enrolled) * 100).toFixed(2))
      : 0.0,
  }));

  // Retrieve subject & section details for header
  let subjectDetail: any = null;
  let sectionDetail: any = null;
  if (filters.subject_id) {
    subjectDetail = await prisma.subject.findUnique({ where: { id: filters.subject_id } });
  }
  if (filters.section_id) {
    sectionDetail = await prisma.section.findUnique({ where: { id: filters.section_id } });
  }

  return {
    summary: {
      total_students: totalStudents,
      total_sessions: totalSessionsCount,
      total_present: totalPresentCount,
      total_absent: totalAbsentCount,
      overall_percentage: overallPercentage,
      threshold: thresholdValue,
      low_attendance_count: lowAttendanceStudents.length,
      has_data: totalSessionsCount > 0 && totalStudents > 0,
    },
    students: studentList,
    low_attendance_students: lowAttendanceStudents,
    sessions: sessionList,
    metadata: {
      generated_at: new Date().toISOString(),
      faculty_name: faculty.user.full_name,
      subject_name: subjectDetail ? subjectDetail.name : 'All Assigned Subjects',
      subject_code: subjectDetail ? subjectDetail.code : 'ALL',
      section_name: sectionDetail ? sectionDetail.name : 'All Sections',
      date_range: filters.date_range || (filters.date_from && filters.date_to ? `${filters.date_from} to ${filters.date_to}` : 'All Time'),
      threshold: thresholdValue,
    },
  };
}

// 1. Generate Attendance Report API
app.post('/api/v1/faculty/:facultyId/reports/generate', async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const filters = req.body;

  try {
    const reportData = await generateAuthorizedReport(facultyId, filters);
    res.json({ report: reportData });
  } catch (err: any) {
    console.error('[Generate Attendance Report Error]:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to generate attendance report.' });
  }
});

// 2. Export Attendance Report as CSV API
app.get('/api/v1/faculty/:facultyId/reports/export-csv', async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const { subject_id, section_id, student_id, date_range, date_from, date_to, threshold, status } = req.query;

  try {
    const reportData = await generateAuthorizedReport(facultyId, {
      subject_id: subject_id ? String(subject_id) : undefined,
      section_id: section_id ? String(section_id) : undefined,
      student_id: student_id ? String(student_id) : undefined,
      date_range: date_range ? String(date_range) : undefined,
      date_from: date_from ? String(date_from) : undefined,
      date_to: date_to ? String(date_to) : undefined,
      threshold: threshold ? Number(threshold) : undefined,
      status: status ? String(status) : undefined,
    });

    // Generate RFC-4180 CSV Header & Rows
    const csvRows = [
      ['Student Name', 'University Roll No', 'Registration No', 'Section', 'Total Sessions', 'Present Count', 'Absent Count', 'Attendance Percentage (%)', 'Attendance Status'],
      ...reportData.students.map((s) => [
        `"${s.student_name.replace(/"/g, '""')}"`,
        `"${s.roll_number}"`,
        `"${s.register_number}"`,
        `"${s.section_name}"`,
        s.total_sessions,
        s.present_count,
        s.absent_count,
        `${s.percentage}%`,
        s.is_low_attendance ? 'SHORTAGE (< Threshold)' : 'ELIGIBLE',
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('[Export CSV Error]:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to export attendance report as CSV.' });
  }
});

// 3. Student Individual Attendance Report API
app.get('/api/v1/student/:userId/report', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { user_id: String(userId) },
      include: {
        user: true,
        section: true,
        semester: true,
        course: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        student_id: student.id,
        attendance_session: { status: 'FINALIZED' }, // FINALIZED ONLY
      },
      include: {
        attendance_session: {
          include: {
            faculty: { include: { user: true } },
            class_session: {
              include: {
                subject: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: { marked_at: 'desc' },
    });

    const totalSessions = attendances.length;
    const totalPresent = attendances.filter((a) => a.status === 'PRESENT').length;
    const totalAbsent = attendances.filter((a) => a.status === 'ABSENT').length;
    const overallPercentage = totalSessions > 0
      ? Number(((totalPresent / totalSessions) * 100).toFixed(2))
      : null;

    // Group by subject
    const subjectMap: Record<string, {
      subject_id: string;
      subject_name: string;
      subject_code: string;
      total: number;
      present: number;
      absent: number;
      percentage: number;
    }> = {};

    attendances.forEach((a) => {
      const sub = a.attendance_session.class_session.subject;
      if (!subjectMap[sub.id]) {
        subjectMap[sub.id] = {
          subject_id: sub.id,
          subject_name: sub.name,
          subject_code: sub.code,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
        };
      }
      subjectMap[sub.id].total++;
      if (a.status === 'PRESENT') {
        subjectMap[sub.id].present++;
      } else {
        subjectMap[sub.id].absent++;
      }
    });

    const subjects = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(2)) : 0,
    }));

    res.json({
      report: {
        student: {
          id: student.id,
          full_name: student.user.full_name,
          roll_number: student.roll_number,
          register_number: student.register_number,
          course: student.course.name,
          section: student.section.name,
        },
        summary: {
          total_sessions: totalSessions,
          total_present: totalPresent,
          total_absent: totalAbsent,
          overall_percentage: overallPercentage,
          is_eligible: overallPercentage !== null && overallPercentage >= 75.0,
        },
        subjects,
        history: attendances.map((a) => ({
          id: a.id,
          date: a.marked_at,
          subject_name: a.attendance_session.class_session.subject.name,
          subject_code: a.attendance_session.class_session.subject.code,
          faculty_name: a.attendance_session.faculty.user.full_name,
          status: a.status,
          method: a.method,
        })),
      },
    });
  } catch (err: any) {
    console.error('[Student Report Error]:', err);
    res.status(500).json({ error: 'Failed to generate student attendance report.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AttendX Server] Phase 4 — Admin Module API active on port ${PORT}`);
  });
}

export default app;
