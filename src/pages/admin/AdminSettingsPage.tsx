import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { settingsService } from '../../services';
import {
  Save,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AttendanceRulesState {
  ATTENDANCE_SESSION_DURATION: string;
  QR_EXPIRY_DURATION: string;
  ALLOW_DUPLICATE_SCAN: string;
  FINALIZATION_AUTO_ABSENT: string;
  LOW_ATTENDANCE_THRESHOLD: string;
  ALLOW_FACULTY_MANUAL_CLOSURE: string;
  QR_REFRESH_INTERVAL: string;
  GRACE_PERIOD_SECONDS: string;
}

interface SecurityPoliciesState {
  ENFORCE_GEO_FENCING: string;
  CAMPUS_LATITUDE: string;
  CAMPUS_LONGITUDE: string;
  GEO_FENCE_RADIUS_METERS: string;
  STUDENT_DEVICE_BINDING: string;
}

const DEFAULT_ATTENDANCE_RULES: AttendanceRulesState = {
  ATTENDANCE_SESSION_DURATION: '900', // 15 mins (in seconds)
  QR_EXPIRY_DURATION: '15', // 15 seconds per rotating token
  ALLOW_DUPLICATE_SCAN: 'false',
  FINALIZATION_AUTO_ABSENT: 'true',
  LOW_ATTENDANCE_THRESHOLD: '75', // 75%
  ALLOW_FACULTY_MANUAL_CLOSURE: 'true',
  QR_REFRESH_INTERVAL: '5', // 5 seconds
  GRACE_PERIOD_SECONDS: '60', // 1 minute
};

const DEFAULT_SECURITY_POLICIES: SecurityPoliciesState = {
  ENFORCE_GEO_FENCING: 'false',
  CAMPUS_LATITUDE: '12.9716',
  CAMPUS_LONGITUDE: '77.5946',
  GEO_FENCE_RADIUS_METERS: '250',
  STUDENT_DEVICE_BINDING: 'false',
};

export const AdminSettingsPage: React.FC = () => {
  const [rules, setRules] = useState<AttendanceRulesState>(DEFAULT_ATTENDANCE_RULES);
  const [security, setSecurity] = useState<SecurityPoliciesState>(DEFAULT_SECURITY_POLICIES);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getSettings();

      // Hydrate rules from backend settings
      const newRules = { ...DEFAULT_ATTENDANCE_RULES };
      const newSecurity = { ...DEFAULT_SECURITY_POLICIES };

      data.forEach((s) => {
        if (s.setting_key in newRules) {
          (newRules as any)[s.setting_key] = s.setting_value;
        }
        if (s.setting_key in newSecurity) {
          (newSecurity as any)[s.setting_key] = s.setting_value;
        }
      });

      setRules(newRules);
      setSecurity(newSecurity);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setErrorMessage('Failed to load configurations from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleRuleChange = (key: keyof AttendanceRulesState, val: string) => {
    setRules((prev) => ({ ...prev, [key]: val }));
  };

  const handleSecurityChange = (key: keyof SecurityPoliciesState, val: string) => {
    setSecurity((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      // Save all rules to backend via PUT /api/v1/admin/settings/:key
      const ruleEntries = Object.entries(rules);
      const securityEntries = Object.entries(security);

      const promises = [...ruleEntries, ...securityEntries].map(([key, val]) =>
        settingsService.updateSetting(key, val)
      );

      await Promise.all(promises);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err.message || 'Failed to persist settings to backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="System Settings & Policy Engine"
        subtitle="Configure dynamic QR token rotation, automated attendance rules, grace periods, and institutional thresholds"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={isLoading || isSaving}
            icon={<RotateCcw size={14} />}
          >
            Reload Defaults
          </Button>
        }
      />

      {savedSuccess && (
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
            System configuration parameters saved and updated in live database.
          </span>
        </div>
      )}

      {errorMessage && (
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
            {errorMessage}
          </span>
        </div>
      )}

      <form onSubmit={handleSaveAll}>
        <div className="grid grid-cols-1 grid-cols-2 gap-6">
          {/* 1. ATTENDANCE & QR RULES (Issue 10) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders size={18} color="#ea580c" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Attendance & QR Rules</h3>
              </div>
              <Badge variant="primary">Rule Engine</Badge>
            </CardHeader>

            <CardBody style={{ padding: '1.5rem' }}>
              {isLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading attendance rules...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Session Duration */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                        Attendance Session Duration (Seconds)
                      </label>
                      <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>
                        {Math.round(Number(rules.ATTENDANCE_SESSION_DURATION) / 60)} Minutes
                      </span>
                    </div>
                    <input
                      type="number"
                      min={60}
                      max={7200}
                      step={30}
                      value={rules.ATTENDANCE_SESSION_DURATION}
                      onChange={(e) => handleRuleChange('ATTENDANCE_SESSION_DURATION', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                      How long a lecture attendance session remains active for scanning.
                    </p>
                  </div>

                  {/* QR Expiry Duration */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                        QR Token Expiry (Seconds)
                      </label>
                      <Badge variant="info">{rules.QR_EXPIRY_DURATION}s</Badge>
                    </div>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={rules.QR_EXPIRY_DURATION}
                      onChange={(e) => handleRuleChange('QR_EXPIRY_DURATION', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                      How long a generated cryptographic dynamic QR code token remains valid before rotation.
                    </p>
                  </div>

                  {/* Low Attendance Threshold */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                        Low Attendance Threshold (%)
                      </label>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: Number(rules.LOW_ATTENDANCE_THRESHOLD) >= 75 ? '#16a34a' : '#dc2626' }}>
                        {rules.LOW_ATTENDANCE_THRESHOLD}%
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={rules.LOW_ATTENDANCE_THRESHOLD}
                      onChange={(e) => handleRuleChange('LOW_ATTENDANCE_THRESHOLD', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Students falling below this percentage are automatically flagged for attendance shortage.
                    </p>
                  </div>

                  {/* QR Refresh Interval */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b' }}>
                        Dynamic QR Refresh Rate (Seconds)
                      </label>
                      <Badge variant="neutral">{rules.QR_REFRESH_INTERVAL}s</Badge>
                    </div>
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={rules.QR_REFRESH_INTERVAL}
                      onChange={(e) => handleRuleChange('QR_REFRESH_INTERVAL', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Frequency at which the presenter screen cycles new dynamic token codes.
                    </p>
                  </div>

                  {/* Grace Period */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                      Grace Period After Expiration (Seconds)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={rules.GRACE_PERIOD_SECONDS}
                      onChange={(e) => handleRuleChange('GRACE_PERIOD_SECONDS', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Tolerance buffer allowing in-flight mobile network scan packets to be validated.
                    </p>
                  </div>

                  {/* Toggle: Prevent Duplicate Scans */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        Prevent Duplicate Student Scans
                      </span>
                      <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                        Enforces unique scan verification per student per session.
                      </p>
                    </div>
                    <select
                      value={rules.ALLOW_DUPLICATE_SCAN}
                      onChange={(e) => handleRuleChange('ALLOW_DUPLICATE_SCAN', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    >
                      <option value="false">Strict (Disallow Duplicates)</option>
                      <option value="true">Permissive (Allow Duplicates)</option>
                    </select>
                  </div>

                  {/* Toggle: Auto-Mark Absent */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        Auto-Mark Absent Upon Finalization
                      </span>
                      <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                        Automatically marks all enrolled non-scanning students as ABSENT when session finishes.
                      </p>
                    </div>
                    <select
                      value={rules.FINALIZATION_AUTO_ABSENT}
                      onChange={(e) => handleRuleChange('FINALIZATION_AUTO_ABSENT', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    >
                      <option value="true">Enabled (Auto-Mark Absent)</option>
                      <option value="false">Disabled (Manual Only)</option>
                    </select>
                  </div>

                  {/* Toggle: Faculty Manual Closure */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        Allow Faculty Manual Closure
                      </span>
                      <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                        Allows professor to finalize session early before time expires.
                      </p>
                    </div>
                    <select
                      value={rules.ALLOW_FACULTY_MANUAL_CLOSURE}
                      onChange={(e) => handleRuleChange('ALLOW_FACULTY_MANUAL_CLOSURE', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 2. SECURITY & CAMPUS POLICIES */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Security & Location Policies</h3>
              </div>
              <Badge variant="info">Security Engine</Badge>
            </CardHeader>

            <CardBody style={{ padding: '1.5rem' }}>
              {isLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading security policies...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Geo-Fencing Toggle */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        Campus Geo-Fencing Enforcement
                      </span>
                      <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                        Restricts attendance QR scans strictly to campus coordinates.
                      </p>
                    </div>
                    <select
                      value={security.ENFORCE_GEO_FENCING}
                      onChange={(e) => handleSecurityChange('ENFORCE_GEO_FENCING', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    >
                      <option value="false">Disabled (All Locations)</option>
                      <option value="true">Enabled (Strict Radius)</option>
                    </select>
                  </div>

                  {/* Campus Coordinates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Campus Latitude
                      </label>
                      <input
                        type="text"
                        value={security.CAMPUS_LATITUDE}
                        onChange={(e) => handleSecurityChange('CAMPUS_LATITUDE', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                        Campus Longitude
                      </label>
                      <input
                        type="text"
                        value={security.CAMPUS_LONGITUDE}
                        onChange={(e) => handleSecurityChange('CAMPUS_LONGITUDE', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                  </div>

                  {/* Radius */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Allowed Geo-Fence Radius (Meters)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      value={security.GEO_FENCE_RADIUS_METERS}
                      onChange={(e) => handleSecurityChange('GEO_FENCE_RADIUS_METERS', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Maximum distance permitted from center campus point for valid scans.
                    </p>
                  </div>

                  {/* Student Device Binding */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        Student Device Hardware Fingerprint Binding
                      </span>
                      <p style={{ fontSize: '0.725rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                        Binds student account to single physical mobile phone to prevent proxy attendance.
                      </p>
                    </div>
                    <select
                      value={security.STUDENT_DEVICE_BINDING}
                      onChange={(e) => handleSecurityChange('STUDENT_DEVICE_BINDING', e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  </div>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                      disabled={isLoading || isSaving}
                      icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    >
                      {isSaving ? 'Saving Configurations...' : 'Save All Settings & Policy Engine'}
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
};
