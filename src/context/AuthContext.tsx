import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, StudentProfile, FacultyProfile, LoginCredentials, SignupData } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  facultyProfile: FacultyProfile | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = () => setAuthError(null);

  /**
   * Securely hydrates user profile & associated academic profile
   * strictly from the database / Supabase — never trusting frontend-supplied role.
   */
  const hydrateUserProfile = useCallback(async (userId: string, email: string, sessionToken?: string): Promise<boolean> => {
    try {
      if (isSupabaseConfigured) {
        // Query database table public.users
        const { data: dbUser, error: userErr } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${userId},email.eq.${email}`)
          .single();

        if (userErr || !dbUser) {
          console.warn('[Auth] No record in public.users:', userErr?.message);
          setAuthError('Account authenticated, but no active role was found in the database. Please contact your administrator.');
          setUser(null);
          setStudentProfile(null);
          setFacultyProfile(null);
          setToken(null);
          return false;
        }

        if (!dbUser.is_active) {
          setAuthError('Your account has been deactivated. Please contact the administrator.');
          setUser(null);
          return false;
        }

        const appUser: User = {
          id: dbUser.id,
          email: dbUser.email,
          full_name: dbUser.full_name,
          role: dbUser.role as UserRole,
          phone: dbUser.phone || undefined,
          avatar_url: dbUser.avatar_url || undefined,
          is_active: dbUser.is_active,
          created_at: dbUser.created_at,
          updated_at: dbUser.updated_at,
        };

        setUser(appUser);
        setToken(sessionToken || `supabase_jwt_${appUser.id}`);

        // Hydrate role-specific profiles from DB
        if (appUser.role === 'STUDENT') {
          const { data: sp } = await supabase
            .from('students')
            .select(`
              *,
              department:departments(name),
              course:courses(name),
              semester:semesters(semester_number),
              section:sections(name)
            `)
            .eq('user_id', appUser.id)
            .single();

          if (sp) {
            setStudentProfile({
              id: sp.id,
              user_id: sp.user_id,
              roll_number: sp.roll_number,
              register_number: sp.register_number,
              department_id: sp.department_id,
              course_id: sp.course_id,
              semester_id: sp.semester_id,
              section_id: sp.section_id,
              batch_year: sp.batch_year,
              admission_date: sp.admission_date,
              parent_name: sp.parent_name,
              parent_contact: sp.parent_contact,
              current_gpa: sp.current_gpa ? Number(sp.current_gpa) : undefined,
              created_at: sp.created_at,
              updated_at: sp.updated_at,
              user: appUser,
              department_name: sp.department?.name,
              course_name: sp.course?.name,
              semester_number: sp.semester?.semester_number,
              section_name: sp.section?.name,
            });
          }
          setFacultyProfile(null);
        } else if (appUser.role === 'FACULTY') {
          const { data: fp } = await supabase
            .from('faculty')
            .select(`
              *,
              department:departments(name)
            `)
            .eq('user_id', appUser.id)
            .single();

          if (fp) {
            setFacultyProfile({
              id: fp.id,
              user_id: fp.user_id,
              employee_id: fp.employee_id,
              department_id: fp.department_id,
              designation: fp.designation,
              qualification: fp.qualification,
              specialization: fp.specialization,
              joining_date: fp.joining_date,
              office_room: fp.office_room,
              created_at: fp.created_at,
              updated_at: fp.updated_at,
              user: appUser,
              department_name: fp.department?.name,
            });
          }
          setStudentProfile(null);
        } else {
          setStudentProfile(null);
          setFacultyProfile(null);
        }

        return true;
      } else {
        // Fallback: Query backend API /api/v1/auth/login or localStorage
        const savedSession = localStorage.getItem('attendx_session_user');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setUser(parsed);
          setToken(`local_jwt_${parsed.id}`);
          return true;
        }
        return false;
      }
    } catch (err: any) {
      console.error('[Auth] Profile hydration error:', err);
      setAuthError(err.message || 'Error loading user profile');
      return false;
    }
  }, []);

  /**
   * Initialize and restore session on page refresh
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) {
            console.warn('[Auth] Session error:', sessionErr.message);
          }

          if (session?.user && isMounted) {
            await hydrateUserProfile(session.user.id, session.user.email || '', session.access_token);
          }
        } else {
          const savedSession = localStorage.getItem('attendx_session_user');
          if (savedSession && isMounted) {
            const parsed = JSON.parse(savedSession);
            setUser(parsed);
            setToken(`local_jwt_${parsed.id}`);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Supabase Auth State Change Listener
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(true);
          await hydrateUserProfile(session.user.id, session.user.email || '', session.access_token);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setStudentProfile(null);
          setFacultyProfile(null);
          setToken(null);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [hydrateUserProfile]);

  /**
   * Real Login (Supabase Auth & Backend API fallback)
   */
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password || '';

    try {
      // First attempt: Backend API /api/v1/auth/login (direct Prisma query)
      try {
        const apiRes = await fetch('http://localhost:5000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (apiRes.ok) {
          const resData = await apiRes.json();
          if (resData.user) {
            setUser(resData.user);
            setToken(resData.token);
            if (resData.student_profile) {
              setStudentProfile({
                ...resData.student_profile,
                department_name: resData.student_profile.department?.name,
                course_name: resData.student_profile.course?.name,
                semester_number: resData.student_profile.semester?.semester_number,
                section_name: resData.student_profile.section?.name,
                user: resData.user,
              });
            }
            if (resData.faculty_profile) {
              setFacultyProfile({
                ...resData.faculty_profile,
                department_name: resData.faculty_profile.department?.name,
                user: resData.user,
              });
            }
            localStorage.setItem('attendx_session_user', JSON.stringify(resData.user));
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch {
        // Fallback to Supabase client directly
      }

      // Second attempt: Supabase Auth direct client
      if (isSupabaseConfigured) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          const msg = signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please check your credentials.'
            : signInError.message;
          setAuthError(msg);
          setIsLoading(false);
          return { success: false, error: msg };
        }

        if (data.user) {
          const hydrated = await hydrateUserProfile(data.user.id, data.user.email || email, data.session?.access_token);
          setIsLoading(false);
          if (!hydrated) {
            await supabase.auth.signOut();
            return { success: false, error: 'Account authenticated, but no active role was found in database.' };
          }
          return { success: true };
        }
      }

      setAuthError('Authentication failed. Please verify your email and password.');
      setIsLoading(false);
      return { success: false, error: 'Invalid credentials' };
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      const errMsg = err.message || 'An unexpected error occurred during login.';
      setAuthError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  };

  /**
   * Real Signup (Registers User + Role Profile into Database & Supabase Auth)
   */
  const signup = async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // 1. Call Backend API to create user in database transaction
      const apiRes = await fetch('http://localhost:5000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const resData = await apiRes.json();

      if (!apiRes.ok) {
        const errorMsg = resData.error || 'Failed to create account.';
        setAuthError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      // 2. Also create in Supabase Auth if client is configured
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signUp({
            email: signupData.email.trim().toLowerCase(),
            password: signupData.password,
            options: {
              data: {
                full_name: signupData.full_name,
                role: signupData.role,
              },
            },
          });
        } catch {
          // ignore if already created on server
        }
      }

      // 3. Return success without auto-logging in (user must manually login)
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Signup error:', err);
      const errMsg = err.message || 'An unexpected error occurred during registration.';
      setAuthError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  };

  /**
   * Real Logout
   */
  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('attendx_session_user');
      localStorage.removeItem('attendx_supabase_auth_token');
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    } finally {
      setUser(null);
      setStudentProfile(null);
      setFacultyProfile(null);
      setToken(null);
      setAuthError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        facultyProfile,
        role: user ? user.role : null,
        token,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
