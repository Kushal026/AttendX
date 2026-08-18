import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { facultyService, AttendanceSessionDetail } from '../../services';
import {
  Clock,
  QrCode,
  AlertCircle,
  Lock,
  ArrowLeft,
  XCircle,
  ShieldCheck,
  CheckSquare,
  RotateCcw,
  Search,
} from 'lucide-react';

export const FacultyQRSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<AttendanceSessionDetail | null>(null);
  const [status, setStatus] = useState<'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FINALIZED'>('ACTIVE');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);

  // Finalized summary data
  const [summaryData, setSummaryData] = useState<{
    total_enrolled: number;
    total_present: number;
    total_absent: number;
    roster: Array<{
      id: string;
      student_id: string;
      student_name: string;
      roll_number: string;
      register_number?: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      method: string;
      marked_at: string;
    }>;
  } | null>(null);

  const facultyId = user?.id || '';
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Session details
  const loadSession = async () => {
    if (!facultyId || !sessionId) return;
    try {
      const data = await facultyService.getAttendanceSession(facultyId, sessionId);
      if (data) {
        setSession(data);
        setStatus(data.status as any);
        setRemainingSeconds(data.remaining_seconds);

        if (data.status === 'FINALIZED') {
          loadSummary();
        }
      } else {
        setErrorMessage('Unable to load attendance session. Please check your permissions.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!facultyId || !sessionId) return;
    const summary = await facultyService.getSessionSummary(facultyId, sessionId);
    if (summary) {
      setSummaryData({
        total_enrolled: summary.session.total_enrolled,
        total_present: summary.session.total_present,
        total_absent: summary.session.total_absent,
        roster: summary.roster,
      });
    }
  };

  useEffect(() => {
    loadSession();
  }, [facultyId, sessionId]);

  // Real-time Countdown Timer (Driven authoritatively by DB expires_at)
  useEffect(() => {
    if (status !== 'ACTIVE' || !session?.expires_at) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(async () => {
      const expiry = new Date(session.expires_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));

      setRemainingSeconds(diff);

      if (diff <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Authoritatively finalize on expiry
        handleAutoFinalizeOnExpiry();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, session?.expires_at]);

  const handleAutoFinalizeOnExpiry = async () => {
    if (!facultyId || !sessionId) return;
    setStatus('FINALIZED');
    const result = await facultyService.finalizeAttendanceSession(facultyId, sessionId);
    if (result.success) {
      await loadSummary();
    }
  };

  // Format seconds -> MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Confirm Close & Finalize Attendance
  const handleFinalizeAttendance = async () => {
    if (!facultyId || !sessionId) return;
    setIsFinalizing(true);
    try {
      const result = await facultyService.finalizeAttendanceSession(facultyId, sessionId);
      if (result.success) {
        setStatus('FINALIZED');
        setIsCloseModalOpen(false);
        await loadSummary();
      } else {
        alert(result.error || 'Failed to finalize attendance session.');
      }
    } catch (err: any) {
      alert(err.message || 'Error finalizing session');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Confirm Cancel Session
  const handleConfirmCancel = async () => {
    if (!facultyId || !sessionId) return;
    try {
      const success = await facultyService.cancelAttendanceSession(facultyId, sessionId, cancelReason);
      if (success) {
        setStatus('CANCELLED');
        setIsCancelModalOpen(false);
      } else {
        alert('Failed to cancel session.');
      }
    } catch (err: any) {
      alert(err.message || 'Error cancelling session');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <p>Loading attendance session...</p>
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <Card style={{ border: '1px solid #fecaca' }}>
          <CardBody style={{ padding: '2rem', textAlign: 'center' }}>
            <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
              Attendance Session Error
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {errorMessage || 'Attendance session not found or you do not have permission to view it.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/faculty/dashboard')} icon={<ArrowLeft size={16} />}>
              Back to Dashboard
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const qrPayloadString = session.qr_payload || JSON.stringify({
    t: session.session_token,
    sid: session.id,
    sub: session.subject.code,
    sec: session.section.name,
    exp: session.expires_at,
  });

  return (
    <div>
      <PageHeader
        title="Live Attendance Session"
        subtitle={`${session.subject.name} (${session.subject.code}) • ${session.section.name}`}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/faculty/attendance')}
              icon={<Clock size={14} />}
            >
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/faculty/attendance/start')}
              icon={<QrCode size={14} />}
            >
              Start New Session
            </Button>
          </div>
        }
      />

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* FINALIZED ATTENDANCE STATE */}
        {status === 'FINALIZED' && (
          <Card
            style={{
              border: '2px solid #0284c7',
              boxShadow: '0 12px 30px -10px rgba(2, 132, 199, 0.2)',
              marginBottom: '2rem',
            }}
          >
            <CardBody style={{ padding: '2rem 1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <ShieldCheck size={36} />
                </div>

                <Badge variant="info" style={{ marginBottom: '0.5rem' }}>
                  FINALIZED & LOCKED
                </Badge>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  Attendance Finalized
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {session.subject.name} • {session.section.name}
                </p>
              </div>

              {/* 3 Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Total Enrolled
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    {summaryData?.total_enrolled ?? session.total_enrolled}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Class Strength</span>
                </div>

                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    Present (Scanned)
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
                    {summaryData?.total_present ?? session.total_present}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#15803d' }}>Verified QR Scans</span>
                </div>

                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                    Absent (Auto-Marked)
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                    {summaryData?.total_absent ?? session.total_absent}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Non-Scanned</span>
                </div>
              </div>

              {/* Student Roster Breakdown with Live Search */}
              {summaryData?.roster && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Enrolled Students Attendance Roster ({summaryData.roster.length})
                    </h4>

                    {/* Instant Search Bar */}
                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search student or roll..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem 0.4rem 2rem',
                          fontSize: '0.75rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          backgroundColor: '#fff',
                        }}
                      />
                    </div>
                  </div>

                  {(() => {
                    const filteredRoster = summaryData.roster.filter((r) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.trim().toLowerCase();
                      return (
                        r.student_name.toLowerCase().includes(q) ||
                        r.roll_number.toLowerCase().includes(q) ||
                        (r.register_number && r.register_number.toLowerCase().includes(q))
                      );
                    });

                    if (filteredRoster.length === 0) {
                      return (
                        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No students found matching "{searchQuery}".</p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Roll No</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Student Name</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569' }}>Status</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Marked At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRoster.map((r, idx) => (
                              <tr key={r.id} style={{ borderBottom: idx < filteredRoster.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#0f172a' }}>{r.roll_number}</td>
                                <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>{r.student_name}</td>
                                <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                                  {r.status === 'PRESENT' ? (
                                    <Badge variant="success">PRESENT</Badge>
                                  ) : (
                                    <Badge variant="danger">ABSENT</Badge>
                                  )}
                                </td>
                                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#64748b', fontSize: '0.75rem' }}>
                                  {new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button variant="outline" onClick={() => navigate('/faculty/attendance')} icon={<Clock size={16} />}>
                  View Attendance History
                </Button>
                <Button variant="primary" onClick={() => navigate('/faculty/attendance/start')} icon={<RotateCcw size={16} />}>
                  Start Another Session
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ACTIVE / EXPIRED / CANCELLED STATE VIEW */}
        {status !== 'FINALIZED' && (
          <Card
            style={{
              border: status === 'ACTIVE' ? '2px solid #ea580c' : '1px solid #e2e8f0',
              boxShadow: status === 'ACTIVE' ? '0 12px 30px -10px rgba(234, 88, 12, 0.25)' : 'none',
            }}
          >
            <CardBody style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              {/* Header / Session Metadata */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Badge variant="primary">{session.subject.code}</Badge>
                  <Badge variant="info">{session.section.name}</Badge>
                  {status === 'ACTIVE' && (
                    <Badge variant="success">
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', marginRight: '4px' }} />
                      ATTENDANCE ACTIVE
                    </Badge>
                  )}
                  {status === 'EXPIRED' && <Badge variant="danger">ATTENDANCE EXPIRED</Badge>}
                  {status === 'CANCELLED' && <Badge variant="warning">SESSION CANCELLED</Badge>}
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                  {session.subject.name}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span>Room: {session.section.room_number || 'Main Lecture Hall'}</span>
                  <span>•</span>
                  <span>Enrolled Cohort: <strong>{session.total_enrolled} Students</strong></span>
                </div>
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: status === 'ACTIVE' ? '3px solid #ea580c' : '2px dashed #cbd5e1',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  marginBottom: '1.5rem',
                }}
              >
                {status === 'ACTIVE' ? (
                  <QRCodeSVG
                    value={qrPayloadString}
                    size={280}
                    level="H"
                    includeMargin={true}
                    style={{ display: 'block', margin: '0 auto' }}
                  />
                ) : (
                  <div style={{ position: 'relative', opacity: 0.25 }}>
                    <QRCodeSVG
                      value="EXPIRED"
                      size={280}
                      level="L"
                      includeMargin={true}
                      style={{ display: 'block', margin: '0 auto', filter: 'grayscale(100%)' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#0f172a',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Lock size={44} />
                      <span style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        QR Inactive
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown Timer Display */}
              {status === 'ACTIVE' && (
                <div
                  style={{
                    backgroundColor: '#fff7ed',
                    border: '1px solid #ffedd5',
                    borderRadius: '12px',
                    padding: '1rem',
                    maxWidth: '380px',
                    margin: '0 auto 1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#c2410c', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Clock size={14} />
                    <span>Time Remaining to Scan</span>
                  </div>
                  <div
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: remainingSeconds <= 30 ? '#dc2626' : '#ea580c',
                      margin: '0.25rem 0',
                    }}
                  >
                    {formatTime(remainingSeconds)}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9a3412', margin: 0 }}>
                    Students must scan before the timer reaches 00:00.
                  </p>
                </div>
              )}

              {/* Action Buttons for Active Session */}
              {status === 'ACTIVE' && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setIsCloseModalOpen(true)}
                    icon={<CheckSquare size={16} />}
                  >
                    CLOSE ATTENDANCE
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => setIsCancelModalOpen(true)}
                    icon={<XCircle size={16} />}
                  >
                    Cancel Session
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* CLOSE ATTENDANCE CONFIRMATION MODAL */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => !isFinalizing && setIsCloseModalOpen(false)}
        title="Close Attendance & Mark Absent"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Are you sure you want to close this attendance session?
          </p>

          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              color: '#991b1b',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}
          >
            ⚠️ Students who have not scanned the dynamic QR code will be <strong>automatically marked ABSENT</strong>. This action will finalize the attendance session.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => setIsCloseModalOpen(false)}
              disabled={isFinalizing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleFinalizeAttendance}
              disabled={isFinalizing}
              icon={isFinalizing ? <Clock size={14} className="animate-spin" /> : <CheckSquare size={14} />}
            >
              {isFinalizing ? 'Finalizing Attendance...' : 'CLOSE & FINALIZE'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CANCEL SESSION MODAL */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Attendance Session"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Are you sure you want to cancel this attendance session? The QR code will immediately be invalidated and no attendance records will be marked.
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Reason for Cancellation (Optional)
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Projector malfunction, class postponed"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Keep Session Active
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} icon={<XCircle size={14} />}>
              Confirm Cancel Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
