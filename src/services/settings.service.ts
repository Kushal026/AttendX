import { SystemSetting } from '../types';
import { API_BASE } from './api.config';

class SettingsService {
  async getSettings(): Promise<SystemSetting[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`);
      if (res.ok) {
        const data = await res.json();
        return data.settings || [];
      }
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
    }
    return [];
  }

  async updateSetting(key: string, value: string): Promise<SystemSetting | undefined> {
    try {
      const res = await fetch(`${API_BASE}/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_value: value }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.setting;
      }
    } catch (err) {
      console.error('Failed to update system setting:', err);
    }
    return undefined;
  }
}

export const settingsService = new SettingsService();
