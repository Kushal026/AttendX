import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { facultyService, FacultySubjectWithSections } from '../../services';
import {
  QrCode,
  BookOpen,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

type StepNumber = 1 | 2 | 3 | 4;

export const FacultyStartAttendancePage: React.FC = () => {
  const { user, facultyProfile } = useAuth();
  const navigate = useNavigate();

  const facultyId = facultyProfile?.id || user?.id || '';

  const [subjects, setSubjects] = useState<FacultySubjectWithSections[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Workflow State
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(60);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [existingActiveSessionId, setExistingActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!facultyId) return;
      setIsLoading(true);
      try {
        const data = await facultyService.getMySubjects(facultyId);
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0].id);
          if (data[0].sections.length > 0) {
            setSelectedSectionId(data[0].sections[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load faculty subjects:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSubjects();
  }, [facultyId]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeSection = activeSubject?.sections.find((sec) => sec.id === selectedSectionId);

  const handleSubjectSelect = (subId: string) => {
    setSelectedSubjectId(subId);
    setExistingActiveSessionId(null);
    setWorkflowError(null);
    const sub = subjects.find((s) => s.id === subId);
    if (sub && sub.sections.length > 0) {
      setSelectedSectionId(sub.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleNextStep = async () => {
    setWorkflowError(null);
    setExistingActiveSessionId(null);

    if (currentStep === 1) {
      if (!selectedSubjectId) {
        setWorkflowError('Please select a subject.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedSectionId) {
        setWorkflowError('Please select a section cohort.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!durationSeconds || durationSeconds < 15) {
        setWorkflowError('Please select a valid duration.');
        return;
      }

      // Backend security verification
      setIsSubmitting(true);
      const verifyRes = await facultyService.verifyAssignment(facultyId, selectedSubjectId, selectedSectionId);
      setIsSubmitting(false);

      if (!verifyRes.authorized) {
        setWorkflowError(verifyRes.error || 'Unauthorized assignment.');
        return;
      }

      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Create live Attendance Session
      setIsSubmitting(true);
      try {
        const res = await facultyService.createAttendanceSession(facultyId, {
          subject_id: selectedSubjectId,
          section_id: selectedSectionId,
          duration_seconds: durationSeconds,
        });

        if (res.success && res.session) {
          navigate(`/faculty/attendance/session/${res.session.id}`);
        } else if (res.isConflict && res.session) {
          setExistingActiveSessionId(res.session.id);
          setWorkflowError('An attendance session is already active for this class.');
        } else {
          setWorkflowError(res.error || 'Failed to start attendance session.');
        }
      } catch (e: any) {
        setWorkflowError(e.message || 'Failed to initiate attendance session.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevStep = () => {
    setWorkflowError(null);
    setExistingActiveSessionId(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepNumber);
    }
  };

  const durationOptions = [
    { label: '30 Seconds', seconds: 30, desc: 'Quick check-in for small cohorts' },
    { label: '60 Seconds (1 Min)', seconds: 60, desc: 'Standard classroom session' },
    { label: '2 Minutes', seconds: 120, desc: 'Recommended for large halls (>60 students)' },
    { label: '5 Minutes', seconds: 300, desc: 'Extended duration for lab sessions' },
  ];

  return (
    <div>
      <PageHeader
        title="Start Attendance Session"
        subtitle="Configure and launch a dynamic QR attendance session for your authorized cohort"
      />

      {/* Progress Step Indicator */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          { num: 1, label: 'Subject' },
          { num: 2, label: 'Section' },
          { num: 3, label: 'Duration' },
          { num: 4, label: 'Review & Launch' },
        ].map((step) => (
          <div
            key={step.num}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: currentStep >= step.num ? '#fff7ed' : '#f8fafc',
              border: currentStep >= step.num ? '1px solid #fed7aa' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: currentStep >= step.num ? '#ea580c' : '#cbd5e1',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.num}
            </div>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: currentStep >= step.num ? '#ea580c' : '#64748b',
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {workflowError && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: existingActiveSessionId ? '#fff7ed' : '#fef2f2',
            border: existingActiveSessionId ? '1px solid #fed7aa' : '1px solid #fecaca',
            color: existingActiveSessionId ? '#c2410c' : '#991b1b',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 600 }}>{workflowError}</span>
          </div>

          {existingActiveSessionId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/faculty/attendance/session/${existingActiveSessionId}`)}
              icon={<ExternalLink size={14} />}
            >
              View Active Session
            </Button>
          )}
        </div>
      )}

      {/* Main Multi-Step Container */}
      <Card>
        <CardBody style={{ padding: '2rem' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Loading authorized teaching assignments...
            </div>
          ) : subjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <BookOpen size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>
                No Teaching Assignments Found
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                You must have assigned subjects and sections to start an attendance session.
              </p>
            </div>
          ) : (
            <div>
              {/* STEP 1: SELECT SUBJECT */}
              {currentStep === 1 && (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Step 1: Select Teaching Subject
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Choose which assigned subject you are conducting attendance for today.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {subjects.map((sub) => {
                      const isSelected = selectedSubjectId === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => handleSubjectSelect(sub.id)}
                          style={{
                            border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                            borderRadius: '10px',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <Badge variant="primary">{sub.code}</Badge>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                              {sub.credit_hours} Credits
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                            {sub.name}
                          </h4>

                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                            {sub.department_name} • Semester {sub.semester_number}
                          </span>

                          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>
                            {sub.sections.length} Section{sub.sections.length > 1 ? 's' : ''} Allocated
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT SECTION */}
              {currentStep === 2 && (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Step 2: Select Section Cohort
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Select the classroom section for <strong>{activeSubject?.name}</strong> ({activeSubject?.code}).
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    {activeSubject?.sections.map((sec) => {
                      const isSelected = selectedSectionId === sec.id;
                      return (
                        <div
                          key={sec.id}
                          onClick={() => setSelectedSectionId(sec.id)}
                          style={{
                            border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                            borderRadius: '10px',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <Badge variant="info">{sec.name}</Badge>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Cap: {sec.capacity}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                            {sec.name}
                          </h4>

                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Room: {sec.room_number || 'Main Lecture Hall'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT DURATION */}
              {currentStep === 3 && (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Step 3: Select Attendance Window Duration
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Set the active time window for students to scan the QR code before the session automatically expires.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {durationOptions.map((opt) => {
                      const isSelected = durationSeconds === opt.seconds;
                      return (
                        <div
                          key={opt.seconds}
                          onClick={() => setDurationSeconds(opt.seconds)}
                          style={{
                            border: isSelected ? '2px solid #ea580c' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                            borderRadius: '10px',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Clock size={18} color={isSelected ? '#ea580c' : '#64748b'} />
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                              {opt.label}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                            {opt.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & LAUNCH */}
              {currentStep === 4 && (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Step 4: Review Class & Launch Dynamic QR Session
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Please verify that all class details are accurate before launching the dynamic QR attendance session.
                  </p>

                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SUBJECT</span>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0 0' }}>
                        {activeSubject?.name} ({activeSubject?.code})
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SECTION & ROOM</span>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0 0' }}>
                        {activeSection?.name} • {activeSection?.room_number || 'Room 101'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SESSION DURATION</span>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#ea580c', margin: '0.2rem 0 0' }}>
                        {durationSeconds} Seconds ({Math.round(durationSeconds / 60)} min)
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SECURITY STATUS</span>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#16a34a', margin: '0.2rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldCheck size={16} /> Cryptographically Signed
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handlePrevStep} icon={<ArrowLeft size={16} />}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  icon={currentStep === 4 ? <QrCode size={16} /> : <ArrowRight size={16} />}
                >
                  {isSubmitting
                    ? 'Launching Session...'
                    : currentStep === 4
                    ? 'START ATTENDANCE'
                    : 'Continue'}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
