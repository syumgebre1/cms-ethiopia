import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  activeItem?: string;
}

export default function Sidebar({ activeItem = 'dashboard' }: SidebarProps) {
  const { t } = useTranslation();
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
            <p className="text-sm font-bold leading-tight">{t('app.name')}</p>
            <p className="text-xs text-base-content/60">
              {isAdmin
                ? t('sidebar.admin_portal')
                : isStaff
                ? t('sidebar.staff_portal')
                : t('sidebar.citizen_portal')}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-2 mb-1">
          {t('sidebar.main')}
        </p>

        <NavLink to="/dashboard" className={linkClass('dashboard')}>
          <span className="text-lg">🏠</span>
          {t('sidebar.dashboard')}
        </NavLink>

        <NavLink to="/dashboard" className={linkClass('submissions')}>
          <span className="text-lg">📄</span>
          {isStaff ? t('sidebar.all_reports') : t('sidebar.my_submissions')}
        </NavLink>

        {!isStaff && (
          <NavLink to="/report" className={linkClass('report')}>
            <span className="text-lg">🚨</span>
            {t('sidebar.report_crime')}
          </NavLink>
        )}

        {isStaff && (
          <NavLink to="/dashboard" className={linkClass('cases')}>
            <span className="text-lg">📁</span>
            {t('sidebar.cases')}
          </NavLink>
        )}

        <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-4 mb-1">
          {t('sidebar.communication')}
        </p>

        <NavLink to="/messages" className={linkClass('messages')}>
          <span className="text-lg">💬</span>
          {t('sidebar.messages')}
          <span className="badge badge-primary badge-xs ml-auto">3</span>
        </NavLink>

        <NavLink to="/dashboard" className={linkClass('notifications')}>
          <span className="text-lg">🔔</span>
          {t('sidebar.notifications')}
        </NavLink>

        <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-4 mb-1">
          Account
        </p>

        <NavLink to="/profile" className={linkClass('profile')}>
          <span className="text-lg">⚙️</span>
          Profile
        </NavLink>

        {isAdmin && (
          <>
            <p className="text-xs uppercase text-base-content/50 font-semibold px-3 mt-4 mb-1">
              {t('sidebar.admin')}
            </p>
            <NavLink to="/admin/users" className={linkClass('users')}>
              <span className="text-lg">👥</span>
              {t('sidebar.user_management')}
            </NavLink>
            <NavLink to="/dashboard" className={linkClass('alerts')}>
              <span className="text-lg">⚠️</span>
              {t('sidebar.public_alerts')}
            </NavLink>
            <NavLink to="/dashboard" className={linkClass('audit')}>
              <span className="text-lg">📊</span>
              {t('sidebar.audit_logs')}
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
              {user?.role ? t(`role.${user.role}`) : ''}
            </p>
          </div>
        </div>

        {/* Language Switcher + Theme Toggle */}
        <div className="flex justify-center items-center gap-2 mt-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-outline btn-sm w-full mt-3"
        >
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}