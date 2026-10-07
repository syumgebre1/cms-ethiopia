import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

interface SidebarProps {
  activeItem?: string;
}

export default function Sidebar({ activeItem = 'dashboard' }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isStaff =
    user?.role === 'officer' ||
    user?.role === 'detective' ||
    user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = (key: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
      activeItem === key
        ? 'bg-primary text-white shadow-sm'
        : 'text-base-content/80 hover:bg-base-200'
    }`;

  return (
    <aside className="w-64 min-h-screen bg-base-100 border-r border-base-300 flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">CMS Ethiopia</p>
            <p className="text-xs text-base-content/60">
              {isAdmin
                ? 'Admin Portal'
                : isStaff
                ? 'Staff Portal'
                : 'Citizen Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-2 mb-1">
          Main
        </p>

        <NavLink to="/dashboard" className={linkClass('dashboard')}>
          <span className="text-lg">🏠</span>
          Dashboard
        </NavLink>

        <NavLink to="/dashboard" className={linkClass('submissions')}>
          <span className="text-lg">📄</span>
          {isStaff ? 'All Reports' : 'My Submissions'}
        </NavLink>

        {!isStaff && (
          <NavLink to="/report" className={linkClass('report')}>
            <span className="text-lg">🚨</span>
            Report Crime
          </NavLink>
        )}

        {isStaff && (
          <NavLink to="/dashboard" className={linkClass('cases')}>
            <span className="text-lg">📁</span>
            Cases
          </NavLink>
        )}

        <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-4 mb-1">
          Communication
        </p>

        <NavLink to="/dashboard" className={linkClass('messages')}>
          <span className="text-lg">💬</span>
          Messages
          <span className="badge badge-primary badge-xs ml-auto">3</span>
        </NavLink>

        <NavLink to="/dashboard" className={linkClass('notifications')}>
          <span className="text-lg">🔔</span>
          Notifications
        </NavLink>

        {isAdmin && (
          <>
            <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-4 mb-1">
              Admin
            </p>
            <NavLink to="/dashboard" className={linkClass('users')}>
              <span className="text-lg">👥</span>
              User Management
            </NavLink>
            <NavLink to="/dashboard" className={linkClass('alerts')}>
              <span className="text-lg">⚠️</span>
              Public Alerts
            </NavLink>
            <NavLink to="/dashboard" className={linkClass('audit')}>
              <span className="text-lg">📊</span>
              Audit Logs
            </NavLink>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-base-300">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-base-200">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-base-content/60 capitalize truncate">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-outline btn-sm w-full mt-3"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}