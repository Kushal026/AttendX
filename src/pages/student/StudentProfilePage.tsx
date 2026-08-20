import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  Save,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, studentProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [parentName, setParentName] = useState(studentProfile?.parent_name || '');
  const [parentContact, setParentContact] = useState(studentProfile?.parent_contact || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setEditError('Photo file size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;
    setIsSaving(true);
    setEditError(null);

    try {
      const res = await userService.updateStudent(studentProfile.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      if (res.success) {
        setEditSuccess(true);
        setIsEditing(false);
        setTimeout(() => setEditSuccess(false), 3500);
      } else {
        setEditError(res.error || 'Failed to update student profile.');
      }
    } catch (err: any) {
      setEditError(err.message || 'An error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditError(null);
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setAvatarUrl(user?.avatar_url || '');
  };

  return (
    <div>
      <PageHeader
        title="Student Academic Profile"
        subtitle="Identity credentials, institutional registration, and parent contact details"
        breadcrumbs={[{ label: 'Student' }, { label: 'Academic Profile' }]}
        actions={
          !isEditing ? (
            <Button variant="primary" onClick={() => setIsEditing(true)} icon={<Edit2 size={16} />}>
              Edit Profile
            </Button>
          ) : null
        }
      />

      {editSuccess && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
          className="animate-fade-in"
        >
          <CheckCircle2 size={20} color="#16a34a" />
          <span style={{ color: '#166534', fontWeight: 600, fontSize: '0.875rem' }}>
            Profile details updated successfully.
          </span>
        </div>
      )}

      {editError && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} color="#dc2626" />
          <span style={{ color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
            {editError}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 grid-cols-3 gap-6">
        {/* Profile Identity Card */}
        <Card variant="glass">
          <CardBody style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ position: 'relative', width: '96px', margin: '0 auto 1rem auto' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #f97316',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '2rem',
                    border: '4px solid #bfdbfe',
                    margin: '0 auto',
                  }}
                >
                  {fullName.charAt(0) || 'S'}
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{fullName || user?.full_name}</h3>
            <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
              {studentProfile?.course_name || 'Degree Program'}
            </p>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Badge variant="success">Enrolled Student</Badge>
              <Badge variant="primary">{studentProfile?.section_name || 'Section A'}</Badge>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'left',
                fontSize: '0.8125rem',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <Mail size={16} color="var(--text-muted)" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                <Phone size={16} color="var(--text-muted)" />
                <span>{phone || 'No phone registered'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} color="var(--text-muted)" />
                <span>Batch: {studentProfile?.batch_year || '2024-2028'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Academic Details / Edit Form */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card>
            <CardHeader title={isEditing ? 'Edit Profile Details' : 'Institutional Registration Details'} />
            <CardBody>
              {isEditing ? (
                <form onSubmit={handleSaveProfile}>
                  {/* Photo Edit */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Profile Photo
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={14} /> Upload Image
                        <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fff', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 012-3456"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Emergency / Parent Contact Name
                      </label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Parent / Guardian Name"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={parentContact}
                        onChange={(e) => setParentContact(e.target.value)}
                        placeholder="+1 (555) 998-1122"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Button variant="outline" type="button" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSaving}
                      icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    >
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted">Roll Number</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                      {studentProfile?.roll_number || 'N/A'}
                    </h4>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted">University Register Number</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                      {studentProfile?.register_number || studentProfile?.roll_number || 'N/A'}
                    </h4>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted">Department</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                      {studentProfile?.department_name || 'Engineering'}
                    </h4>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted">Program & Term</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                      {studentProfile?.course_name || 'B.Tech'} (Sem {studentProfile?.semester_number || 1})
                    </h4>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted">Emergency / Parent Contact</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
                      {parentName || studentProfile?.parent_name || 'David Walker'}
                    </h4>
                    <span className="text-xs text-secondary">{parentContact || studentProfile?.parent_contact || '+1 (555) 998-1122'}</span>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted">Security Status</span>
                    <div className="flex items-center gap-1.5" style={{ marginTop: '0.25rem' }}>
                      <Shield size={16} color="var(--success-solid)" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--success-solid)' }}>
                        Account Active & Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
