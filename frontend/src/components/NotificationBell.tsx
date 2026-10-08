import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../context/useNotifications';
import type { AppNotification } from '../services/api';

export default function NotificationBell() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleClick = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const iconFor = (type: string) => {
    switch (type) {
      case 'report_created':
        return '📄';
      case 'report_status_changed':
        return '🔔';
      case 'message_received':
        return '💬';
      case 'alert_published':
        return '⚠️';
      case 'account_created':
        return '👤';
      default:
        return '🔔';
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-sm btn-circle relative"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="badge badge-error badge-xs absolute top-1 right-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </label>

      {open && (
        <div
          tabIndex={0}
          className="dropdown-content z-[100] card card-compact w-80 md:w-96 bg-base-100 shadow-xl mt-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-base-300">
            <div>
              <p className="font-bold text-sm">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-base-content/60">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn btn-ghost btn-xs text-primary"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-base-content/60">
                <p className="text-3xl mb-2">🔔</p>
                No notifications yet
              </div>
            ) : (
              <ul className="divide-y divide-base-200">
                {notifications.slice(0, 20).map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-left p-3 hover:bg-base-200 transition flex gap-3 ${
                        !n.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <span className="text-xl">{iconFor(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-base-content/70 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-xs text-base-content/50 mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></span>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                      className="absolute right-2 top-2 hidden"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-base-300 p-2">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="btn btn-ghost btn-sm w-full"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}