import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { studentService, ScanAttendanceResult } from '../../services';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Camera,
  CameraOff,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Globe,
  Laptop,
  VideoOff,
  Flashlight,
  FlashlightOff,
} from 'lucide-react';

export type CameraPermissionState =
  | 'NOT_REQUESTED'
  | 'INITIALIZING'
  | 'SCANNING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_IN_USE'
  | 'UNSUPPORTED'
  | 'ERROR';

type PermissionTab = 'android' | 'ios' | 'desktop';

export const StudentScanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cameraState, setCameraState] = useState<CameraPermissionState>('NOT_REQUESTED');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanAttendanceResult | null>(null);

  // Multi-camera and hardware features
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [permissionTab, setPermissionTab] = useState<PermissionTab>('android');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Determine user device type for contextual default instructions tab
  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setPermissionTab('ios');
    } else if (/Android/i.test(ua)) {
      setPermissionTab('android');
    } else {
      setPermissionTab('desktop');
    }
  }, []);

  // Secure context and capability pre-check
  const verifyBrowserSupport = (): boolean => {
    // 1. Check if mediaDevices API is supported
    if (!navigator?.mediaDevices?.getUserMedia) {
      // Check if blocked specifically due to insecure HTTP context
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        setCameraState('UNSUPPORTED');
        setErrorMessage(
          'Camera access requires a secure connection (HTTPS). Browsers block camera streaming on unencrypted HTTP connections.'
        );
        return false;
      }

      setCameraState('UNSUPPORTED');
      setErrorMessage(
        'Your browser does not support camera access (getUserMedia API is unavailable). Please use an updated version of Chrome, Safari, or Edge.'
      );
      return false;
    }
    return true;
  };

  const stopScanner = async () => {
    // Turn off torch if active
    if (isTorchOn && html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({ advanced: [{ torch: false } as any] });
      } catch {
        // ignore
      }
      setIsTorchOn(false);
    }

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

    // Stop any leftover media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startScanner = async (preferredCameraId?: string) => {
    if (!verifyBrowserSupport()) return;

    setCameraState('INITIALIZING');
    setErrorMessage('');
    setIsTorchSupported(false);
    setIsTorchOn(false);
    isProcessingRef.current = false;

    // Small delay to ensure DOM container #qr-reader is mounted
    setTimeout(async () => {
      try {
        const element = document.getElementById('qr-reader');
        if (!element) return;

        // Clean up previous instance if running
        await stopScanner();

        // Enumerate available video input devices
        let cameras: CameraDevice[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
          setAvailableCameras(cameras);
        } catch (e) {
          console.warn('Could not enumerate cameras prior to permission request:', e);
        }

        const html5QrCode = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.72);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        };

        // Determine camera target:
        // 1. Explicit camera ID if chosen by user
        // 2. Otherwise request environment/rear camera on mobile
        let cameraConfig: any = { facingMode: 'environment' };

        if (preferredCameraId) {
          cameraConfig = { deviceId: { exact: preferredCameraId } };
        } else if (cameras.length > 0) {
          // If cameras are already enumerated, find the environment/rear camera
          const rearCam = cameras.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('environment') ||
              c.label.toLowerCase().includes('0')
          );
          if (rearCam) {
            cameraConfig = { deviceId: { exact: rearCam.id } };
            setSelectedCameraId(rearCam.id);
          } else {
            cameraConfig = { facingMode: 'environment' };
            setSelectedCameraId(cameras[0].id);
          }
        }

        await html5QrCode.start(
          cameraConfig,
          config,
          onScanSuccess,
          onScanFailure
        );

        setCameraState('SCANNING');

        // Check if torch/flashlight is supported on active stream
        try {
          const videoElem = document.querySelector('#qr-reader video') as HTMLVideoElement | null;
          if (videoElem && videoElem.srcObject) {
            const stream = videoElem.srcObject as MediaStream;
            mediaStreamRef.current = stream;
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && typeof (videoTrack as any).getCapabilities === 'function') {
              const capabilities = (videoTrack as any).getCapabilities();
              if (capabilities.torch) {
                setIsTorchSupported(true);
              }
            }
          }
        } catch {
          // Torch detection is optional
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        classifyAndSetCameraError(err);
      }
    }, 150);
  };

  // Classify standard WebRTC and browser permission exceptions
  const classifyAndSetCameraError = (err: any) => {
    const errorName = err?.name || '';
    const errString = (err?.message || err?.toString() || '').toLowerCase();

    // 1. Permission Denied
    if (
      errorName === 'NotAllowedError' ||
      errorName === 'PermissionDeniedError' ||
      errString.includes('permission') ||
      errString.includes('denied') ||
      errString.includes('notallowed') ||
      errString.includes('dismissed')
    ) {
      setCameraState('PERMISSION_DENIED');
      setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings to scan attendance.');
      return;
    }

    // 2. Camera Unavailable / Not Found
    if (
      errorName === 'NotFoundError' ||
      errorName === 'DevicesNotFoundError' ||
      errString.includes('notfound') ||
      errString.includes('nodevices') ||
      errString.includes('no camera') ||
      errString.includes('requested device not found')
    ) {
      setCameraState('CAMERA_UNAVAILABLE');
      setErrorMessage('No camera hardware was detected on this device. Please connect a camera or use a mobile smartphone.');
      return;
    }

    // 3. Camera Already in Use
    if (
      errorName === 'NotReadableError' ||
      errorName === 'TrackStartError' ||
      errorName === 'SourceUnavailableError' ||
      errString.includes('notreadable') ||
      errString.includes('already in use') ||
      errString.includes('trackstart') ||
      errString.includes('could not start video source') ||
      errString.includes('concurrent')
    ) {
      setCameraState('CAMERA_IN_USE');
      setErrorMessage('Camera is currently in use by another application or browser tab. Please close other camera apps and retry.');
      return;
    }

    // 4. Overconstrained Error (e.g. strict rear camera constraint unsupported)
    if (errorName === 'OverconstrainedError' || errString.includes('overconstrained')) {
      // Retry once with default loose facing mode
      startScanner();
      return;
    }

    // 5. Insecure Context / Unsupported
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCameraState('UNSUPPORTED');
      setErrorMessage('Camera access requires HTTPS. Please access AttendX over a secure connection.');
      return;
    }

    // Generic Error Fallback
    setCameraState('ERROR');
    setErrorMessage(err?.message || 'Unable to access camera. Please check your browser permissions and try again.');
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isTorchSupported) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Flip / Switch Camera
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    await startScanner(nextCamera.id);
  };

  // Scan detection callback:
  // Strictly delegates QR payload validation and recording to backend
  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    setCameraState('PROCESSING');

    // Immediate camera release to save battery and lock duplicate reads
    await stopScanner();

    try {
      if (!user?.id) {
        setCameraState('ERROR');
        setErrorMessage('You must be logged in as a student to mark attendance.');
        return;
      }

      // Transmit raw payload to backend attendance API
      const result = await studentService.scanAttendance(user.id, {
        qr_payload: decodedText,
        device_info: `${navigator.platform || 'Device'} • ${navigator.userAgent.slice(0, 80)}`,
      });

      if (result.success && result.attendance) {
        setScanResult(result);
        setCameraState('SUCCESS');
      } else {
        setCameraState('ERROR');
        setErrorMessage(result.error || 'Failed to mark attendance.');
      }
    } catch (e: any) {
      setCameraState('ERROR');
      setErrorMessage(e.message || 'An error occurred while submitting attendance.');
    }
  };

  const onScanFailure = (_error: any) => {
    // Normal frame scanning seeking QR code; silently ignore
  };

  useEffect(() => {
    // Automatically initialize camera on mount
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="mobile-scanner-wrapper">
      <PageHeader
        title="Dynamic QR Scanner"
        subtitle="Point your rear camera at the attendance QR code projected in class"
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. SUCCESS STATE — ATTENDANCE RECORD CONFIRMATION                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cameraState === 'SUCCESS' && scanResult?.attendance && (
        <Card
          className="animate-scale-in"
          style={{
            border: '2px solid #16a34a',
            boxShadow: '0 12px 30px -5px rgba(22, 163, 74, 0.25)',
          }}
        >
          <CardBody style={{ padding: '2.25rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 0 8px rgba(22, 163, 74, 0.12)',
              }}
            >
              <CheckCircle2 size={46} />
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
              ATTENDANCE VERIFIED & RECORDED
            </span>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.5rem' }}>
              Present in Class!
            </h2>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Your attendance record has been securely confirmed by the server.
            </p>

            {/* Attendance Details Box */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Subject
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                    {scanResult.attendance.subject_name}
                  </h4>
                </div>
                <Badge variant="primary">{scanResult.attendance.subject_code}</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', paddingTop: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Section
                  </span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                    {scanResult.attendance.section_name}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Status
                  </span>
                  <div style={{ marginTop: '0.15rem' }}>
                    <Badge variant="success">PRESENT</Badge>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Student Roll No
                  </span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                    {scanResult.attendance.roll_number || user?.email}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Marked At
                  </span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0' }}>
                    {new Date(scanResult.attendance.marked_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. ACTIVE VIEWFINDER (NOT_REQUESTED, INITIALIZING, SCANNING, PROCESSING) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(cameraState === 'NOT_REQUESTED' ||
        cameraState === 'INITIALIZING' ||
        cameraState === 'SCANNING' ||
        cameraState === 'PROCESSING') && (
        <Card className="scanner-card">
          <CardBody style={{ padding: '1.25rem', textAlign: 'center' }}>
            {/* Header pill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="#ea580c" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ea580c', letterSpacing: '0.06em' }}>
                  Mobile QR Scanner
                </span>
              </div>
              <Badge variant={cameraState === 'SCANNING' ? 'success' : 'neutral'}>
                {cameraState === 'INITIALIZING'
                  ? 'Requesting Camera...'
                  : cameraState === 'PROCESSING'
                  ? 'Verifying...'
                  : cameraState === 'SCANNING'
                  ? 'Camera Active'
                  : 'Ready'}
              </Badge>
            </div>

            {/* Viewfinder Frame */}
            <div className="scanner-viewfinder-container">
              {/* HTML5 QR reader DOM target */}
              <div id="qr-reader" />

              {/* Dynamic Target Overlay & Laser */}
              {cameraState === 'SCANNING' && (
                <div className="scanner-target-box">
                  <div className="scanner-corner scanner-corner-tl" />
                  <div className="scanner-corner scanner-corner-tr" />
                  <div className="scanner-corner scanner-corner-bl" />
                  <div className="scanner-corner scanner-corner-br" />
                  <div className="scanner-laser-beam" />
                </div>
              )}

              {/* Viewfinder Floating Quick Action Toolbar */}
              {cameraState === 'SCANNING' && (
                <div className="scanner-floating-toolbar">
                  {isTorchSupported && (
                    <button
                      type="button"
                      className={`scanner-pill-btn ${isTorchOn ? 'active' : ''}`}
                      onClick={toggleTorch}
                      title="Toggle Flashlight"
                    >
                      {isTorchOn ? <Flashlight size={14} /> : <FlashlightOff size={14} />}
                      <span>{isTorchOn ? 'Flash On' : 'Flashlight'}</span>
                    </button>
                  )}

                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      className="scanner-pill-btn"
                      onClick={switchCamera}
                      title="Switch Camera Lens"
                    >
                      <Camera size={14} />
                      <span>Flip Camera</span>
                    </button>
                  )}
                </div>
              )}

              {/* Initializing / Processing Overlay */}
              {(cameraState === 'INITIALIZING' || cameraState === 'PROCESSING' || cameraState === 'NOT_REQUESTED') && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(9, 13, 22, 0.92)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    zIndex: 15,
                    padding: '1.5rem',
                  }}
                >
                  <RefreshCw size={36} className="animate-spin" style={{ color: '#ea580c', marginBottom: '0.85rem' }} />
                  <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    {cameraState === 'PROCESSING'
                      ? 'Validating Attendance...'
                      : 'Connecting to Rear Camera...'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', maxWidth: '260px' }}>
                    {cameraState === 'PROCESSING'
                      ? 'Cryptographically verifying session token with backend'
                      : 'Please allow camera permission if prompted by your browser'}
                  </span>
                </div>
              )}
            </div>

            {/* Instruction Footer */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
                Align the dynamic QR code inside the brackets
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                <ShieldCheck size={14} color="#16a34a" />
                <span>Encrypted • Environment/Rear Camera Priority</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PERMISSION DENIED STATE — ACTIONABLE STEP-BY-STEP GUIDES         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cameraState === 'PERMISSION_DENIED' && (
        <Card style={{ border: '1px solid #fed7aa', boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.15)' }}>
          <CardBody style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
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
                margin: '0 auto 1rem',
              }}
            >
              <CameraOff size={34} />
            </div>

            <Badge variant="warning" style={{ marginBottom: '0.5rem' }}>
              Permission Blocked
            </Badge>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Camera Permission Required
            </h3>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
              AttendX needs access to your rear camera to scan dynamic QR codes. Follow the steps below to enable camera permissions:
            </p>

            {/* OS / Browser Selector Tabs */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                padding: '0.25rem',
                borderRadius: '10px',
                gap: '0.25rem',
                marginBottom: '1rem',
              }}
            >
              <button
                type="button"
                className={`role-tab-btn flex items-center justify-center gap-1 ${permissionTab === 'android' ? 'active-student' : ''}`}
                style={{ flex: 1, padding: '0.45rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPermissionTab('android')}
              >
                <Smartphone size={13} />
                <span>Android Chrome</span>
              </button>
              <button
                type="button"
                className={`role-tab-btn flex items-center justify-center gap-1 ${permissionTab === 'ios' ? 'active-student' : ''}`}
                style={{ flex: 1, padding: '0.45rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPermissionTab('ios')}
              >
                <Smartphone size={13} />
                <span>iOS Safari</span>
              </button>
              <button
                type="button"
                className={`role-tab-btn flex items-center justify-center gap-1 ${permissionTab === 'desktop' ? 'active-student' : ''}`}
                style={{ flex: 1, padding: '0.45rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setPermissionTab('desktop')}
              >
                <Laptop size={13} />
                <span>Desktop</span>
              </button>
            </div>

            {/* Tab 1: Android Chrome */}
            {permissionTab === 'android' && (
              <div className="perm-guide-card animate-fade-in">
                <div className="perm-guide-step">
                  <span className="perm-step-num">1</span>
                  <span>Tap the <strong>Lock (🔒)</strong> or <strong>Page Info</strong> icon in your Chrome address bar.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">2</span>
                  <span>Select <strong>Permissions</strong> or <strong>Site Settings</strong>.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">3</span>
                  <span>Toggle <strong>Camera</strong> access to <strong>Allow</strong>.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">4</span>
                  <span>Return here and tap <strong>Grant & Retry Camera</strong> below.</span>
                </div>
              </div>
            )}

            {/* Tab 2: iOS Safari */}
            {permissionTab === 'ios' && (
              <div className="perm-guide-card animate-fade-in">
                <div className="perm-guide-step">
                  <span className="perm-step-num">1</span>
                  <span>Tap the <strong>aA</strong> or <strong>Page Settings</strong> icon on the left side of the Safari address bar.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">2</span>
                  <span>Tap <strong>Website Settings</strong>.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">3</span>
                  <span>Set <strong>Camera</strong> to <strong>Allow</strong> or <strong>Ask</strong>.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">4</span>
                  <span>If previously disabled in iOS: Go to <strong>iPhone Settings → Safari → Camera</strong> and enable it.</span>
                </div>
              </div>
            )}

            {/* Tab 3: Desktop Chrome/Edge/Firefox */}
            {permissionTab === 'desktop' && (
              <div className="perm-guide-card animate-fade-in">
                <div className="perm-guide-step">
                  <span className="perm-step-num">1</span>
                  <span>Click the <strong>Camera / Padlock</strong> icon on the left of the browser URL bar.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">2</span>
                  <span>Change the <strong>Camera</strong> dropdown from <em>Blocked</em> to <strong>Allow</strong>.</span>
                </div>
                <div className="perm-guide-step">
                  <span className="perm-step-num">3</span>
                  <span>Reload the page or click <strong>Grant & Retry Camera</strong>.</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                Dashboard
              </Button>
              <Button variant="primary" onClick={() => startScanner()} icon={<RefreshCw size={14} />}>
                Grant & Retry Camera
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. CAMERA UNAVAILABLE / NO HARDWARE FOUND                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cameraState === 'CAMERA_UNAVAILABLE' && (
        <Card style={{ border: '1px solid #e2e8f0' }}>
          <CardBody style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <VideoOff size={34} />
            </div>

            <Badge variant="neutral" style={{ marginBottom: '0.5rem' }}>
              No Camera Detected
            </Badge>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Camera Hardware Unavailable
            </h3>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 auto 1.5rem', maxWidth: '340px' }}>
              We could not find an optical camera or video input device on this system.
            </p>

            <div className="perm-guide-card" style={{ marginBottom: '1.5rem' }}>
              <div className="perm-guide-step">
                <span className="perm-step-num">1</span>
                <span>If on desktop, connect an external USB webcam.</span>
              </div>
              <div className="perm-guide-step">
                <span className="perm-step-num">2</span>
                <span>For the best experience, open AttendX on your smartphone browser.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                Dashboard
              </Button>
              <Button variant="primary" onClick={() => startScanner()} icon={<RefreshCw size={14} />}>
                Re-check Hardware
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. CAMERA ALREADY IN USE BY ANOTHER APP                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cameraState === 'CAMERA_IN_USE' && (
        <Card style={{ border: '1px solid #fed7aa' }}>
          <CardBody style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
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
                margin: '0 auto 1rem',
              }}
            >
              <AlertTriangle size={34} />
            </div>

            <Badge variant="warning" style={{ marginBottom: '0.5rem' }}>
              Camera Busy
            </Badge>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Camera Already in Use
            </h3>

            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 auto 1.5rem', maxWidth: '340px' }}>
              Another application (such as Zoom, Microsoft Teams, FaceTime, or another browser tab) has exclusive lock on the camera.
            </p>

            <div className="perm-guide-card" style={{ marginBottom: '1.5rem' }}>
              <div className="perm-guide-step">
                <span className="perm-step-num">1</span>
                <span>Close any open video calling apps or camera tools.</span>
              </div>
              <div className="perm-guide-step">
                <span className="perm-step-num">2</span>
                <span>Close other browser tabs that may be streaming video.</span>
              </div>
              <div className="perm-guide-step">
                <span className="perm-step-num">3</span>
                <span>Tap <strong>Retry Camera</strong> below.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                Dashboard
              </Button>
              <Button variant="primary" onClick={() => startScanner()} icon={<RefreshCw size={14} />}>
                Retry Camera
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. UNSUPPORTED BROWSER OR INSECURE HTTP CONTEXT                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cameraState === 'UNSUPPORTED' && (
        <Card style={{ border: '1px solid #cbd5e1' }}>
          <CardBody style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Globe size={34} />
            </div>

            <Badge variant="neutral" style={{ marginBottom: '0.5rem' }}>
              HTTPS Secure Context Required
            </Badge>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Secure Connection Required
            </h3>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem',
                color: '#475569',
                fontSize: '0.8125rem',
                margin: '1rem 0 1.5rem',
                textAlign: 'left',
              }}
            >
              <p style={{ marginBottom: '0.5rem' }}>{errorMessage}</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Modern web standards forbid camera streaming on non-HTTPS origins to protect user privacy.
              </p>
            </div>

            <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </CardBody>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. ERROR STATE — BACKEND REJECTION OR GENERAL FAILURE               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {cameraState === 'ERROR' && (
        <Card style={{ border: '1px solid #fecaca', boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.12)' }}>
          <CardBody style={{ padding: '2.25rem 1.25rem', textAlign: 'center' }}>
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
                margin: '0 auto 1rem',
              }}
            >
              <AlertCircle size={36} />
            </div>

            <Badge variant="danger" style={{ marginBottom: '0.5rem' }}>
              Submission Rejected
            </Badge>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Unable to Mark Attendance
            </h3>

            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
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
              <Button variant="primary" onClick={() => startScanner()} icon={<RefreshCw size={14} />}>
                Try Scanning Again
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
