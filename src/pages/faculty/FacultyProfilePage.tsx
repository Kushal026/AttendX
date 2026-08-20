import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { facultyService, userService, FacultyFullProfile } from '../../services';
import {
  ShieldCheck,
  Edit2,
  Save,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

export const FacultyProfilePage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const [profile, setProfile] = useState<FacultyFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Editable Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');
  const [officeRoom, setOfficeRoom] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const facultyId = facultyProfile?.id || user?.id || '';

  const loadProfile = async () => {
    if (!facultyId) return;
    setIsLoading(true);
    try {
      const data = await facultyService.getFacultyProfile(facultyId);
      setProfile(data);
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setDesignation(data.designation || '');
        setQualification(data.qualification || '');
        setOfficeRoom(data.office_room || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err) {
      console.error('Failed to load faculty profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [facultyId]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setEditError('Photo file size must be less than 2MB.');
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
    if (!profile) return;
    setIsSaving(true);
    setEditError(null);

    try {
      const res = await userService.updateFaculty(profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        designation: designation.trim() || undefined,
        qualification: qualification.trim() || undefined,
        office_room: officeRoom.trim() || undefined,
      });

      if (res.success) {
        setEditSuccess(true);
        setIsEditing(false);
        await loadProfile();
        setTimeout(() => setEditSuccess(false), 3500);
      } else {
        setEditError(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditError(null);
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDesignation(profile.designation || '');
      setQualification(profile.qualification || '');
      setOfficeRoom(profile.office_room || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  };

  return (
    <div>
      <PageHeader
        title="Faculty Academic Profile"
        subtitle="Manage official identity credentials, departmental affiliation, and contact details"
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
            Profile updated successfully in the system database.
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

      <div style={{ maxWidth: '820px' }}>
        <Card>
          <CardHeader title={isEditing ? 'Edit Faculty Details' : 'Official Faculty Credentials'} />
          <CardBody style={{ padding: '1.75rem' }}>
            {isLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                Loading profile from database...
              </div>
            ) : isEditing ? (
              /* ── EDIT PROFILE FORM ── */
              <form onSubmit={handleSaveProfile}>
                {/* Avatar Preview & Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Preview"
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f97316' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.8rem',
                          border: '3px solid #bfdbfe',
                        }}
                      >
                        {fullName.charAt(0) || 'P'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Profile Photo
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        <Camera size={14} /> Upload New Photo
                        <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                      </label>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            backgroundColor: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                      JPG, PNG or GIF up to 2MB.
                    </span>
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
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Official Email (Read-Only)
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc', color: '#64748b' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Phone Contact
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Associate Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Academic Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ph.D. in Computer Science"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Office Room / Cabin
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Technology Block 304"
                      value={officeRoom}
                      onChange={(e) => setOfficeRoom(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
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
                    {isSaving ? 'Saving Changes...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            ) : (
              /* ── VIEW PROFILE DETAILS ── */
              <div>
                {/* Header Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: '1.5rem',
                  }}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f97316' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.6rem',
                        border: '2px solid #bfdbfe',
                      }}
                    >
                      {profile?.full_name?.charAt(0) || 'P'}
                    </div>
                  )}

                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {profile?.full_name || user?.full_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <Badge variant="primary">{profile?.designation || 'Faculty Member'}</Badge>
                      <Badge variant="info">{profile?.department_name || 'Academic Faculty'}</Badge>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      EMPLOYEE ID
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.employee_id || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      EMAIL ADDRESS
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.email || user?.email}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      PHONE NUMBER
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.phone || 'Not Registered'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      ACADEMIC QUALIFICATION
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.qualification || 'Master of Engineering'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      OFFICE / CABIN
                    </span>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.25rem 0 0' }}>
                      {profile?.office_room || 'Room 304'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      ACCOUNT STATUS
                    </span>
                    <div style={{ marginTop: '0.25rem' }}>
                      <Badge variant={profile?.is_active ? 'success' : 'danger'}>
                        {profile?.is_active ? 'Active & Verified' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '2rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldCheck size={16} color="#16a34a" />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Authenticated faculty profile synced with institutional directory.
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
