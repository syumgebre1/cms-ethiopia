import { createContext } from 'react';
import type { AppNotification } from '../services/api';

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);