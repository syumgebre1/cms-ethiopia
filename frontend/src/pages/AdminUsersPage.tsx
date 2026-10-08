import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { adminApi, type AdminUser } from '../services/api';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Create form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'officer' | 'detective' | 'admin'>(
    'officer'
  );
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listUsers();
      setUsers(res.data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formEmail || !formPassword || !formFullName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createUser({
        email: formEmail,
        password: formPassword,
        full_name: formFullName,
        phone: formPhone || undefined,
        role: formRole,
      });
      // Reset form
      setFormEmail('');
      setFormPassword('');
      setFormFullName('');
      setFormPhone('');
      setFormRole('officer');
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (user: AdminUser) => {
    try {
      await adminApi.updateUser(user.id, { is_locked: !user.is_locked });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.full_name}?`)) return;
    try {
      await adminApi.deleteUser(user.id);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    const pwd = window.prompt(`New password for ${user.full_name}?`);
    if (!pwd) return;
    if (pwd.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await adminApi.resetPassword(user.id, pwd);
      alert('Password reset successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-error';
      case 'detective':
        return 'badge-info';
      case 'officer':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="users" />

      <div className="flex-1 min-w-0">
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold">User Management</h1>
            <p className="text-xs text-base-content/60">
              Manage officers, detectives, and admins
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm"
          >
            + Create User
          </button>
        </header>

        <main className="p-4 lg:p-8">
          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
            </div>
          )}

          <div className="card bg-base-100 shadow-sm">
            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-base-content/60">No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name / Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="hover">
                        <td>
                          <div>
                            <p className="font-medium">{u.full_name}</p>
                            <p className="text-xs text-base-content/60">
                              {u.email}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm capitalize ${roleBadgeColor(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.is_locked ? (
                            <span className="badge badge-error badge-sm">
                              Locked
                            </span>
                          ) : (
                            <span className="badge badge-success badge-sm">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="text-xs text-base-content/60">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => handleToggleLock(u)}
                              className="btn btn-ghost btn-xs"
                              title={u.is_locked ? 'Unlock' : 'Lock'}
                            >
                              {u.is_locked ? '🔓' : '🔒'}
                            </button>
                            <button
                              onClick={() => handleResetPassword(u)}
                              className="btn btn-ghost btn-xs"
                              title="Reset password"
                            >
                              🔑
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              className="btn btn-ghost btn-xs text-error"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Create New User</h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Full Name *</span>
                </label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Officer Name"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Email *</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="officer@cms.com"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Phone</span>
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+251..."
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Role *</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) =>
                    setFormRole(
                      e.target.value as 'officer' | 'detective' | 'admin'
                    )
                  }
                  className="select select-bordered w-full"
                >
                  <option value="officer">Officer</option>
                  <option value="detective">Detective</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Temporary Password *
                  </span>
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input input-bordered w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">
                  Share this with the user — they can change it after login.
                </p>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
}