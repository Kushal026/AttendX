export type NotificationType = 'INFO' | 'WARNING' | 'ALERT' | 'ATTENDANCE' | 'SYSTEM';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at?: string;
  action_link?: string;
  created_at: string;
}
