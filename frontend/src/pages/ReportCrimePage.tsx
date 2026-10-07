import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import type { Urgency } from '../types';

export default function ReportCrimePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [crimeType, setCrimeType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!crimeType || !description || !location) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await reportApi.create({
        crime_type: crimeType,
        description,
        location,
        urgency,
        is_anonymous: isAnonymous,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top navbar */}
      <header className="navbar bg-base-100 shadow-sm px-4 lg:px-8">
        <div className="flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost btn-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="flex-none">
          <span className="text-sm text-base-content/60">
            {user?.full_name}
          </span>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="card bg-base-100 shadow-sm p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary flex items-center gap-2">
            🚨 Report Potential Crime
          </h1>
          <p className="text-sm text-base-content/60 mt-2 mb-6">
            Your report will be reviewed by officers for preliminary evaluation.
            Please provide as much evidence as possible.
          </p>

          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Incident Title *
                  </span>
                </label>
                <input
                  type="text"
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  placeholder="e.g. Suspicious activity at the park"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Potential Crime Type *
                  </span>
                </label>
                <select
                  value={crimeType === '' ? '' : crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">Select category</option>
                  <option value="Theft">Theft</option>
                  <option value="Assault">Assault</option>
                  <option value="Vandalism">Vandalism</option>
                  <option value="Fraud">Fraud</option>
                  <option value="Drug-related">Drug-related</option>
                  <option value="Suspicious Activity">Suspicious Activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text font-medium">
                  Description of Incident *
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full details of what you observed, suspect descriptions, etc."
                className="textarea textarea-bordered w-full h-32"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    Incident Location *
                  </span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where did this occur?"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Urgency Level</span>
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="select select-bordered w-full"
                >
                  <option value="low">Low — Not urgent</option>
                  <option value="medium">Medium — Needs attention</option>
                  <option value="high">High — Urgent</option>
                  <option value="critical">Critical — Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text font-medium">
                  Evidence (Optional)
                </span>
              </label>
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                disabled
              />
              <p className="text-xs text-base-content/50 mt-1">
                File upload will be enabled in a future update.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="checkbox checkbox-primary"
              />
              <span className="label-text">Submit Anonymously</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full mt-4"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Submit Report'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}