import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { userService, academicService } from '../../services';
import { StudentProfile, Department, Course, Semester, Section } from '../../types';
import {
  Search,
  UserPlus,
  Edit2,
  Power,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [deptId, setDeptId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stdList, depts, crss, sems, secs] = await Promise.all([
        userService.getAllStudents({ department_id: filterDept, course_id: filterCourse, search }),
        academicService.getDepartments(),
        academicService.getCourses(),
        academicService.getSemesters(),
        academicService.getSections(),
      ]);
      setStudents(stdList);
      setDepartments(depts);
      setCourses(crss);
      setSemesters(sems);
      setSections(secs);

      if (!deptId && depts.length > 0) setDeptId(depts[0].id);
      if (!courseId && crss.length > 0) setCourseId(crss[0].id);
      if (!semesterId && sems.length > 0) setSemesterId(sems[0].id);
      if (!sectionId && secs.length > 0) setSectionId(secs[0].id);
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDept, filterCourse, search]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPassword('password123');
    setPhone('');
    setRollNumber('');
    setRegisterNumber('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: StudentProfile) => {
    setIsEditing(true);
    setEditingId(student.id);
    setFullName(student.user?.full_name || '');
    setEmail(student.user?.email || '');
    setPhone(student.user?.phone || '');
    setRollNumber(student.roll_number);
    setRegisterNumber(student.register_number);
    setDeptId(student.department_id);
    setCourseId(student.course_id);
    setSemesterId(student.semester_id);
    setSectionId(student.section_id);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !rollNumber.trim() || !deptId || !courseId || !semesterId || !sectionId) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    if (isEditing && editingId) {
      const res = await userService.updateStudent(editingId, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        roll_number: rollNumber.trim(),
        register_number: registerNumber.trim() || undefined,
        department_id: deptId,
        course_id: courseId,
        semester_id: semesterId,
        section_id: sectionId,
      });

      setIsSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setFormError(res.error || 'Failed to update student');
      }
    } else {
      if (!email.trim()) {
        setFormError('Email address is required.');
        setIsSubmitting(false);
        return;
      }

      const res = await userService.createStudent({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        roll_number: rollNumber.trim(),
        register_number: registerNumber.trim() || undefined,
        department_id: deptId,
        course_id: courseId,
        semester_id: semesterId,
        section_id: sectionId,
      });

      setIsSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setFormError(res.error || 'Failed to create student');
      }
    }
  };

  const handleToggleStatus = async (studentId: string) => {
    await userService.toggleStudentStatus(studentId);
    loadData();
  };

  const columns: Column<StudentProfile>[] = [
    {
      header: 'Student Name & Email',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.user?.full_name || 'Student'}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.user?.email}</span>
        </div>
      ),
    },
    {
      header: 'Roll Number',
      render: (s) => (
        <Badge variant="primary">{s.roll_number}</Badge>
      ),
    },
    {
      header: 'Department & Program',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.department_name || 'CSE'}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.course_name || 'B.Tech'}</span>
        </div>
      ),
    },
    {
      header: 'Semester & Section',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Sem {s.semester_number || 6}</span>
          <Badge variant="info">{s.section_name || 'Section A'}</Badge>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (s) => (
        <Badge variant={s.user?.is_active ? 'success' : 'danger'}>
          {s.user?.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditModal(s)}
            icon={<Edit2 size={12} />}
          >
            Edit
          </Button>

          <Button
            variant={s.user?.is_active ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleToggleStatus(s.id)}
            icon={<Power size={12} />}
            title={s.user?.is_active ? 'Deactivate Student' : 'Activate Student'}
          >
            {s.user?.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle="Manage student enrollment, section cohorts, academic profiles, and account statuses"
        actions={
          <Button variant="primary" onClick={handleOpenAddModal} icon={<UserPlus size={16} />}>
            Add Student
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by name, roll no, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
            >
              <option value="">All Programs</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Main Students Table */}
      <Card>
        <CardHeader title={`Enrolled Students (${students.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading students from database...
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No students found. Click "Add Student" to enroll a new student.
            </div>
          ) : (
            <Table data={students} columns={columns} keyExtractor={(s) => s.id} />
          )}
        </CardBody>
      </Card>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                {isEditing ? 'Edit Student Profile' : 'Enroll New Student'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="alex@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEditing}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: isEditing ? '#f8fafc' : '#fff' }}
                  />
                </div>
              </div>

              {!isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Initial Password
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024CSE042"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Register Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REG-2024-8890"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Department *
                  </label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Program / Course *
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Semester *
                  </label>
                  <select
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Section *
                  </label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Student' : 'Enroll Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
