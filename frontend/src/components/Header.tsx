import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Header() {
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
            CMS Ethiopia
          </span>
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="hidden md:flex items-center gap-1">
        <Link to="/" className="btn btn-ghost btn-sm">
          Missing
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          Fugitive
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          Report
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          Events
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          Announcements
        </Link>
      </nav>

      {/* Auth buttons / User menu */}
      <div className="flex-none gap-2 ml-4">
        {user ? (
          <>
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium">{user.full_name}</span>
              <span className="text-xs text-base-content/60 capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm rounded-full px-6"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}