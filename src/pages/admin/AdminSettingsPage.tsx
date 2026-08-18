import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { settingsService } from '../../services';
import { SystemSetting } from '../../types';
import { Settings, Save, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (id: string, newVal: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, setting_value: newVal } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const setting of settings) {
      await settingsService.updateSetting(setting.id, setting.setting_value);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div>
      <PageHeader
        title="System Settings & Policy Engine"
        subtitle="Configure dynamic QR token expiration, automated attendance rules, grace periods, and geo-fencing"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
      />

      {savedSuccess && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success-border)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={20} color="var(--success-solid)" />
          <span style={{ color: 'var(--success-text)', fontWeight: 600, fontSize: '0.875rem' }}>
            System configuration parameters saved successfully.
          </span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 grid-cols-2 gap-6">
          {/* Attendance Rules & Timers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings size={18} color="var(--primary-500)" />
                <h3>Attendance & QR Rules</h3>
              </div>
              <Badge variant="primary">Rule Engine</Badge>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <p className="text-muted text-sm">Loading configurations...</p>
              ) : (
                settings
                  .filter((s) => s.category === 'ATTENDANCE_RULES' || s.category === 'QR_SECURITY')
                  .map((setting) => (
                    <div key={setting.id} style={{ marginBottom: '1.25rem' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                        <span className="form-label" style={{ fontFamily: 'var(--font-mono)' }}>
                          {setting.setting_key}
                        </span>
                        <Badge variant="neutral">{setting.category}</Badge>
                      </div>
                      <Input
                        value={setting.setting_value}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        helperText={setting.description}
                      />
                    </div>
                  ))
              )}
            </CardBody>
          </Card>

          {/* Security & Geo-Fencing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} color="var(--accent-cyan)" />
                <h3>Security & Location Policies</h3>
              </div>
              <Badge variant="info">Security</Badge>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <p className="text-muted text-sm">Loading configurations...</p>
              ) : (
                settings
                  .filter((s) => s.category === 'SECURITY' || s.category === 'GENERAL')
                  .map((setting) => (
                    <div key={setting.id} style={{ marginBottom: '1.25rem' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                        <span className="form-label" style={{ fontFamily: 'var(--font-mono)' }}>
                          {setting.setting_key}
                        </span>
                        <Badge variant="neutral">{setting.category}</Badge>
                      </div>
                      <Input
                        value={setting.setting_value}
                        onChange={(e) => handleValueChange(setting.id, e.target.value)}
                        helperText={setting.description}
                      />
                    </div>
                  ))
              )}

              <div style={{ marginTop: '2rem' }}>
                <Button type="submit" variant="primary" icon={<Save size={18} />}>
                  Save All Configuration Settings
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
};
