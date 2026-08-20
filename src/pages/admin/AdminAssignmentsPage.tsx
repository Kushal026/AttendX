import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { academicService, userService } from '../../services';
import { FacultySubject, FacultyProfile, Department, Course, Semester, Section, Subject } from '../../types';
import {
  Plus,
  Trash2,
  X,
  School,
  AlertCircle,
  Eye,
  Search,
  Loader2,
} from 'lucide-react';

export const AdminAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<FacultySubject[]>([]);
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Main Page State
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [search, setSearch] = useState('');

  // Modal Form Selection State (IDs only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFacultyId, setModalFacultyId] = useState('');
  const [modalDeptId, setModalDeptId] = useState('');
  const [modalCourseId, setModalCourseId] = useState('');
  const [modalSemId, setModalSemId] = useState('');
  const [modalSectionId, setModalSectionId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  // Dynamic Data Lists for Modal
  const [modalCourses, setModalCourses] = useState<Course[]>([]);
  const [modalSemesters, setModalSemesters] = useState<Semester[]>([]);
  const [modalSections, setModalSections] = useState<Section[]>([]);
  const [modalSubjects, setModalSubjects] = useState<Subject[]>([]);

  // Loading & Error States for Modal Cascades
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const [sectionFetchError, setSectionFetchError] = useState<string | null>(null);
  const [subjectFetchError, setSubjectFetchError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal
  const [viewAssignment, setViewAssignment] = useState<FacultySubject | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [asgns, facList, depts] = await Promise.all([
        academicService.getFacultySubjectAssignments(),
        userService.getAllFaculty(),
        academicService.getDepartments(),
      ]);
      setAssignments(asgns);
      setFaculty(facList);
      setDepartments(depts);
    } catch (e) {
      console.error('Failed to load assignments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CASCADING HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. When Department Changes: Reset Course, Semester, Section, Subject
  const handleModalDeptChange = async (newDeptId: string) => {
    setModalDeptId(newDeptId);
    setModalCourseId('');
    setModalSemId('');
    setModalSectionId('');
    setModalSubjectId('');

    setModalCourses([]);
    setModalSemesters([]);
    setModalSections([]);
    setModalSubjects([]);

    setSectionFetchError(null);
    setSubjectFetchError(null);

    if (!newDeptId) return;

    setIsLoadingCourses(true);
    try {
      const crss = await academicService.getCourses(newDeptId);
      setModalCourses(crss);
      if (crss.length > 0) {
        await handleModalCourseChange(crss[0].id);
      }
    } catch (e) {
      console.error('Error fetching courses:', e);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // 2. When Course Changes: Reset Semester, Section, Subject
  const handleModalCourseChange = async (newCourseId: string) => {
    setModalCourseId(newCourseId);
    setModalSemId('');
    setModalSectionId('');
    setModalSubjectId('');

    setModalSemesters([]);
    setModalSections([]);
    setModalSubjects([]);

    setSectionFetchError(null);
    setSubjectFetchError(null);

    if (!newCourseId) return;

    setIsLoadingSemesters(true);
    try {
      const sems = await academicService.getSemesters(newCourseId);
      setModalSemesters(sems);
      if (sems.length > 0) {
        await handleModalSemChange(sems[0].id, newCourseId, sems);
      }
    } catch (e) {
      console.error('Error fetching semesters:', e);
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  // 3. When Semester Changes: Reset Section & Subject, then fetch matching records
  const handleModalSemChange = async (
    newSemId: string,
    currentCourseId?: string,
    availableSemesters?: Semester[]
  ) => {
    const activeCourseId = currentCourseId || modalCourseId;
    const activeSemesters = availableSemesters || modalSemesters;

    setModalSemId(newSemId);
    setModalSectionId('');
    setModalSubjectId('');

    setModalSections([]);
    setModalSubjects([]);

    setSectionFetchError(null);
    setSubjectFetchError(null);

    if (!newSemId) return;

    const selectedSem = activeSemesters.find((s) => s.id === newSemId);
    if (selectedSem) {
      setAcademicYear(selectedSem.academic_year);
    }

    setIsLoadingSections(true);
    setIsLoadingSubjects(true);

    try {
      const [secRes, subRes] = await Promise.allSettled([
        academicService.getSections(newSemId),
        academicService.getSubjects(activeCourseId, newSemId),
      ]);

      if (secRes.status === 'fulfilled') {
        setModalSections(secRes.value);
        if (secRes.value.length > 0) {
          setModalSectionId(secRes.value[0].id);
        }
      } else {
        setSectionFetchError('Unable to load sections. Please try again.');
      }

      if (subRes.status === 'fulfilled') {
        setModalSubjects(subRes.value);
        if (subRes.value.length > 0) {
          setModalSubjectId(subRes.value[0].id);
        }
      } else {
        setSubjectFetchError('Unable to load subjects. Please try again.');
      }
    } catch (e) {
      console.error('Error loading sections/subjects:', e);
    } finally {
      setIsLoadingSections(false);
      setIsLoadingSubjects(false);
    }
  };

  const handleOpenModal = async () => {
    setFormError(null);
    setSectionFetchError(null);
    setSubjectFetchError(null);
    setIsModalOpen(true);

    if (faculty.length > 0) {
      setModalFacultyId(faculty[0].id);
    }

    if (departments.length > 0) {
      await handleModalDeptChange(departments[0].id);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      !modalFacultyId ||
      !modalDeptId ||
      !modalCourseId ||
      !modalSemId ||
      !modalSectionId ||
      !modalSubjectId
    ) {
      setFormError('Please select Faculty Member, Department, Course, Semester, Section, and Subject.');
      return;
    }

    setIsSubmitting(true);
    const res = await academicService.assignFacultyToSubject({
      faculty_id: modalFacultyId,
      subject_id: modalSubjectId,
      section_id: modalSectionId,
      academic_year: academicYear.trim(),
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this faculty teaching assignment?')) {
      await academicService.removeFacultySubjectAssignment(id);
      loadData();
    }
  };

  // Filtered Assignments for Main Table
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (filterFacultyId && a.faculty_id !== filterFacultyId) return false;

      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const facName = (a.faculty?.user?.full_name || '').toLowerCase();
        const subName = (a.subject?.name || '').toLowerCase();
        const subCode = (a.subject?.code || '').toLowerCase();
        if (!facName.includes(query) && !subName.includes(query) && !subCode.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [assignments, filterFacultyId, search]);

  // Form Submission Validation
  const isFormValid = Boolean(
    modalFacultyId &&
      modalDeptId &&
      modalCourseId &&
      modalSemId &&
      modalSectionId &&
      modalSubjectId &&
      !isLoadingSections &&
      !isLoadingSubjects
  );

  const columns: Column<FacultySubject>[] = [
    {
      header: 'Faculty Member',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {a.faculty?.user?.full_name?.charAt(0) || 'F'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {a.faculty?.user?.full_name || 'Faculty Member'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {a.faculty?.employee_id || 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Teaching Subject',
      render: (a) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{a.subject?.name || 'Subject'}</span>
          <Badge variant="primary" style={{ width: 'fit-content', marginTop: '0.15rem' }}>
            {a.subject?.code || 'N/A'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Assigned Section',
      render: (a) => <Badge variant="info">{a.section?.name || 'Section'}</Badge>,
    },
    {
      header: 'Academic Term',
      accessor: (a) => a.academic_year || '2025-2026',
    },
    {
      header: 'Actions',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewAssignment(a)}
            icon={<Eye size={12} />}
          >
            View
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteAssignment(a.id)}
            icon={<Trash2 size={12} />}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Faculty & Subject Assignments"
        subtitle="Allocate teaching faculty to academic departments, degree programs, curriculum subjects, and section cohorts"
        actions={
          <Button variant="primary" onClick={handleOpenModal} icon={<Plus size={16} />}>
            Assign Subject to Faculty
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
                placeholder="Search faculty or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.25rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <select
              value={filterFacultyId}
              onChange={(e) => setFilterFacultyId(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
            >
              <option value="">All Faculty Members ({faculty.length})</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.user?.full_name} ({f.employee_id})</option>
              ))}
            </select>

            {(search || filterFacultyId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFilterFacultyId('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader title={`Active Teaching Allocations (${filteredAssignments.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
              Loading teaching allocations from database...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <School size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                No Teaching Allocations Found
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                Click "Assign Subject to Faculty" to allocate curriculum subjects to professors.
              </p>
            </div>
          ) : (
            <Table data={filteredAssignments} columns={columns} keyExtractor={(a) => a.id} />
          )}
        </CardBody>
      </Card>

      {/* View Assignment Modal */}
      {viewAssignment && (
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Assignment Details</h3>
              <button type="button" onClick={() => setViewAssignment(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Faculty Professor:</span>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                  {viewAssignment.faculty?.user?.full_name} ({viewAssignment.faculty?.employee_id})
                </p>
              </div>

              <div>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Assigned Subject:</span>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                  {viewAssignment.subject?.name} ({viewAssignment.subject?.code})
                </p>
              </div>

              <div>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Section Cohort:</span>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                  {viewAssignment.section?.name}
                </p>
              </div>

              <div>
                <span style={{ fontWeight: 600, color: '#64748b' }}>Academic Year:</span>
                <p style={{ fontWeight: 600, color: '#334155', margin: '0.15rem 0 0' }}>
                  {viewAssignment.academic_year}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setViewAssignment(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal with Dynamic Cascading Hierarchy */}
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
                Allocate Subject to Faculty
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: '1.5rem' }}>
              {formError && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Select Faculty */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Faculty Professor *
                </label>
                <select
                  value={modalFacultyId}
                  onChange={(e) => setModalFacultyId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  <option value="">Select Faculty</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.user?.full_name} ({f.employee_id}) — {f.department_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Department & Program Cascade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Department *
                  </label>
                  <select
                    value={modalDeptId}
                    onChange={(e) => handleModalDeptChange(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Course / Program *
                  </label>
                  <select
                    value={modalCourseId}
                    onChange={(e) => handleModalCourseChange(e.target.value)}
                    disabled={!modalDeptId || isLoadingCourses}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: !modalDeptId || isLoadingCourses ? '#f8fafc' : '#fff' }}
                  >
                    <option value="">
                      {isLoadingCourses
                        ? 'Loading courses...'
                        : !modalDeptId
                        ? 'Select Department first'
                        : modalCourses.length === 0
                        ? 'No courses available for this department'
                        : 'Select Course'}
                    </option>
                    {modalCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Semester & Section Cascade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Semester Term *
                  </label>
                  <select
                    value={modalSemId}
                    onChange={(e) => handleModalSemChange(e.target.value)}
                    disabled={!modalCourseId || isLoadingSemesters}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: !modalCourseId || isLoadingSemesters ? '#f8fafc' : '#fff' }}
                  >
                    <option value="">
                      {isLoadingSemesters
                        ? 'Loading semesters...'
                        : !modalCourseId
                        ? 'Select Course first'
                        : modalSemesters.length === 0
                        ? 'No semesters available for this course'
                        : 'Select Semester'}
                    </option>
                    {modalSemesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.semester_number} ({s.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Section Cohort *
                  </label>
                  <select
                    value={modalSectionId}
                    onChange={(e) => setModalSectionId(e.target.value)}
                    disabled={!modalSemId || isLoadingSections}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: !modalSemId || isLoadingSections ? '#f8fafc' : '#fff' }}
                  >
                    <option value="">
                      {isLoadingSections
                        ? 'Loading sections...'
                        : !modalSemId
                        ? 'Select Semester first'
                        : sectionFetchError
                        ? 'Unable to load sections. Please try again.'
                        : modalSections.length === 0
                        ? 'No sections available for the selected Department, Course and Semester.'
                        : 'Select Section'}
                    </option>
                    {modalSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name} {sec.room_number ? `(${sec.room_number})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Subject & Academic Term */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Curriculum Subject *
                  </label>
                  <select
                    value={modalSubjectId}
                    onChange={(e) => setModalSubjectId(e.target.value)}
                    disabled={!modalSemId || isLoadingSubjects}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: !modalSemId || isLoadingSubjects ? '#f8fafc' : '#fff' }}
                  >
                    <option value="">
                      {isLoadingSubjects
                        ? 'Loading subjects...'
                        : !modalSemId
                        ? 'Select Semester first'
                        : subjectFetchError
                        ? 'Unable to load subjects. Please try again.'
                        : modalSubjects.length === 0
                        ? 'No subjects available for the selected Department, Course and Semester.'
                        : 'Select Subject'}
                    </option>
                    {modalSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Status helper text for empty records */}
              {!isLoadingSections && modalSemId && modalSections.length === 0 && (
                <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', fontSize: '0.75rem', color: '#854d0e', marginBottom: '1rem' }}>
                  Notice: No section cohorts exist in the database for the selected semester.
                </div>
              )}

              {!isLoadingSubjects && modalSemId && modalSubjects.length === 0 && (
                <div style={{ padding: '0.6rem 0.75rem', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', fontSize: '0.75rem', color: '#854d0e', marginBottom: '1rem' }}>
                  Notice: No subjects exist in the database for the selected course and semester.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={!isFormValid || isSubmitting}>
                  {isSubmitting ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Loader2 size={14} className="animate-spin" /> Allocating...
                    </span>
                  ) : (
                    'Confirm Assignment'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
