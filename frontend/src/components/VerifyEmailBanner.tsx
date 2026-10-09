import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { authApi } from '../services/api';

export default function VerifyEmailBanner() {
  const { user, updateUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Hide banner if:
  // - not logged in
  // - user is verified
  // - user is NOT a citizen (staff auto-verified)
  if (!user || user.is_verified || user.role !== 'citizen') {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setMessage('');
    setError('');

    try {
      const res = await authApi.sendVerification();
      setMessage(res.message || 'Verification code sent!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-warning/15 border-b border-warning/30 px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="text-xl shrink-0">⚠️</span>

      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-sm text-warning-content">
          Verify your email
        </p>
        <p className="text-xs text-base-content/70">
          Verify to unlock crime reporting and contact with the police
          department.
        </p>
        {message && (
          <p className="text-xs text-success mt-1">✅ {message}</p>
        )}
        {error && <p className="text-xs text-error mt-1">⚠️ {error}</p>}
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleResend}
          disabled={sending}
          className="btn btn-ghost btn-xs"
        >
          {sending ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            'Resend code'
          )}
        </button>
        <Link to="/verify-email" className="btn btn-warning btn-xs">
          Verify Now
        </Link>
      </div>
    </div>
  );
}