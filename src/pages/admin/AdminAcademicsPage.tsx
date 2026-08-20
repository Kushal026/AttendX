import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { academicService } from '../../services';
import { Department, Course, Semester, Section, Subject } from '../../types';
import {
  Building2,
  BookOpen,
  Calendar,
  Layers,
  FileSpreadsheet,
  Plus,
  Edit2,
  Power,
  X,
  AlertCircle,
  Eye,
  Search,
  Filter,
} from 'lucide-react';

type TabType = 'departments' | 'courses' | 'semesters' | 'sections' | 'subjects';

// Common Engineering Department suggestions for quick-fill in UI
const PRESET_ENGINEERING_DEPTS = [
  { code: 'CSE', name: 'Computer Science and Engineering', desc: 'Department of Computer Science and Engineering' },
  { code: 'ISE', name: 'Information Science and Engineering', desc: 'Department of Information Science and Engineering' },
  { code: 'ECE', name: 'Electronics and Communication Engineering', desc: 'Department of Electronics and Communication Engineering' },
  { code: 'EEE', name: 'Electrical and Electronics Engineering', desc: 'Department of Electrical and Electronics Engineering' },
  { code: 'MECH', name: 'Mechanical Engineering', desc: 'Department of Mechanical Engineering' },
  { code: 'CIVIL', name: 'Civil Engineering', desc: 'Department of Civil Engineering' },
  { code: 'AIML', name: 'Artificial Intelligence and Machine Learning', desc: 'Department of AI & Machine Learning' },
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science', desc: 'Department of AI & Data Science' },
];

export const AdminAcademicsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'departments';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subject Hierarchical Filters (Issue 6)
  const [subjectFilterDeptId, setSubjectFilterDeptId] = useState('');
  const [subjectFilterCourseId, setSubjectFilterCourseId] = useState('');
  const [subjectFilterSemId, setSubjectFilterSemId] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Course Filter
  const [courseFilterDeptId, setCourseFilterDeptId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TabType>('departments');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal
  const [viewItem, setViewItem] = useState<{ title: string; data: Record<string, any> } | null>(null);

  // Form Fields
  // Dept
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Course
  const [courseDeptId, setCourseDeptId] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [degreeType, setDegreeType] = useState('B_TECH');
  const [totalSemesters, setTotalSemesters] = useState(8);

  // Semester
  const [semCourseId, setSemCourseId] = useState('');
  const [semNumber, setSemNumber] = useState(1);
  const [semAcademicYear, setSemAcademicYear] = useState('2025-2026');

  // Section
  const [secSemesterId, setSecSemesterId] = useState('');
  const [secName, setSecName] = useState('Section A');
  const [secCapacity, setSecCapacity] = useState(60);
  const [secRoom, setSecRoom] = useState('Room 101');

  // Subject
  const [subjCourseId, setSubjCourseId] = useState('');
  const [subjSemId, setSubjSemId] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjType, setSubjType] = useState('THEORY');
  const [subjCredits, setSubjCredits] = useState(4);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [depts, crss, sems, secs, subs] = await Promise.all([
        academicService.getDepartments(),
        academicService.getCourses(),
        academicService.getSemesters(),
        academicService.getSections(),
        academicService.getSubjects(),
      ]);
      setDepartments(depts);
      setCourses(crss);
      setSemesters(sems);
      setSections(secs);
      setSubjects(subs);

      if (depts.length > 0 && !courseDeptId) setCourseDeptId(depts[0].id);
      if (crss.length > 0 && !semCourseId) setSemCourseId(crss[0].id);
      if (crss.length > 0 && !subjCourseId) setSubjCourseId(crss[0].id);
      if (sems.length > 0 && !secSemesterId) setSecSemesterId(sems[0].id);
      if (sems.length > 0 && !subjSemId) setSubjSemId(sems[0].id);
    } catch (e) {
      console.error('Failed to load academics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  // Filtered Courses for Subjects dropdown cascade
  const filteredCoursesForSubject = useMemo(() => {
    if (!subjectFilterDeptId) return courses;
    return courses.filter((c) => c.department_id === subjectFilterDeptId);
  }, [courses, subjectFilterDeptId]);

  // Filtered Semesters for Subjects dropdown cascade
  const filteredSemestersForSubject = useMemo(() => {
    if (!subjectFilterCourseId) return semesters;
    return semesters.filter((s) => s.course_id === subjectFilterCourseId);
  }, [semesters, subjectFilterCourseId]);

  // Subject table filtering (Issue 6)
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      // Find course for this subject
      const course = courses.find((c) => c.id === sub.course_id);

      if (subjectFilterDeptId && course && course.department_id !== subjectFilterDeptId) {
        return false;
      }
      if (subjectFilterCourseId && sub.course_id !== subjectFilterCourseId) {
        return false;
      }
      if (subjectFilterSemId && sub.semester_id !== subjectFilterSemId) {
        return false;
      }
      if (subjectSearch.trim()) {
        const query = subjectSearch.toLowerCase().trim();
        const matchCode = sub.code.toLowerCase().includes(query);
        const matchName = sub.name.toLowerCase().includes(query);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  }, [subjects, courses, subjectFilterDeptId, subjectFilterCourseId, subjectFilterSemId, subjectSearch]);

  // Course table filtering (Issue 5)
  const filteredCourses = useMemo(() => {
    if (!courseFilterDeptId) return courses;
    return courses.filter((c) => c.department_id === courseFilterDeptId);
  }, [courses, courseFilterDeptId]);

  const handleOpenAddModal = (type: TabType) => {
    setModalType(type);
    setEditingId(null);
    setFormError(null);

    // reset fields
    if (type === 'departments') {
      setDeptCode('');
      setDeptName('');
      setDeptDesc('');
    } else if (type === 'courses') {
      setCourseDeptId(departments[0]?.id || '');
      setCourseCode('');
      setCourseName('');
      setDegreeType('B_TECH');
      setTotalSemesters(8);
    } else if (type === 'semesters') {
      setSemCourseId(courses[0]?.id || '');
      setSemNumber(1);
      setSemAcademicYear('2025-2026');
    } else if (type === 'sections') {
      setSecSemesterId(semesters[0]?.id || '');
      setSecName('Section A');
      setSecCapacity(60);
      setSecRoom('Room 101');
    } else if (type === 'subjects') {
      setSubjCourseId(courses[0]?.id || '');
      setSubjSemId(semesters[0]?.id || '');
      setSubjCode('');
      setSubjName('');
      setSubjType('THEORY');
      setSubjCredits(4);
    }

    setIsModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setModalType('courses');
    setEditingId(course.id);
    setCourseDeptId(course.department_id);
    setCourseCode(course.code);
    setCourseName(course.name);
    setDegreeType(course.degree_type);
    setTotalSemesters(course.total_semesters);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setModalType('subjects');
    setEditingId(sub.id);
    setSubjCourseId(sub.course_id);
    setSubjSemId(sub.semester_id || '');
    setSubjCode(sub.code);
    setSubjName(sub.name);
    setSubjType(sub.subject_type || 'THEORY');
    setSubjCredits(sub.credits || 4);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (modalType === 'departments') {
        if (!deptCode.trim() || !deptName.trim()) {
          setFormError('Department Code and Name are required.');
          setIsSubmitting(false);
          return;
        }

        if (editingId) {
          const res = await academicService.updateDepartment(editingId, {
            name: deptName.trim(),
            description: deptDesc.trim() || undefined,
          });
          if (!res.success) { setFormError(res.error || 'Failed to update department'); setIsSubmitting(false); return; }
        } else {
          const res = await academicService.createDepartment({
            code: deptCode.trim().toUpperCase(),
            name: deptName.trim(),
            description: deptDesc.trim() || undefined,
          });
          if (!res.success) { setFormError(res.error || 'Failed to create department'); setIsSubmitting(false); return; }
        }
      } else if (modalType === 'courses') {
        if (!courseDeptId || !courseCode.trim() || !courseName.trim()) {
          setFormError('Department, Course Code, and Program Name are required.');
          setIsSubmitting(false);
          return;
        }

        if (editingId) {
          const res = await academicService.updateCourse(editingId, {
            department_id: courseDeptId,
            code: courseCode.trim().toUpperCase(),
            name: courseName.trim(),
            degree_type: degreeType,
            total_semesters: Number(totalSemesters),
          });
          if (!res.success) { setFormError(res.error || 'Failed to update course'); setIsSubmitting(false); return; }
        } else {
          const res = await academicService.createCourse({
            department_id: courseDeptId,
            code: courseCode.trim().toUpperCase(),
            name: courseName.trim(),
            degree_type: degreeType,
            total_semesters: Number(totalSemesters),
          });
          if (!res.success) { setFormError(res.error || 'Failed to create course'); setIsSubmitting(false); return; }
        }
      } else if (modalType === 'semesters') {
        if (!semCourseId || !semNumber || !semAcademicYear.trim()) {
          setFormError('Course, Semester Number, and Academic Year are required.');
          setIsSubmitting(false);
          return;
        }
        const res = await academicService.createSemester({
          course_id: semCourseId,
          semester_number: Number(semNumber),
          academic_year: semAcademicYear.trim(),
        });
        if (!res.success) { setFormError(res.error || 'Failed to create semester'); setIsSubmitting(false); return; }
      } else if (modalType === 'sections') {
        if (!secSemesterId || !secName.trim()) {
          setFormError('Semester and Section Name are required.');
          setIsSubmitting(false);
          return;
        }
        const res = await academicService.createSection({
          semester_id: secSemesterId,
          name: secName.trim(),
          capacity: Number(secCapacity),
          room_number: secRoom.trim() || undefined,
        });
        if (!res.success) { setFormError(res.error || 'Failed to create section'); setIsSubmitting(false); return; }
      } else if (modalType === 'subjects') {
        if (!subjCourseId || !subjCode.trim() || !subjName.trim()) {
          setFormError('Course, Subject Code, and Subject Name are required.');
          setIsSubmitting(false);
          return;
        }

        if (editingId) {
          const res = await academicService.updateSubject(editingId, {
            course_id: subjCourseId,
            semester_id: subjSemId || undefined,
            code: subjCode.trim().toUpperCase(),
            name: subjName.trim(),
            subject_type: subjType,
            credits: Number(subjCredits),
          });
          if (!res.success) { setFormError(res.error || 'Failed to update subject'); setIsSubmitting(false); return; }
        } else {
          const res = await academicService.createSubject({
            course_id: subjCourseId,
            semester_id: subjSemId || undefined,
            code: subjCode.trim().toUpperCase(),
            name: subjName.trim(),
            subject_type: subjType,
            credits: Number(subjCredits),
          });
          if (!res.success) { setFormError(res.error || 'Failed to create subject'); setIsSubmitting(false); return; }
        }
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      loadAll();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleToggleDeptStatus = async (d: Department) => {
    await academicService.toggleDepartmentStatus(d.id, !!d.is_active);
    loadAll();
  };

  const handleToggleCourseStatus = async (c: Course) => {
    await academicService.toggleCourseStatus(c.id, !!c.is_active);
    loadAll();
  };

  const handleToggleSubjectStatus = async (sub: Subject) => {
    await academicService.toggleSubjectStatus(sub.id, !!sub.is_active);
    loadAll();
  };

  // Columns for Departments
  const deptColumns: Column<Department>[] = [
    { header: 'Department Code', render: (d) => <Badge variant="primary">{d.code}</Badge> },
    { header: 'Department Name', accessor: 'name' },
    { header: 'Description', accessor: (d) => d.description || 'N/A' },
    {
      header: 'Status',
      render: (d) => <Badge variant={d.is_active ? 'success' : 'danger'}>{d.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      render: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewItem({ title: 'Department Details', data: d })}
            icon={<Eye size={12} />}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setModalType('departments');
              setEditingId(d.id);
              setDeptCode(d.code);
              setDeptName(d.name);
              setDeptDesc(d.description || '');
              setIsModalOpen(true);
            }}
            icon={<Edit2 size={12} />}
          >
            Edit
          </Button>
          <Button
            variant={d.is_active ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleToggleDeptStatus(d)}
            icon={<Power size={12} />}
            title={d.is_active ? 'Deactivate Department' : 'Activate Department'}
          >
            {d.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Courses (Issue 4 & 5)
  const courseColumns: Column<Course>[] = [
    { header: 'Course Code', render: (c) => <Badge variant="primary">{c.code}</Badge> },
    { header: 'Course / Program Name', accessor: 'name' },
    {
      header: 'Department',
      render: (c) => {
        const dept = departments.find((d) => d.id === c.department_id);
        return <span style={{ fontWeight: 600, color: '#334155' }}>{dept?.name || c.department_name || 'N/A'}</span>;
      },
    },
    { header: 'Degree Type', render: (c) => <Badge variant="info">{c.degree_type}</Badge> },
    { header: 'Total Semesters', accessor: (c) => `${c.total_semesters} Semesters` },
    {
      header: 'Status',
      render: (c) => <Badge variant={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewItem({ title: 'Course Details', data: c })}
            icon={<Eye size={12} />}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditCourse(c)}
            icon={<Edit2 size={12} />}
          >
            Edit
          </Button>
          <Button
            variant={c.is_active ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleToggleCourseStatus(c)}
            icon={<Power size={12} />}
            title={c.is_active ? 'Deactivate Course' : 'Activate Course'}
          >
            {c.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Semesters
  const semesterColumns: Column<Semester>[] = [
    { header: 'Semester', render: (s) => <Badge variant="primary">Semester {s.semester_number}</Badge> },
    {
      header: 'Course / Program',
      render: (s) => {
        const c = courses.find((crs) => crs.id === s.course_id);
        return <span>{c?.name || 'N/A'}</span>;
      },
    },
    { header: 'Academic Year', accessor: 'academic_year' },
    {
      header: 'Current Status',
      render: (s) => <Badge variant={s.is_current ? 'success' : 'neutral'}>{s.is_current ? 'Current Active Term' : 'Archived'}</Badge>,
    },
  ];

  // Columns for Sections
  const sectionColumns: Column<Section>[] = [
    { header: 'Section Name', render: (sec) => <Badge variant="primary">{sec.name}</Badge> },
    {
      header: 'Semester Term',
      render: (sec) => {
        const s = semesters.find((sem) => sem.id === sec.semester_id);
        return <span>Semester {s?.semester_number || 'N/A'}</span>;
      },
    },
    { header: 'Capacity', accessor: (sec) => `${sec.capacity} Students` },
    { header: 'Assigned Room', accessor: (sec) => sec.room_number || 'TBD' },
    {
      header: 'Status',
      render: (sec) => <Badge variant={sec.is_active ? 'success' : 'danger'}>{sec.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  // Columns for Subjects (Issue 6)
  const subjectColumns: Column<Subject>[] = [
    { header: 'Subject Code', render: (sub) => <Badge variant="primary">{sub.code}</Badge> },
    { header: 'Subject Title', accessor: 'name' },
    {
      header: 'Department',
      render: (sub) => {
        const course = courses.find((c) => c.id === sub.course_id);
        const dept = departments.find((d) => d.id === course?.department_id);
        return <span style={{ fontSize: '0.8125rem' }}>{dept?.code || 'N/A'}</span>;
      },
    },
    {
      header: 'Course / Program',
      render: (sub) => {
        const course = courses.find((c) => c.id === sub.course_id);
        return <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{course?.name || 'N/A'}</span>;
      },
    },
    {
      header: 'Semester',
      render: (sub) => {
        const s = semesters.find((sem) => sem.id === sub.semester_id);
        return <span style={{ fontSize: '0.8125rem' }}>{s ? `Sem ${s.semester_number}` : 'All Terms'}</span>;
      },
    },
    { header: 'Type', render: (sub) => <Badge variant="info">{sub.subject_type || 'THEORY'}</Badge> },
    { header: 'Credits', accessor: (sub) => `${sub.credits || 4} Cr` },
    {
      header: 'Status',
      render: (sub) => <Badge variant={sub.is_active ? 'success' : 'danger'}>{sub.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      render: (sub) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditSubject(sub)}
            icon={<Edit2 size={12} />}
          >
            Edit
          </Button>
          <Button
            variant={sub.is_active ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleToggleSubjectStatus(sub)}
            icon={<Power size={12} />}
            title={sub.is_active ? 'Deactivate Subject' : 'Activate Subject'}
          >
            {sub.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Academic Structure Management"
        subtitle="Configure institutional hierarchy: departments, degree programs, semesters, section cohorts, and curriculum subjects"
        actions={
          <Button variant="primary" onClick={() => handleOpenAddModal(activeTab)} icon={<Plus size={16} />}>
            Add {activeTab === 'departments' ? 'Department' : activeTab === 'courses' ? 'Course' : activeTab === 'semesters' ? 'Semester' : activeTab === 'sections' ? 'Section' : 'Subject'}
          </Button>
        }
      />

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('departments')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'departments' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'departments' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Building2 size={16} /> Departments ({departments.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('courses')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'courses' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'courses' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <BookOpen size={16} /> Courses / Programs ({courses.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('semesters')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'semesters' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'semesters' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Calendar size={16} /> Semesters ({semesters.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('sections')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'sections' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'sections' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Layers size={16} /> Sections ({sections.length})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('subjects')}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            border: 'none',
            borderBottom: activeTab === 'subjects' ? '2px solid #f97316' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'subjects' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <FileSpreadsheet size={16} /> Subjects ({subjects.length})
        </button>
      </div>

      {/* Course Filter Bar (Issue 5) */}
      {activeTab === 'courses' && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardBody style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.8125rem', fontWeight: 600 }}>
                <Filter size={14} /> Filter by Department:
              </div>
              <select
                value={courseFilterDeptId}
                onChange={(e) => setCourseFilterDeptId(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', minWidth: '220px' }}
              >
                <option value="">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
              {courseFilterDeptId && (
                <Button variant="outline" size="sm" onClick={() => setCourseFilterDeptId('')}>
                  Clear Filter
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Subject Hierarchical Filter Bar (Issue 6) */}
      {activeTab === 'subjects' && (
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardBody style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search code or title..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.25rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              {/* Department Selector */}
              <div>
                <select
                  value={subjectFilterDeptId}
                  onChange={(e) => {
                    setSubjectFilterDeptId(e.target.value);
                    setSubjectFilterCourseId('');
                    setSubjectFilterSemId('');
                  }}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Course / Program Selector */}
              <div>
                <select
                  value={subjectFilterCourseId}
                  onChange={(e) => {
                    setSubjectFilterCourseId(e.target.value);
                    setSubjectFilterSemId('');
                  }}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  <option value="">All Courses / Programs</option>
                  {filteredCoursesForSubject.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Semester Selector */}
              <div>
                <select
                  value={subjectFilterSemId}
                  onChange={(e) => setSubjectFilterSemId(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  <option value="">All Semesters</option>
                  {filteredSemestersForSubject.map((s) => (
                    <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>
                  ))}
                </select>
              </div>

              {(subjectFilterDeptId || subjectFilterCourseId || subjectFilterSemId || subjectSearch) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubjectFilterDeptId('');
                    setSubjectFilterCourseId('');
                    setSubjectFilterSemId('');
                    setSubjectSearch('');
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main Tab Content Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading academic records from database...
            </div>
          ) : activeTab === 'departments' ? (
            <Table data={departments} columns={deptColumns} keyExtractor={(d) => d.id} />
          ) : activeTab === 'courses' ? (
            <Table data={filteredCourses} columns={courseColumns} keyExtractor={(c) => c.id} />
          ) : activeTab === 'semesters' ? (
            <Table data={semesters} columns={semesterColumns} keyExtractor={(s) => s.id} />
          ) : activeTab === 'sections' ? (
            <Table data={sections} columns={sectionColumns} keyExtractor={(sec) => sec.id} />
          ) : (
            <Table data={filteredSubjects} columns={subjectColumns} keyExtractor={(sub) => sub.id} />
          )}
        </CardBody>
      </Card>

      {/* View Item Details Modal */}
      {viewItem && (
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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{viewItem.title}</h3>
              <button type="button" onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
              {Object.entries(viewItem.data).map(([k, v]) => {
                if (typeof v === 'object' || k === 'id') return null;
                return (
                  <React.Fragment key={k}>
                    <span style={{ fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{String(v)}</span>
                  </React.Fragment>
                );
              })}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setViewItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
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
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                {editingId ? 'Edit' : 'Add'}{' '}
                {modalType === 'departments'
                  ? 'Department'
                  : modalType === 'courses'
                  ? 'Course / Program'
                  : modalType === 'semesters'
                  ? 'Semester'
                  : modalType === 'sections'
                  ? 'Section'
                  : 'Subject'}
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

              {/* 1. DEPT FORM (Issue 3) */}
              {modalType === 'departments' && (
                <div>
                  {!editingId && (
                    <div style={{ marginBottom: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Quick-Fill Engineering Preset:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {PRESET_ENGINEERING_DEPTS.map((p) => (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => {
                              setDeptCode(p.code);
                              setDeptName(p.name);
                              setDeptDesc(p.desc);
                            }}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            + {p.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Department Code (Unique) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE, ECE, MECH"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                      disabled={!!editingId}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Department Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science and Engineering"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief overview of department programs..."
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* 2. COURSE FORM (Issue 4 & 5) */}
              {modalType === 'courses' && (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Department *
                    </label>
                    <select
                      value={courseDeptId}
                      onChange={(e) => setCourseDeptId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Course Code (Editable) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BTECH-CSE"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Degree Type
                      </label>
                      <select
                        value={degreeType}
                        onChange={(e) => setDegreeType(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                      >
                        <option value="B_TECH">B.Tech / B.E.</option>
                        <option value="M_TECH">M.Tech / M.E.</option>
                        <option value="B_SC">B.Sc</option>
                        <option value="M_SC">M.Sc</option>
                        <option value="BBA">BBA</option>
                        <option value="MBA">MBA</option>
                        <option value="PHD">Ph.D</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Program / Course Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B.E. Computer Science and Engineering"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Total Semesters
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={totalSemesters}
                        onChange={(e) => setTotalSemesters(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SEMESTER FORM */}
              {modalType === 'semesters' && (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Program / Course *
                    </label>
                    <select
                      value={semCourseId}
                      onChange={(e) => setSemCourseId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Semester Number *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={semNumber}
                        onChange={(e) => setSemNumber(Number(e.target.value))}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Academic Year *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2025-2026"
                        value={semAcademicYear}
                        onChange={(e) => setSemAcademicYear(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SECTION FORM */}
              {modalType === 'sections' && (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Semester *
                    </label>
                    <select
                      value={secSemesterId}
                      onChange={(e) => setSecSemesterId(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                    >
                      {semesters.map((s) => (
                        <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Section Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Section A"
                        value={secName}
                        onChange={(e) => setSecName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Capacity
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={secCapacity}
                        onChange={(e) => setSecCapacity(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Room
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hall 302"
                        value={secRoom}
                        onChange={(e) => setSecRoom(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SUBJECT FORM (Issue 6) */}
              {modalType === 'subjects' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Course / Program *
                      </label>
                      <select
                        value={subjCourseId}
                        onChange={(e) => setSubjCourseId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Semester
                      </label>
                      <select
                        value={subjSemId}
                        onChange={(e) => setSubjSemId(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                      >
                        <option value="">All / Flexible Semester</option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Subject Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 21CS301"
                        value={subjCode}
                        onChange={(e) => setSubjCode(e.target.value.toUpperCase())}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Subject Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Database Management Systems"
                        value={subjName}
                        onChange={(e) => setSubjName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Subject Type
                      </label>
                      <select
                        value={subjType}
                        onChange={(e) => setSubjType(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                      >
                        <option value="THEORY">Theory</option>
                        <option value="LAB">Practical / Laboratory</option>
                        <option value="ELECTIVE">Professional Elective</option>
                        <option value="SEMINAR">Seminar / Project</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Credits
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={subjCredits}
                        onChange={(e) => setSubjCredits(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Record' : 'Create Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
