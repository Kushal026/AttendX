export type SettingCategory = 'GENERAL' | 'ATTENDANCE_RULES' | 'QR_SECURITY' | 'NOTIFICATIONS' | 'SECURITY';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: SettingCategory;
  description?: string;
  is_public: boolean;
  updated_by?: string;
  updated_at: string;
}
