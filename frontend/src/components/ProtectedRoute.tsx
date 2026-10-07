import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  // Still checking if user is logged in (auto-fetch on reload)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Not logged in → redirect to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → show the protected page
  return <>{children}</>;
}