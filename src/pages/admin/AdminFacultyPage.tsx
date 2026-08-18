import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { userService, academicService } from '../../services';
import { FacultyProfile, Department } from '../../types';
import {
  Search,
  UserPlus,
  Edit2,
  Power,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminFacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('Ph.D. in Computer Science');
  const [officeRoom, setOfficeRoom] = useState('Room 402');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [facList, depts] = await Promise.all([
        userService.getAllFaculty({ department_id: filterDept, search }),
        academicService.getDepartments(),
      ]);
      setFaculty(facList);
      setDepartments(depts);

      if (!deptId && depts.length > 0) setDeptId(depts[0].id);
    } catch (e) {
      console.error('Failed to load faculty:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDept, search]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPassword('password123');
    setPhone('');
    setEmployeeId('');
    setDesignation('Assistant Professor');
    setQualification('Ph.D. in Engineering');
    setOfficeRoom('Room 402');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac: FacultyProfile) => {
    setIsEditing(true);
    setEditingId(fac.id);
    setFullName(fac.user?.full_name || '');
    setEmail(fac.user?.email || '');
    setPhone(fac.user?.phone || '');
    setEmployeeId(fac.employee_id);
    setDeptId(fac.department_id);
    setDesignation(fac.designation);
    setQualification(fac.qualification);
    setOfficeRoom(fac.office_room || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !employeeId.trim() || !deptId) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    if (isEditing && editingId) {
      const res = await userService.updateFaculty(editingId, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        employee_id: employeeId.trim(),
        department_id: deptId,
        designation: designation.trim(),
        qualification: qualification.trim(),
        office_room: officeRoom.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setFormError(res.error || 'Failed to update faculty member');
      }
    } else {
      if (!email.trim()) {
        setFormError('Email address is required.');
        setIsSubmitting(false);
        return;
      }

      const res = await userService.createFaculty({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        employee_id: employeeId.trim(),
        department_id: deptId,
        designation: designation.trim(),
        qualification: qualification.trim(),
        office_room: officeRoom.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setFormError(res.error || 'Failed to create faculty member');
      }
    }
  };

  const handleToggleStatus = async (facultyId: string) => {
    await userService.toggleFacultyStatus(facultyId);
    loadData();
  };

  const columns: Column<FacultyProfile>[] = [
    {
      header: 'Faculty Name & Email',
      render: (f) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{f.user?.full_name || 'Faculty Member'}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.user?.email}</span>
        </div>
      ),
    },
    {
      header: 'Employee ID',
      render: (f) => <Badge variant="primary">{f.employee_id}</Badge>,
    },
    {
      header: 'Department',
      render: (f) => (
        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.8125rem' }}>
          {f.department_name || 'Engineering'}
        </span>
      ),
    },
    {
      header: 'Designation & Office',
      render: (f) => (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{f.designation}</span>
          <span style={{ color: '#64748b' }}>{f.office_room || 'Room N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (f) => (
        <Badge variant={f.user?.is_active ? 'success' : 'danger'}>
          {f.user?.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (f) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditModal(f)}
            icon={<Edit2 size={12} />}
          >
            Edit
          </Button>

          <Button
            variant={f.user?.is_active ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleToggleStatus(f.id)}
            icon={<Power size={12} />}
          >
            {f.user?.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Faculty Management"
        subtitle="Manage professors, lecturers, academic departments, designations, and system credentials"
        actions={
          <Button variant="primary" onClick={handleOpenAddModal} icon={<UserPlus size={16} />}>
            Add Faculty
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by name, employee ID, designation..."
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
          </div>
        </CardBody>
      </Card>

      {/* Main Faculty Table */}
      <Card>
        <CardHeader title={`Faculty Members (${faculty.length})`} />
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading faculty from database...
            </div>
          ) : faculty.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No faculty members found. Click "Add Faculty" to register professors.
            </div>
          ) : (
            <Table data={faculty} columns={columns} keyExtractor={(f) => f.id} />
          )}
        </CardBody>
      </Card>

      {/* Add / Edit Faculty Modal */}
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
                {isEditing ? 'Edit Faculty Profile' : 'Add Faculty Member'}
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
                    placeholder="e.g. Dr. Alan Turing"
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
                    placeholder="alan@college.edu"
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
                      placeholder="+1 555-0144"
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
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-CSE-001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Office Room
                  </label>
                  <input
                    type="text"
                    value={officeRoom}
                    onChange={(e) => setOfficeRoom(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Faculty' : 'Add Faculty'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
