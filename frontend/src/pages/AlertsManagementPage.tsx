import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import {
  alertApi,
  type PublicAlert,
  type AlertType,
  type AlertStatus,
} from '../services/api';
import { useAuth } from '../context/useAuth';

const API_BASE = 'http://localhost:5000';

const TYPE_OPTIONS: { value: AlertType; label: string; emoji: string }[] = [
  { value: 'fugitive', label: 'Fugitive', emoji: '🕵️' },
  { value: 'missing', label: 'Missing Person', emoji: '👤' },
  { value: 'wanted', label: 'Wanted for Arrest', emoji: '🚨' },
  { value: 'announcement', label: 'Announcement', emoji: '📢' },
];

const STATUS_OPTIONS: { value: AlertStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'caught', label: 'Caught' },
  { value: 'found', label: 'Found' },
  { value: 'archived', label: 'Archived' },
];

export default function AlertsManagementPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<AlertType>('fugitive');
  const [formTitle, setFormTitle] = useState('');
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formStatus, setFormStatus] = useState<AlertStatus>('active');
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertApi.list();
      setAlerts(res.data.alerts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormType('fugitive');
    setFormTitle('');
    setFormName('');
    setFormAge('');
    setFormDescription('');
    setFormLocation('');
    setFormReward('');
    setFormStatus('active');
    setFormPhoto(null);
    setFormPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (a: PublicAlert) => {
    setEditingId(a.id);
    setFormType(a.type);
    setFormTitle(a.title);
    setFormName(a.full_name || '');
    setFormAge(a.age ? String(a.age) : '');
    setFormDescription(a.description);
    setFormLocation(a.last_seen_location || '');
    setFormReward(a.reward || '');
    setFormStatus(a.status);
    setFormPhoto(null);
    setFormPhotoPreview(a.photo_url ? `${API_BASE}${a.photo_url}` : '');
    setShowModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhoto(file);
      setFormPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formTitle.trim() || !formDescription.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await alertApi.update(editingId, {
          type: formType,
          title: formTitle,
          full_name: formName || undefined,
          age: formAge ? parseInt(formAge) : undefined,
          description: formDescription,
          last_seen_location: formLocation || undefined,
          reward: formReward || undefined,
          status: formStatus,
          photo: formPhoto || undefined,
        });
      } else {
        await alertApi.create({
          type: formType,
          title: formTitle,
          full_name: formName || undefined,
          age: formAge ? parseInt(formAge) : undefined,
          description: formDescription,
          last_seen_location: formLocation || undefined,
          reward: formReward || undefined,
          status: formStatus,
          photo: formPhoto || undefined,
        });
      }
      setShowModal(false);
      resetForm();
      await loadAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (a: PublicAlert) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await alertApi.delete(a.id);
      await loadAlerts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const typeBadgeColor = (type: AlertType) => {
    switch (type) {
      case 'fugitive':
        return 'badge-error';
      case 'wanted':
        return 'badge-warning';
      case 'missing':
        return 'badge-info';
      case 'announcement':
        return 'badge-ghost';
    }
  };

  const statusBadgeColor = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'caught':
      case 'found':
        return 'badge-info';
      case 'archived':
        return 'badge-ghost';
    }
  };

  const canEdit = (a: PublicAlert) =>
    a.posted_by === user?.id || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="alerts" />

      <div className="flex-1 min-w-0">
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold">Public Alerts</h1>
            <p className="text-xs text-base-content/60">
              Manage fugitives, missing persons, and announcements
            </p>
          </div>
          <button onClick={openCreate} className="btn btn-primary btn-sm">
            + Add Alert
          </button>
        </header>

        <main className="p-4 lg:p-6">
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
            ) : alerts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">📢</p>
                <p className="font-medium">No alerts yet</p>
                <p className="text-sm text-base-content/60 mt-1">
                  Click "+ Add Alert" to create one
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Posted By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr key={a.id} className="hover">
                        <td>
                          {a.photo_url ? (
                            <img
                              src={`${API_BASE}${a.photo_url}`}
                              alt={a.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-base-200 flex items-center justify-center text-xs text-base-content/50">
                              —
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${typeBadgeColor(
                              a.type
                            )}`}
                          >
                            {a.type}
                          </span>
                        </td>
                        <td className="font-medium max-w-xs truncate">
                          {a.title}
                        </td>
                        <td className="text-sm text-base-content/70">
                          {a.full_name || '—'}
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${statusBadgeColor(
                              a.status
                            )}`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="text-xs text-base-content/60">
                          {a.poster?.full_name || 'Unknown'}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {canEdit(a) && (
                              <>
                                <button
                                  onClick={() => openEdit(a)}
                                  className="btn btn-ghost btn-xs"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(a)}
                                  className="btn btn-ghost btn-xs text-error"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
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

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingId ? 'Edit Alert' : 'Create Public Alert'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label py-1">
                    <span className="label-text font-medium">Type *</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) =>
                      setFormType(e.target.value as AlertType)
                    }
                    className="select select-bordered w-full"
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.emoji} {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label py-1">
                    <span className="label-text font-medium">Status</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as AlertStatus)
                    }
                    className="select select-bordered w-full"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Title *
                  </span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Wanted for Murder"
                  className="input input-bordered w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="label py-1">
                    <span className="label-text font-medium">
                      Full Name
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label py-1">
                    <span className="label-text font-medium">Age</span>
                  </label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="25"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Description *
                  </span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Physical description, crime details, etc."
                  className="textarea textarea-bordered w-full h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label py-1">
                    <span className="label-text font-medium">
                      Last Seen Location
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Bole, Addis Ababa"
                    className="input input-bordered w-full"
                  />
                </div>

                <div>
                  <label className="label py-1">
                    <span className="label-text font-medium">
                      Reward (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    placeholder="e.g. 50,000 ETB"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Photo
                  </span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="file-input file-input-bordered w-full"
                />
                {formPhotoPreview && (
                  <div className="mt-2">
                    <img
                      src={formPhotoPreview}
                      alt="preview"
                      className="w-32 h-32 rounded object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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
                  ) : editingId ? (
                    'Update'
                  ) : (
                    'Publish'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          ></div>
        </div>
      )}
    </div>
  );
}