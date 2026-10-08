import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { NotificationContext } from './NotificationContext';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import {
  notificationApi,
  type AppNotification,
} from '../services/api';

interface Props {
  children: ReactNode;
}

export function NotificationProvider({ children }: Props) {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);

  // ==================== Fetch ====================
  const refresh = useCallback(async () => {
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await notificationApi.list();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ==================== Socket listener ====================
  useEffect(() => {
    if (!socket || !user) return;

    const handleNew = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      // Show toast
      setToast(notification);
      setTimeout(() => setToast(null), 5000);
    };

    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [socket, user]);

  // ==================== Actions ====================
  const markRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  }, []);

  const remove = useCallback(
    async (id: string) => {
      try {
        await notificationApi.remove(id);
        const removed = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (removed && !removed.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Failed to remove', err);
      }
    },
    [notifications]
  );

  const clearAll = useCallback(async () => {
    try {
      await notificationApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear all', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        markRead,
        markAllRead,
        remove,
        clearAll,
      }}
    >
      {children}

      {/* Toast popup */}
      {toast && (
        <div className="toast toast-end toast-top z-[9999]">
          <div className="alert alert-info shadow-lg max-w-sm cursor-pointer">
            <div>
              <p className="font-semibold text-sm">{toast.title}</p>
              {toast.body && (
                <p className="text-xs opacity-90">{toast.body}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}