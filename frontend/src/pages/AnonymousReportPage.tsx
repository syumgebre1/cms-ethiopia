import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../services/api';

const CRIME_CATEGORIES = [
  'Theft',
  'Assault',
  'Vandalism',
  'Fraud',
  'Drug-related',
  'Suspicious Activity',
  'Robbery',
  'Harassment',
  'Other',
];

export default function AnonymousReportPage() {
  const { t } = useTranslation();

  const [crimeType, setCrimeType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  // Simple captcha
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!crimeType || !description || !location) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseInt(captchaAnswer) !== captcha.answer) {
      setError('Incorrect answer to the security question. Try again.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await reportApi.createAnonymous({
        crime_type: crimeType,
        description,
        location,
        urgency,
      });
      setSubmitted(res.data.report.reference);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to submit report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
          <p className="text-base-content/70 mb-6">
            Your anonymous report has been received. Save your reference
            number:
          </p>
          <div className="bg-base-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-base-content/60 mb-1">Reference</p>
            <p className="text-lg font-mono font-bold text-primary">
              {submitted}
            </p>
          </div>
          <p className="text-xs text-base-content/60 mb-6">
            Officers will review your report. Since this was anonymous, we
            cannot contact you for follow-up.
          </p>
          <div className="flex gap-2">
            <Link to="/" className="btn btn-ghost flex-1">
              Home
            </Link>
            <button
              onClick={() => {
                setSubmitted(null);
                setCrimeType('');
                setDescription('');
                setLocation('');
                setUrgency('medium');
                setCaptchaAnswer('');
              }}
              className="btn btn-primary flex-1"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top bar */}
      <header className="bg-base-100 shadow-sm px-4 lg:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-lg font-bold">CMS Ethiopia</span>
        </Link>
        <div className="flex gap-2">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Register
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-8">
        <div className="card bg-base-100 shadow-sm p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🕵️</span>
            <div>
              <h1 className="text-2xl font-bold">Anonymous Report</h1>
              <p className="text-xs text-base-content/60">
                No login required. Your identity will not be stored.
              </p>
            </div>
          </div>

          <div className="alert alert-info text-sm my-4">
            <span>
              ℹ️ Use this form if you want to report a crime without creating
              an account. Officers will review your report, but you will not
              receive updates.
            </span>
          </div>

          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">
                  Crime Type *
                </span>
              </label>
              <select
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Select category</option>
                {CRIME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text font-medium">
                  Description *
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened in detail..."
                className="textarea textarea-bordered w-full h-32"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Location *</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bole, Addis Ababa"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">Urgency</span>
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Captcha */}
            <div className="p-4 bg-base-200 rounded-lg">
              <label className="label py-1">
                <span className="label-text font-medium">
                  Security Question *
                </span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">
                  {captcha.a} + {captcha.b} = ?
                </span>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  className="input input-bordered w-32"
                />
              </div>
              <p className="text-xs text-base-content/60 mt-2">
                We ask this to prevent spam and automated submissions.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Submit Anonymous Report'
              )}
            </button>

            <p className="text-xs text-center text-base-content/60">
              Want to track your report?{' '}
              <Link to="/register" className="link link-primary">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}