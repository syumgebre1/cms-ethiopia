import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authApi.register({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
        national_id: nationalId || undefined,
      });
      login(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
      <div className="card bg-base-100 shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-base-content">
            Create an Account
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Join the CMS Ethiopia platform
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error text-sm mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label py-1">
              <span className="label-text font-medium">Full Name *</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Citizen"
              className="input input-bordered w-full"
            />
          </div>

          <div>
            <label className="label py-1">
              <span className="label-text font-medium">Email Address *</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input input-bordered w-full"
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">Phone</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251..."
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text font-medium">National ID</span>
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="ID number"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div>
            <label className="label py-1">
              <span className="label-text font-medium">Password *</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="input input-bordered w-full"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label py-1">
              <span className="label-text font-medium">Confirm Password *</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="input input-bordered w-full"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full mt-2"
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-base-content/70">
          Already have an account?{' '}
          <Link to="/login" className="link link-primary font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}