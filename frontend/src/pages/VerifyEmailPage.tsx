import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { authApi } from '../services/api';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.is_verified) {
      navigate('/dashboard');
    }
  }, [user?.is_verified, navigate]);

  // Auto-send code on mount (with cooldown check)
  useEffect(() => {
    if (!user || user.is_verified) return;
    handleResend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await authApi.sendVerification();
      setSuccess('New code sent to your email');
      setCooldown(60);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    // Auto-advance
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Backspace to go back
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    // Paste handling
    if (e.key === 'Paste') {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const next = ['', '', '', '', '', ''];
        digits.forEach((d, i) => (next[i] = d));
        setCode(next);
        if (digits.length === 6) {
          inputs.current[5]?.focus();
        }
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authApi.confirmVerification(fullCode);
      updateUser(res.data.user);
      setSuccess('✅ Email verified! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="alert alert-warning max-w-md">
          <span>Please log in to verify your email.</span>
          <Link to="/login" className="btn btn-sm">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-sm text-base-content/70 mt-2">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-medium mt-1">{user.email}</p>
        </div>

        {error && (
          <div className="alert alert-error text-sm mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success text-sm mb-4">
            <span>{success}</span>
          </div>
        )}

        {/* Code input */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-base-300 focus:border-primary rounded-lg outline-none transition"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || code.join('').length !== 6}
            className="btn btn-primary w-full"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center mt-6">
          <p className="text-sm text-base-content/60">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            className="btn btn-ghost btn-sm mt-2"
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : sending
              ? 'Sending...'
              : 'Resend code'}
          </button>
        </div>

        <div className="divider">or</div>

        <Link to="/dashboard" className="btn btn-ghost btn-sm w-full">
          Skip for now
        </Link>
        <p className="text-xs text-center text-base-content/50 mt-2">
          You can verify later from your profile
        </p>
      </div>
    </div>
  );
}