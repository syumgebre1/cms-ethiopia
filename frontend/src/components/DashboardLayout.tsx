import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import VerifyEmailBanner from './VerifyEmailBanner';

interface Props {
  children: ReactNode;
  activeItem?: string;
  title?: string;
  actions?: ReactNode;
}

export default function DashboardLayout({
  children,
  activeItem = 'dashboard',
  title,
  actions,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar activeItem={activeItem} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar with hamburger */}
        <header className="lg:hidden bg-base-100 border-b border-base-300 px-3 py-2 flex items-center gap-2 sticky top-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {title && (
            <h1 className="text-base font-bold truncate flex-1">{title}</h1>
          )}

          {actions && <div className="flex gap-2">{actions}</div>}
        </header>

        {/* Verify email banner */}
        <VerifyEmailBanner />

        {/* Page content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}