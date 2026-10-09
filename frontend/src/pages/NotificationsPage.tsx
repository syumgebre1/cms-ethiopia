import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { useNotifications } from '../context/useNotifications';
import type { AppNotification } from '../services/api';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    remove,
    clearAll,
  } = useNotifications();

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

  const handleClick = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) navigate(n.link);
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
    <DashboardLayout
      activeItem="notifications"
      title="Notifications"
      actions={
        unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            className="btn btn-ghost btn-xs"
            title="Mark all as read"
          >
            ✓ All
          </button>
        ) : null
      }
    >
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Desktop header */}
        <div className="hidden lg:flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-base-content/60">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount !== 1 ? 's' : ''
                  }`
                : 'All caught up'}
            </p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn btn-ghost btn-sm"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all notifications?')) clearAll();
                }}
                className="btn btn-outline btn-sm"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card bg-base-100 shadow-sm">
            <EmptyState
              icon="🔔"
              title="You're all caught up!"
              description="You'll see updates here when there's activity on your reports, new messages arrive, or public alerts are published."
              actionLabel="Back to Dashboard"
              actionLink="/dashboard"
              variant="card"
            />
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm">
            <ul className="divide-y divide-base-300">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 p-4 hover:bg-base-200 transition cursor-pointer ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <span className="text-2xl shrink-0">
                    {iconFor(n.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">
                        {n.title}
                        {!n.is_read && (
                          <span className="ml-2 badge badge-primary badge-xs">
                            new
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-base-content/50 shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-sm text-base-content/70 mt-1">
                        {n.body}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(n.id);
                    }}
                    className="btn btn-ghost btn-xs"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}