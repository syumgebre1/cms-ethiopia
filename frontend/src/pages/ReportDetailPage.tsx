import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { reportApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import { downloadReportPdf } from '../utils/reportPdf';
import type { Report } from '../types';

const URGENCY_BADGE: Record<string, string> = {
  low: 'badge-ghost',
  medium: 'badge-info',
  high: 'badge-warning',
  critical: 'badge-error',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  under_review: 'badge-info',
  escalated: 'badge-error',
  resolved: 'badge-success',
  rejected: 'badge-ghost',
};

export default function ReportDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const isStaff =
    user?.role === 'officer' ||
    user?.role === 'detective' ||
    user?.role === 'admin';

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await reportApi.getById(id);
      setReport(res.data.report);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      setUpdating(true);
      const res = await reportApi.updateStatus(id, newStatus);
      setReport(res.data.report);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    downloadReportPdf(report);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex">
        <Sidebar activeItem="submissions" />
        <div className="flex-1 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-base-200 flex">
        <Sidebar activeItem="submissions" />
        <div className="flex-1 p-8">
          <div className="alert alert-error">
            <span>{error || 'Report not found'}</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost mt-4"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="submissions" />

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              Report #{report.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-base-content/60">
              Submitted on{' '}
              {new Date(report.createdAt).toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          </div>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            className="btn btn-primary btn-sm gap-2"
            title="Download printable PDF"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download PDF
          </button>
        </header>

        <main className="p-4 lg:p-8 max-w-4xl">
          {/* Status banner */}
          <div className="card bg-base-100 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`badge badge-lg ${
                  STATUS_BADGE[report.status] || 'badge-ghost'
                }`}
              >
                Status: {t(`status.${report.status}`)}
              </span>
              <span
                className={`badge badge-lg ${
                  URGENCY_BADGE[report.urgency] || 'badge-ghost'
                }`}
              >
                {t(`report.urgency_${report.urgency}`)}
              </span>
              {report.is_anonymous && (
                <span className="badge badge-lg badge-warning">
                  Anonymous
                </span>
              )}
              {report.latitude && report.longitude && (
                <span className="badge badge-lg badge-success gap-1">
                  📍 GPS Captured
                </span>
              )}
            </div>
          </div>

          {/* Report details */}
          <div className="card bg-base-100 shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">{report.crime_type}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs uppercase text-base-content/50 font-semibold mb-1">
                  Location
                </p>
                <p className="font-medium">📍 {report.location}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-base-content/50 font-semibold mb-1">
                  Urgency
                </p>
                <p className="font-medium capitalize">{report.urgency}</p>
              </div>
            </div>

            {report.latitude && report.longitude && (
              <div className="mb-6">
                <p className="text-xs uppercase text-base-content/50 font-semibold mb-1">
                  GPS Coordinates
                </p>
                <p className="font-mono text-sm">
                  {Number(report.latitude).toFixed(6)},{' '}
                  {Number(report.longitude).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary text-xs mt-1 inline-block"
                >
                  Open in Google Maps →
                </a>
              </div>
            )}

            <div>
              <p className="text-xs uppercase text-base-content/50 font-semibold mb-2">
                Description
              </p>
              <p className="whitespace-pre-wrap text-base-content/90">
                {report.description}
              </p>
            </div>
          </div>

          {/* Reporter info */}
          <div className="card bg-base-100 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Reporter Information</h2>

            {report.is_anonymous || !report.reporter ? (
              <div className="alert alert-warning">
                <span>
                  This report was submitted anonymously. No reporter information
                  available.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase text-base-content/50 font-semibold mb-1">
                    Name
                  </p>
                  <p className="font-medium">{report.reporter.full_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-base-content/50 font-semibold mb-1">
                    Email
                  </p>
                  <p className="font-medium">{report.reporter.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-base-content/50 font-semibold mb-1">
                    Phone
                  </p>
                  <p className="font-medium">
                    {report.reporter.phone || '—'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Staff actions */}
          {isStaff && (
            <div className="card bg-base-100 shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Officer Actions</h2>
              <p className="text-xs text-base-content/60 mb-4">
                Update this report's status. The reporter will see the change
                on their dashboard.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'pending', label: 'Pending', color: 'btn-warning' },
                  {
                    value: 'under_review',
                    label: 'Under Review',
                    color: 'btn-info',
                  },
                  { value: 'escalated', label: 'Escalate', color: 'btn-error' },
                  { value: 'resolved', label: 'Resolve', color: 'btn-success' },
                  { value: 'rejected', label: 'Reject', color: 'btn-ghost' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    disabled={updating || report.status === s.value}
                    className={`btn ${s.color} btn-sm`}
                  >
                    {report.status === s.value && '✓ '}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}