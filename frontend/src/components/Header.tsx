import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar bg-base-100 shadow-sm px-4 lg:px-8">
      {/* Logo */}
      <div className="flex-1">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-xl font-bold text-base-content">
            {t('app.name')}
          </span>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="hidden md:flex items-center gap-1">
        <Link to="/" className="btn btn-ghost btn-sm">
          {t('nav.missing')}
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          {t('nav.fugitive')}
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          {t('nav.report')}
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          {t('nav.events')}
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          {t('nav.announcements')}
        </Link>
      </nav>

      {/* Language + Theme */}
      <LanguageSwitcher />
      <ThemeToggle />

      {/* Auth buttons */}
      <div className="flex-none gap-2 ml-2">
        {user ? (
          <>
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium">{user.full_name}</span>
              <span className="text-xs text-base-content/60 capitalize">
                {t(`role.${user.role}`)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
            >
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm rounded-full px-6"
            >
              {t('nav.register')}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}