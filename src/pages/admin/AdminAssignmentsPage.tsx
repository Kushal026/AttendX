import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { academicService, userService } from '../../services';
import { FacultySubject, FacultyProfile, Subject, Section } from '../../types';
import {
  Plus,
  Trash2,
  X,
  School,
  AlertCircle,
} from 'lucide-react';

export const AdminAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<FacultySubject[]>([]);
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [asgns, facList, subs, secs] = await Promise.all([
        academicService.getFacultySubjectAssignments(),
        userService.getAllFaculty(),
        academicService.getSubjects(),
        academicService.getSections(),
      ]);
      setAssignments(asgns);
      setFaculty(facList);
      setSubjects(subs);
      setSections(secs);

      if (facList.length > 0 && !selectedFacultyId) setSelectedFacultyId(facList[0].id);
      if (subs.length > 0 && !selectedSubjectId) setSelectedSubjectId(subs[0].id);
      if (secs.length > 0 && !selectedSectionId) setSelectedSectionId(secs[0].id);
    } catch (e) {
      console.error('Failed to load assignments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedFacultyId || !selectedSubjectId || !selectedSectionId) {
      setFormError('Please select Faculty, Subject, and Section.');
      return;
    }

    setIsSubmitting(true);
    const res = await academicService.assignFacultyToSubject({
      faculty_id: selectedFacultyId,
      subject_id: selectedSubjectId,
      section_id: selectedSectionId,
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

  const columns: Column<FacultySubject>[] = [
    {
      header: 'Faculty Member',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <School size={16} color="#2563eb" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{a.faculty?.user?.full_name || 'Faculty'}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.faculty?.employee_id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Teaching Subject',
      render: (a) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{a.subject?.name || 'Subject'}</span>
          <Badge variant="primary" style={{ width: 'fit-content', marginTop: '0.15rem' }}>{a.subject?.code}</Badge>
        </div>
      ),
    },
    {
      header: 'Assigned Section',
      render: (a) => (
        <Badge variant="info">{a.section?.name || 'Section A'}</Badge>
      ),
    },
    {
      header: 'Academic Term',
      accessor: (a) => a.academic_year,
    },
    {
      header: 'Actions',
      render: (a) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDeleteAssignment(a.id)}
          icon={<Trash2 size={12} />}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Faculty & Subject Assignments"
        subtitle="Allocate teaching faculty to academic courses, curriculum subjects, and section cohorts"
        actions={
          <Button variant="primary" onClick={handleOpenModal} icon={<Plus size={16} />}>
            Assign Faculty
          </Button>
        }
      />

      <Card>
        <CardHeader title={`Active Teaching Allocations (${assignments.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading assignments from database...
            </div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No faculty subject assignments found. Click "Assign Faculty" to allocate courses to teachers.
            </div>
          ) : (
            <Table data={assignments} columns={columns} keyExtractor={(a) => a.id} />
          )}
        </CardBody>
      </Card>

      {/* Assignment Modal */}
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
              maxWidth: '500px',
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

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Faculty Professor *
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>{f.user?.full_name} ({f.employee_id})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Section Cohort *
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
