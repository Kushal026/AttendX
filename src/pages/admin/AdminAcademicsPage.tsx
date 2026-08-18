import React, { useState, useEffect } from 'react';
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
  X,
  AlertCircle,
} from 'lucide-react';

type TabType = 'departments' | 'courses' | 'semesters' | 'sections' | 'subjects';

export const AdminAcademicsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'departments';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TabType>('departments');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setCourseCode('');
      setCourseName('');
      setDegreeType('B_TECH');
      setTotalSemesters(8);
    } else if (type === 'semesters') {
      setSemNumber(1);
      setSemAcademicYear('2025-2026');
    } else if (type === 'sections') {
      setSecName('Section A');
      setSecCapacity(60);
      setSecRoom('Room 101');
    } else if (type === 'subjects') {
      setSubjCode('');
      setSubjName('');
      setSubjType('THEORY');
      setSubjCredits(4);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (modalType === 'departments') {
        if (!deptCode.trim() || !deptName.trim()) {
          setFormError('Code and Name are required.');
          setIsSubmitting(false);
          return;
        }

        if (editingId) {
          const res = await academicService.updateDepartment(editingId, { name: deptName.trim(), description: deptDesc.trim() });
          if (!res.success) { setFormError(res.error || 'Failed'); setIsSubmitting(false); return; }
        } else {
          const res = await academicService.createDepartment({ code: deptCode.trim(), name: deptName.trim(), description: deptDesc.trim() });
          if (!res.success) { setFormError(res.error || 'Failed'); setIsSubmitting(false); return; }
        }
      } else if (modalType === 'courses') {
        if (!courseDeptId || !courseCode.trim() || !courseName.trim()) {
          setFormError('Department, Code, and Name are required.');
          setIsSubmitting(false);
          return;
        }
        const res = await academicService.createCourse({
          department_id: courseDeptId,
          code: courseCode.trim(),
          name: courseName.trim(),
          degree_type: degreeType,
          total_semesters: Number(totalSemesters),
        });
        if (!res.success) { setFormError(res.error || 'Failed'); setIsSubmitting(false); return; }
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
        if (!res.success) { setFormError(res.error || 'Failed'); setIsSubmitting(false); return; }
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
        if (!res.success) { setFormError(res.error || 'Failed'); setIsSubmitting(false); return; }
      } else if (modalType === 'subjects') {
        if (!subjCourseId || !subjCode.trim() || !subjName.trim()) {
          setFormError('Course, Subject Code, and Subject Name are required.');
          setIsSubmitting(false);
          return;
        }
        const res = await academicService.createSubject({
          course_id: subjCourseId,
          semester_id: subjSemId || undefined,
          code: subjCode.trim(),
          name: subjName.trim(),
          subject_type: subjType,
          credits: Number(subjCredits),
        });
        if (!res.success) { setFormError(res.error || 'Failed'); setIsSubmitting(false); return; }
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      loadAll();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
      setIsSubmitting(false);
    }
  };

  // Columns for Departments
  const deptColumns: Column<Department>[] = [
    { header: 'Code', render: (d) => <Badge variant="primary">{d.code}</Badge> },
    { header: 'Department Name', accessor: 'name' },
    { header: 'Description', accessor: (d) => d.description || 'N/A' },
    {
      header: 'Status',
      render: (d) => <Badge variant={d.is_active ? 'success' : 'danger'}>{d.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      render: (d) => (
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
      ),
    },
  ];

  // Columns for Courses
  const courseColumns: Column<Course>[] = [
    { header: 'Course Code', render: (c) => <Badge variant="primary">{c.code}</Badge> },
    { header: 'Course / Degree Name', accessor: 'name' },
    { header: 'Degree Type', render: (c) => <Badge variant="info">{c.degree_type}</Badge> },
    { header: 'Total Semesters', accessor: (c) => `${c.total_semesters} Semesters` },
    {
      header: 'Status',
      render: (c) => <Badge variant={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  // Columns for Semesters
  const semesterColumns: Column<Semester>[] = [
    { header: 'Semester', render: (s) => <Badge variant="primary">Semester {s.semester_number}</Badge> },
    { header: 'Academic Year', accessor: 'academic_year' },
    {
      header: 'Current Status',
      render: (s) => <Badge variant={s.is_current ? 'success' : 'neutral'}>{s.is_current ? 'Current Active Term' : 'Archived'}</Badge>,
    },
  ];

  // Columns for Sections
  const sectionColumns: Column<Section>[] = [
    { header: 'Section Name', render: (sec) => <Badge variant="primary">{sec.name}</Badge> },
    { header: 'Capacity', accessor: (sec) => `${sec.capacity} Students` },
    { header: 'Assigned Room', accessor: (sec) => sec.room_number || 'TBD' },
    {
      header: 'Status',
      render: (sec) => <Badge variant={sec.is_active ? 'success' : 'danger'}>{sec.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  // Columns for Subjects
  const subjectColumns: Column<Subject>[] = [
    { header: 'Subject Code', render: (sub) => <Badge variant="primary">{sub.code}</Badge> },
    { header: 'Subject Title', accessor: 'name' },
    { header: 'Type', render: (sub) => <Badge variant="info">{sub.subject_type || 'THEORY'}</Badge> },
    { header: 'Credits', accessor: (sub) => `${sub.credits || 4} Credits` },
    {
      header: 'Status',
      render: (sub) => <Badge variant={sub.is_active ? 'success' : 'danger'}>{sub.is_active ? 'Active' : 'Inactive'}</Badge>,
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
          <BookOpen size={16} /> Courses ({courses.length})
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

      {/* Main Tab Content */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading academic records from database...
            </div>
          ) : activeTab === 'departments' ? (
            <Table data={departments} columns={deptColumns} keyExtractor={(d) => d.id} />
          ) : activeTab === 'courses' ? (
            <Table data={courses} columns={courseColumns} keyExtractor={(c) => c.id} />
          ) : activeTab === 'semesters' ? (
            <Table data={semesters} columns={semesterColumns} keyExtractor={(s) => s.id} />
          ) : activeTab === 'sections' ? (
            <Table data={sections} columns={sectionColumns} keyExtractor={(sec) => sec.id} />
          ) : (
            <Table data={subjects} columns={subjectColumns} keyExtractor={(sub) => sub.id} />
          )}
        </CardBody>
      </Card>

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
              maxWidth: '520px',
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
                  ? 'Course'
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

              {/* 1. DEPT FORM */}
              {modalType === 'departments' && (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Department Code (Unique) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MECH"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
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
                      placeholder="e.g. Mechanical Engineering"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief description of the department..."
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* 2. COURSE FORM */}
              {modalType === 'courses' && (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Department *
                    </label>
                    <select
                      value={courseDeptId}
                      onChange={(e) => setCourseDeptId(e.target.value)}
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
                        Course Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BTECH-MECH"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
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
                        <option value="B_TECH">B.Tech</option>
                        <option value="M_TECH">M.Tech</option>
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
                        placeholder="e.g. B.Tech in Mechanical Engineering"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Semesters
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

              {/* 5. SUBJECT FORM */}
              {modalType === 'subjects' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Course / Degree *
                      </label>
                      <select
                        value={subjCourseId}
                        onChange={(e) => setSubjCourseId(e.target.value)}
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
                        <option value="">Select Semester</option>
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
                        placeholder="e.g. CS601"
                        value={subjCode}
                        onChange={(e) => setSubjCode(e.target.value)}
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
                        placeholder="e.g. Distributed Cloud Systems"
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
                        <option value="LAB">Practical / Lab</option>
                        <option value="ELECTIVE">Elective</option>
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
