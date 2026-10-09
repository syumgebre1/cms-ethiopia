import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function PendingApprovalBanner() {
  const { user } = useAuth();

  if (!user || user.is_verified || user.role !== 'citizen') {
    return null;
  }

  return (
    <div className="bg-warning/15 border-b border-warning/30 px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="text-xl shrink-0">⏳</span>

      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-sm text-warning-content">
          Account pending approval
        </p>
        <p className="text-xs text-base-content/70">
          Your registration is waiting for review by the police department.
          You'll be able to report crimes and contact officers once approved.
        </p>
      </div>

      <Link to="/dashboard" className="btn btn-warning btn-xs shrink-0">
        Got it
      </Link>
    </div>
  );
}