import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { authApi } from '../services/api';
import Sidebar from '../components/Sidebar';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="profile" />

      <div className="flex-1 min-w-0">
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 sticky top-0 z-10">
          <h1 className="text-lg font-bold">Profile</h1>
          <p className="text-xs text-base-content/60">
            Manage your account settings
          </p>
        </header>

        <main className="p-4 lg:p-8 max-w-2xl">
          {/* User info card */}
          <div className="card bg-base-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.full_name}</h2>
                <p className="text-sm text-base-content/60">{user?.email}</p>
                <span className="badge badge-primary badge-sm capitalize mt-1">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Change password card */}
          <div className="card bg-base-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Change Password</h2>

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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Current Password *
                  </span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="input input-bordered w-full"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    New Password *
                  </span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input input-bordered w-full"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Confirm New Password *
                  </span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="input input-bordered w-full"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}