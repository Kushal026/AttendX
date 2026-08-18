import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { studentService, ScanAttendanceResult } from '../../services';
import {
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type ScannerState = 'INITIALIZING' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'PERMISSION_DENIED';

export const StudentScanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scannerState, setScannerState] = useState<ScannerState>('INITIALIZING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanAttendanceResult | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  const startScanner = async () => {
    setScannerState('INITIALIZING');
    setErrorMessage('');
    isProcessingRef.current = false;

    // Small delay to ensure DOM element is mounted
    setTimeout(async () => {
      try {
        const element = document.getElementById('qr-reader');
        if (!element) return;

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {
            // ignore if not running
          }
        }

        const html5QrCode = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          onScanFailure
        );

        setScannerState('SCANNING');
      } catch (err: any) {
        console.error('Camera start error:', err);
        const errStr = err?.toString()?.toLowerCase() || '';
        if (errStr.includes('permission') || errStr.includes('denied') || errStr.includes('notallowed')) {
          setScannerState('PERMISSION_DENIED');
          setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings.');
        } else {
          setScannerState('ERROR');
          setErrorMessage('Camera is unavailable or not supported on this device. Please check your camera permissions.');
        }
      }
    }, 150);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Failed to stop QR scanner cleanly:', e);
      }
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  // SCAN LOCK: When QR is detected, immediately lock scanner and submit to backend
  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setScannerState('PROCESSING');

    // Pause/stop camera immediately to prevent multiple submissions
    await stopScanner();

    try {
      if (!user?.id) {
        setScannerState('ERROR');
        setErrorMessage('You must be logged in as a student to mark attendance.');
        return;
      }

      const result = await studentService.scanAttendance(user.id, {
        qr_payload: decodedText,
        device_info: `${navigator.platform || 'Device'} • ${navigator.userAgent.slice(0, 50)}`,
      });

      if (result.success && result.attendance) {
        setScanResult(result);
        setScannerState('SUCCESS');
      } else {
        setScannerState('ERROR');
        setErrorMessage(result.error || 'Failed to mark attendance.');
      }
    } catch (e: any) {
      setScannerState('ERROR');
      setErrorMessage(e.message || 'An error occurred while submitting attendance.');
    }
  };

  const onScanFailure = (_error: any) => {
    // Normal frame noise while seeking QR code; silently ignore
  };

  const handleRetry = () => {
    startScanner();
  };

  return (
    <div>
      <PageHeader
        title="Scan Attendance QR"
        subtitle="Point your camera at the lecture attendance QR projected by your faculty"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/dashboard')}
            icon={<ArrowLeft size={14} />}
          >
            Dashboard
          </Button>
        }
      />

      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        {/* SUCCESS STATE */}
        {scannerState === 'SUCCESS' && scanResult?.attendance && (
          <Card
            style={{
              border: '2px solid #16a34a',
              boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.2)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <CardBody style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle2 size={44} />
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                VERIFIED ATTENDANCE RECORD
              </span>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.5rem' }}>
                Attendance Marked Successfully!
              </h2>

              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Your attendance has been recorded in the database.
              </p>

              {/* Attendance Details Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SUBJECT</span>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                      {scanResult.attendance.subject_name}
                    </h4>
                  </div>
                  <Badge variant="primary">{scanResult.attendance.subject_code}</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SECTION</span>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                      {scanResult.attendance.section_name}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ATTENDANCE STATUS</span>
                    <div style={{ marginTop: '0.15rem' }}>
                      <Badge variant="success">PRESENT</Badge>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>STUDENT</span>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                      {scanResult.attendance.student_name}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>RECORDED AT</span>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                      {new Date(scanResult.attendance.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/student/dashboard')}
                icon={<ArrowLeft size={16} />}
              >
                Back to Dashboard
              </Button>
            </CardBody>
          </Card>
        )}

        {/* SCANNER VIEW (INITIALIZING, SCANNING, PROCESSING) */}
        {(scannerState === 'INITIALIZING' || scannerState === 'SCANNING' || scannerState === 'PROCESSING') && (
          <Card>
            <CardBody style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Sparkles size={16} color="#ea580c" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#ea580c', letterSpacing: '0.06em' }}>
                  Smart QR Scanner
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Align QR Code in Viewfinder
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
                Keep your camera steady and ensure the dynamic QR code is clearly visible.
              </p>

              {/* Viewfinder Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '360px',
                  margin: '0 auto 1.5rem',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '3px solid #ea580c',
                  backgroundColor: '#0f172a',
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div id="qr-reader" style={{ width: '100%' }} />

                {scannerState === 'PROCESSING' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      zIndex: 10,
                    }}
                  >
                    <RefreshCw size={36} className="animate-spin" style={{ color: '#ea580c', marginBottom: '0.75rem' }} />
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>Processing Attendance...</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Validating session and enrolling attendance
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}>
                <ShieldCheck size={14} color="#16a34a" />
                <span>Encrypted & verified against active lecture session</span>
              </div>
            </CardBody>
          </Card>
        )}

        {/* ERROR STATE */}
        {scannerState === 'ERROR' && (
          <Card style={{ border: '1px solid #fecaca' }}>
            <CardBody style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <AlertCircle size={36} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Unable to Mark Attendance
              </h3>

              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  margin: '1rem 0 1.5rem',
                }}
              >
                {errorMessage}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="primary" onClick={handleRetry} icon={<RefreshCw size={14} />}>
                  Try Scanning Again
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* PERMISSION DENIED STATE */}
        {scannerState === 'PERMISSION_DENIED' && (
          <Card style={{ border: '1px solid #fed7aa' }}>
            <CardBody style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Camera size={36} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Camera Permission Required
              </h3>

              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem auto 1.5rem', maxWidth: '380px' }}>
                AttendX requires camera access to scan the dynamic attendance QR code projected in your classroom.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="primary" onClick={handleRetry} icon={<RefreshCw size={14} />}>
                  Grant & Retry Camera
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};
