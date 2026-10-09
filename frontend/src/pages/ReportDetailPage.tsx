import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { reportApi, type ReportEvidence } from '../services/api';
import { useAuth } from '../context/useAuth';
import { downloadReportPdf } from '../utils/reportPdf';
import type { Report } from '../types';

const API_BASE =
  import.meta.env.VITE_SOCKET_URL || 'https://cms-ethiopia.onrender.com';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  const handleEvidenceUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    try {
      setUploading(true);
      setUploadError('');
      await reportApi.uploadEvidence(id, Array.from(files));
      await load();
    } catch (err: any) {
      setUploadError(
        err.response?.data?.message || 'Failed to upload evidence'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!window.confirm('Delete this evidence file?')) return;
    try {
      await reportApi.deleteEvidence(evidenceId);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getFileUrl = (url: string) => `${API_BASE}${url}`;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canDeleteEvidence = (ev: ReportEvidence) => {
    return ev.uploaded_by === user?.id || user?.role === 'admin';
  };

  if (loading) {
    return (
      <DashboardLayout activeItem="submissions" title="Report">
        <div className="flex items-center justify-center py-24">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout activeItem="submissions" title="Report">
        <div className="p-8">
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
      </DashboardLayout>
    );
  }

  const evidence: ReportEvidence[] = (report as any).evidence || [];

  return (
    <DashboardLayout
      activeItem="submissions"
      title={`Report #${report.id.slice(0, 8)}`}
      actions={
        <button
          onClick={handleDownloadPdf}
          className="btn btn-primary btn-sm gap-2"
        >
          📄 <span className="hidden md:inline">Download PDF</span>
        </button>
      }
    >
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Status banner */}
        <div className="card bg-base-100 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`badge badge-lg ${
                STATUS_BADGE[report.status] || 'badge-ghost'
              }`}
            >
              {t(`status.${report.status}`)}
            </span>
            <span
              className={`badge badge-lg ${
                URGENCY_BADGE[report.urgency] || 'badge-ghost'
              }`}
            >
              {t(`report.urgency_${report.urgency}`)}
            </span>
            {report.is_anonymous && (
              <span className="badge badge-lg badge-warning">Anonymous</span>
            )}
            {report.latitude && report.longitude && (
              <span className="badge badge-lg badge-success gap-1">
                📍 GPS
              </span>
            )}
          </div>
          <p className="text-xs text-base-content/60 mt-3">
            Submitted{' '}
            {new Date(report.createdAt).toLocaleString('en-US', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
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

        {/* Evidence */}
        <div className="card bg-base-100 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              Evidence ({evidence.length})
            </h2>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt,video/mp4"
                onChange={handleEvidenceUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-primary btn-sm"
              >
                {uploading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Uploading...
                  </>
                ) : (
                  <>+ Add Evidence</>
                )}
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="alert alert-error text-sm mb-4">
              <span>{uploadError}</span>
            </div>
          )}

          {evidence.length === 0 ? (
            <div className="text-center py-12 bg-base-200 rounded-lg">
              <p className="text-4xl mb-3">📎</p>
              <p className="font-medium">No evidence uploaded</p>
              <p className="text-sm text-base-content/60 mt-1">
                Click "Add Evidence" to upload photos, documents, or videos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {evidence.map((ev) => {
                const fileUrl = getFileUrl(ev.file_url);
                const isImage = ev.file_type?.startsWith('image/');

                return (
                  <div
                    key={ev.id}
                    className="card bg-base-200 overflow-hidden group relative"
                  >
                    {isImage ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={fileUrl}
                          alt={ev.file_name}
                          className="w-full h-40 object-cover hover:opacity-90 transition"
                        />
                      </a>
                    ) : (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center h-40 bg-base-300 hover:bg-base-300/80 transition"
                      >
                        <span className="text-5xl">
                          {ev.file_type?.startsWith('video/')
                            ? '🎬'
                            : ev.file_type === 'application/pdf'
                            ? '📕'
                            : '📄'}
                        </span>
                      </a>
                    )}

                    <div className="p-3">
                      <p className="text-sm font-medium truncate">
                        {ev.file_name}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-base-content/60">
                          {formatSize(ev.file_size)}
                        </p>
                        <p className="text-xs text-base-content/60">
                          by {ev.uploader?.full_name?.split(' ')[0] || 'Unknown'}
                        </p>
                      </div>

                      {canDeleteEvidence(ev) && (
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="absolute top-2 right-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition"
                          title="Delete"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Staff actions */}
        {isStaff && (
          <div className="card bg-base-100 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Officer Actions</h2>
            <p className="text-xs text-base-content/60 mb-4">
              Update this report's status. The reporter will see the change on
              their dashboard.
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
      </div>
    </DashboardLayout>
  );
}