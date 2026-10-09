import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/useAuth';
import { authApi } from '../services/api';

const API_URL =
  import.meta.env.VITE_SOCKET_URL || 'https://cms-ethiopia.onrender.com';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile info
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nationalId, setNationalId] = useState(user?.national_id || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // ==================== Save profile ====================
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full name is required');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await authApi.updateProfile({
        full_name: fullName.trim(),
        phone: phone || undefined,
        national_id: nationalId || undefined,
      });
      updateUser(res.data.user);
      setProfileSuccess('Profile updated successfully');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  };

  // ==================== Avatar upload ====================
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('Image must be under 3 MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setAvatarError('');
      const res = await authApi.uploadAvatar(file);
      updateUser(res.data.user);
    } catch (err: any) {
      setAvatarError(err.response?.data?.message || 'Failed to upload');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      setUploadingAvatar(true);
      await authApi.deleteAvatar();
      if (user) updateUser({ ...user, avatar_url: null });
    } catch (err: any) {
      setAvatarError(err.response?.data?.message || 'Failed to remove');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ==================== Password ====================
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const avatarUrl = user?.avatar_url ? `${API_URL}${user.avatar_url}` : null;
  const initials =
    user?.full_name
      ?.split(' ')
      .map((s) => s.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <DashboardLayout activeItem="profile" title="Profile">
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* ==================== Avatar + basic info ==================== */}
        <div className="card bg-base-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-4 border-primary/20">
                    {initials}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <span className="loading loading-spinner loading-md text-white"></span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="flex gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn btn-primary btn-xs"
                >
                  {avatarUrl ? 'Change' : 'Upload'}
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="btn btn-ghost btn-xs"
                  >
                    Remove
                  </button>
                )}
              </div>

              {avatarError && (
                <p className="text-xs text-error text-center max-w-[140px]">
                  {avatarError}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">{user?.full_name}</h2>
              <p className="text-sm text-base-content/60">{user?.email}</p>
              <span className="badge badge-primary badge-sm capitalize mt-2">
                {user?.role}
              </span>
              <p className="text-xs text-base-content/50 mt-3">
                Member since{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== Personal information ==================== */}
        <div className="card bg-base-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">
            Personal Information
          </h2>

          {profileError && (
            <div className="alert alert-error text-sm mb-4">
              <span>{profileError}</span>
            </div>
          )}
          {profileSuccess && (
            <div className="alert alert-success text-sm mb-4">
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">Full Name *</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input input-bordered w-full bg-base-200"
              />
              <p className="text-xs text-base-content/50 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9XX XXX XXX"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    National ID
                  </span>
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Your ID number"
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
            >
              {savingProfile ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>

        {/* ==================== Change password ==================== */}
        <div className="card bg-base-100 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Change Password</h2>

          {passwordError && (
            <div className="alert alert-error text-sm mb-4">
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="alert alert-success text-sm mb-4">
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
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
              disabled={savingPassword}
              className="btn btn-primary"
            >
              {savingPassword ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}