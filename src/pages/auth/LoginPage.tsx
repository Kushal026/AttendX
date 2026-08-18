import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academicService } from '../../services';
import { Department, Course, Semester, Section, UserRole } from '../../types';
import {
  QrCode,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  GraduationCap,
  School,
  Shield,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

type AuthMode = 'LOGIN' | 'SIGNUP';

export const LoginPage: React.FC = () => {
  const { login, signup, isAuthenticated, role, authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Common Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  // Faculty Specific Fields
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [qualification, setQualification] = useState('M.Tech in Computer Science');
  const [officeRoom, setOfficeRoom] = useState('Room 304');

  // Student Specific Fields
  const [rollNumber, setRollNumber] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Dropdown options from live database
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const redirectPath = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // Auto-redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'FACULTY') {
        navigate('/faculty/dashboard', { replace: true });
      } else if (role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, role, redirectPath, navigate]);

  // Load live academic structure from database for signup dropdowns
  useEffect(() => {
    const loadAcademicStructure = async () => {
      try {
        const [depts, crss, sems, secs] = await Promise.all([
          academicService.getDepartments(),
          academicService.getCourses(),
          academicService.getSemesters(),
          academicService.getSections(),
        ]);
        setDepartments(depts);
        setCourses(crss);
        setSemesters(sems);
        setSections(secs);

        if (depts.length > 0) setSelectedDeptId(depts[0].id);
        if (crss.length > 0) setSelectedCourseId(crss[0].id);
        if (sems.length > 0) setSelectedSemesterId(sems[0].id);
        if (secs.length > 0) setSelectedSectionId(secs[0].id);
      } catch (e) {
        console.error('Failed to load academic structure:', e);
      }
    };
    loadAcademicStructure();
  }, []);

  const handleModeToggle = (newMode: AuthMode) => {
    setMode(newMode);
    setFormError(null);
    setSuccessMessage(null);
    clearError();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const res = await login({ email: email.trim(), password });
    setIsLoading(false);

    if (!res.success) {
      setFormError(res.error || 'Invalid email or password.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    clearError();

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (selectedRole === 'STUDENT' && !rollNumber.trim()) {
      setFormError('Roll number is required for students.');
      return;
    }

    if (selectedRole === 'FACULTY' && !employeeId.trim()) {
      setFormError('Employee ID is required for faculty.');
      return;
    }

    setIsLoading(true);

    const res = await signup({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      role: selectedRole,
      phone: phone.trim() || undefined,
      department_id: selectedDeptId || undefined,
      employee_id: selectedRole === 'FACULTY' ? employeeId.trim() : undefined,
      designation: selectedRole === 'FACULTY' ? designation.trim() : undefined,
      qualification: selectedRole === 'FACULTY' ? qualification.trim() : undefined,
      office_room: selectedRole === 'FACULTY' ? officeRoom.trim() : undefined,
      course_id: selectedRole === 'STUDENT' ? selectedCourseId || undefined : undefined,
      semester_id: selectedRole === 'STUDENT' ? selectedSemesterId || undefined : undefined,
      section_id: selectedRole === 'STUDENT' ? selectedSectionId || undefined : undefined,
      roll_number: selectedRole === 'STUDENT' ? rollNumber.trim() : undefined,
      register_number: selectedRole === 'STUDENT' ? registerNumber.trim() : undefined,
    });

    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
    } else {
      setFormError(res.error || 'Failed to create account. Please try again.');
    }
  };

  const displayError = formError || authError;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '2rem 1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: mode === 'LOGIN' ? '440px' : '560px' }} className="animate-fade-in">
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#f97316',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(249, 115, 22, 0.35)',
              marginBottom: '0.75rem',
            }}
          >
            <QrCode size={28} />
          </div>
          <h1 style={{ color: '#0f172a', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            AttendX
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.15rem' }}>
            Smart Attendance Management Platform
          </p>
        </div>

        <Card>
          <CardBody style={{ padding: '1.75rem' }}>
            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: '#f1f5f9',
                padding: '0.25rem',
                borderRadius: '10px',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => handleModeToggle('LOGIN')}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mode === 'LOGIN' ? '#ffffff' : 'transparent',
                  color: mode === 'LOGIN' ? '#0f172a' : '#64748b',
                  boxShadow: mode === 'LOGIN' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('SIGNUP')}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: mode === 'SIGNUP' ? '#ffffff' : 'transparent',
                  color: mode === 'SIGNUP' ? '#0f172a' : '#64748b',
                  boxShadow: mode === 'SIGNUP' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {displayError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{displayError}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 1. SIGN IN FORM */}
            {/* ───────────────────────────────────────────────────────────── */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="signin-email"
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      id="signin-email"
                      type="email"
                      placeholder="name@smartattendance.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="signin-password"
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      style={{
                        width: '100%',
                        padding: '0.625rem 2.75rem 0.625rem 2.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={isLoading}
                  icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 2. SIGN UP FORM */}
            {/* ───────────────────────────────────────────────────────────── */}
            {mode === 'SIGNUP' && (
              <form onSubmit={handleSignupSubmit}>
                {/* Role Picker */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    I am registering as:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('STUDENT')}
                      style={{
                        padding: '0.6rem 0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: selectedRole === 'STUDENT' ? '2px solid #f97316' : '1px solid #e2e8f0',
                        backgroundColor: selectedRole === 'STUDENT' ? '#fff7ed' : '#ffffff',
                        color: selectedRole === 'STUDENT' ? '#ea580c' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <GraduationCap size={18} />
                      Student
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('FACULTY')}
                      style={{
                        padding: '0.6rem 0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: selectedRole === 'FACULTY' ? '2px solid #f97316' : '1px solid #e2e8f0',
                        backgroundColor: selectedRole === 'FACULTY' ? '#fff7ed' : '#ffffff',
                        color: selectedRole === 'FACULTY' ? '#ea580c' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <School size={18} />
                      Faculty
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('ADMIN')}
                      style={{
                        padding: '0.6rem 0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: selectedRole === 'ADMIN' ? '2px solid #f97316' : '1px solid #e2e8f0',
                        backgroundColor: selectedRole === 'ADMIN' ? '#fff7ed' : '#ffffff',
                        color: selectedRole === 'ADMIN' ? '#ea580c' : '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Shield size={18} />
                      Admin
                    </button>
                  </div>
                </div>

                {/* Common Basic Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Full Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                          fontSize: '0.8125rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Phone (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="tel"
                        placeholder="+1 555-0123"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                          fontSize: '0.8125rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Email Address *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="email"
                        placeholder="user@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                          fontSize: '0.8125rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 2.25rem 0.5rem 2.25rem',
                          fontSize: '0.8125rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.6rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── STUDENT ROLE SPECIFIC FIELDS ── */}
                {selectedRole === 'STUDENT' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2024CSE015"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          required
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Register / Enrollment No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. REG-2024-5510"
                          value={registerNumber}
                          onChange={(e) => setRegisterNumber(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Department *
                        </label>
                        <select
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Course / Degree *
                        </label>
                        <select
                          value={selectedCourseId}
                          onChange={(e) => setSelectedCourseId(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                        >
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Semester *
                        </label>
                        <select
                          value={selectedSemesterId}
                          onChange={(e) => setSelectedSemesterId(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                        >
                          {semesters.map((s) => (
                            <option key={s.id} value={s.id}>Semester {s.semester_number} ({s.academic_year})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Section *
                        </label>
                        <select
                          value={selectedSectionId}
                          onChange={(e) => setSelectedSectionId(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                        >
                          {sections.map((sec) => (
                            <option key={sec.id} value={sec.id}>{sec.name} {sec.room_number ? `(${sec.room_number})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FACULTY ROLE SPECIFIC FIELDS ── */}
                {selectedRole === 'FACULTY' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Employee ID *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. FAC-CSE-088"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          required
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Department *
                        </label>
                        <select
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Designation
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Associate Professor"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Qualification
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ph.D. in CS"
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                          Office / Cabin Room
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Lab Complex 402"
                          value={officeRoom}
                          onChange={(e) => setOfficeRoom(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={isLoading}
                  icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                >
                  {isLoading ? 'Creating Account...' : `Register as ${selectedRole}`}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>

        {/* Footer Security Badge */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            Protected by Supabase Auth & PostgreSQL Row-Level Security
          </span>
        </div>
      </div>
    </div>
  );
};
