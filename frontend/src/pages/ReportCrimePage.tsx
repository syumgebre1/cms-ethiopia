import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import DashboardLayout from '../components/DashboardLayout';
import type { Urgency } from '../types';

interface PendingFile {
  file: File;
  preview?: string;
}

export default function ReportCrimePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [crimeType, setCrimeType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Files
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUseMyLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationGranted(true);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            'Location permission denied. Please allow access in your browser settings.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location information is unavailable.');
        } else {
          setLocationError('Failed to get your location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClearLocation = () => {
    setLatitude(null);
    setLongitude(null);
    setLocationGranted(false);
    setLocationError('');
  };

  // ==================== File handling ====================
  const handleFilesAdded = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles);

    // Limit total to 5
    const remaining = 5 - files.length;
    const toAdd = arr.slice(0, remaining);

    const pending: PendingFile[] = toAdd.map((file) => {
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return { file, preview };
    });

    setFiles((prev) => [...prev, ...pending]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      if (next[index]?.preview) {
        URL.revokeObjectURL(next[index].preview!);
      }
      next.splice(index, 1);
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ==================== Submit ====================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!crimeType || !description || !location) {
      setError(t('report.error_required'));
      return;
    }

    try {
      setSubmitting(true);
      const res = await reportApi.create({
        crime_type: crimeType,
        description,
        location,
        urgency,
        is_anonymous: isAnonymous,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });

      const reportId = res.data.report.id;

      // Upload evidence if any
      if (files.length > 0) {
        setUploading(true);
        try {
          await reportApi.uploadEvidence(
            reportId,
            files.map((f) => f.file)
          );
        } catch (uploadErr) {
          console.error('Evidence upload failed:', uploadErr);
        } finally {
          setUploading(false);
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('report.error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout activeItem="report" title={t('report.title')}>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <div className="card bg-base-100 shadow-sm p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-primary flex items-center gap-2">
            🚨 {t('report.title')}
          </h1>
          <p className="text-sm text-base-content/60 mt-2 mb-6">
            {t('report.subtitle')}
          </p>

          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category / Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    {t('report.incident_title')} *
                  </span>
                </label>
                <input
                  type="text"
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  placeholder={t('report.incident_title_placeholder')}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    {t('report.category')} *
                  </span>
                </label>
                <select
                  value={crimeType === '' ? '' : crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">{t('report.category_select')}</option>
                  <option value="Theft">{t('report.category_theft')}</option>
                  <option value="Assault">
                    {t('report.category_assault')}
                  </option>
                  <option value="Vandalism">
                    {t('report.category_vandalism')}
                  </option>
                  <option value="Fraud">{t('report.category_fraud')}</option>
                  <option value="Drug-related">
                    {t('report.category_drug')}
                  </option>
                  <option value="Suspicious Activity">
                    {t('report.category_suspicious')}
                  </option>
                  <option value="Other">{t('report.category_other')}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">
                  {t('report.description')} *
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('report.description_placeholder')}
                className="textarea textarea-bordered w-full h-32"
              />
            </div>

            {/* Location + Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    {t('report.location')} *
                  </span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('report.location_placeholder')}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    {t('report.urgency')}
                  </span>
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="select select-bordered w-full"
                >
                  <option value="low">{t('report.urgency_low')}</option>
                  <option value="medium">{t('report.urgency_medium')}</option>
                  <option value="high">{t('report.urgency_high')}</option>
                  <option value="critical">
                    {t('report.urgency_critical')}
                  </option>
                </select>
              </div>
            </div>

            {/* GPS */}
            <div className="p-4 bg-base-200 rounded-lg border border-base-300">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <span className="font-medium text-sm">
                      Precise GPS Location (Optional)
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60">
                    Attach your device's exact coordinates to help officers find
                    the location on the map.
                  </p>

                  {locationGranted && latitude && longitude && (
                    <div className="mt-3 p-2 bg-success/10 rounded border border-success/30">
                      <p className="text-xs font-medium text-success mb-1">
                        ✅ Location captured
                      </p>
                      <p className="text-xs font-mono text-base-content/70">
                        Lat: {latitude.toFixed(6)} · Lng:{' '}
                        {longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {locationError && (
                    <p className="mt-2 text-xs text-error">
                      ⚠️ {locationError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {!locationGranted ? (
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locating}
                      className="btn btn-sm btn-primary"
                    >
                      {locating ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Locating...
                        </>
                      ) : (
                        '📍 Use My Location'
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="btn btn-sm btn-ghost"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ==================== EVIDENCE UPLOAD ==================== */}
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">
                  Evidence (Optional)
                </span>
                <span className="label-text-alt text-base-content/50">
                  Max 5 files · 10 MB each
                </span>
              </label>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-base-300 hover:border-primary rounded-lg p-6 text-center cursor-pointer transition bg-base-200/50 hover:bg-base-200"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt,video/mp4"
                  onChange={(e) => handleFilesAdded(e.target.files)}
                  className="hidden"
                />
                <p className="text-3xl mb-2">📎</p>
                <p className="font-medium text-sm">
                  Drag & drop files here
                </p>
                <p className="text-xs text-base-content/60 mt-1">
                  or click to browse
                </p>
                <p className="text-xs text-base-content/50 mt-2">
                  Images, PDF, Word, TXT, MP4 · Up to 5 files
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((pf, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 bg-base-200 rounded-lg"
                    >
                      {pf.preview ? (
                        <img
                          src={pf.preview}
                          alt={pf.file.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-base-300 flex items-center justify-center text-xl">
                          📄
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {pf.file.name}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {formatSize(pf.file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="btn btn-ghost btn-xs"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <p className="text-xs text-base-content/60">
                    {files.length}/5 files selected
                  </p>
                </div>
              )}
            </div>

            {/* Anonymous */}
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="checkbox checkbox-primary"
              />
              <span className="label-text">{t('report.anonymous')}</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="btn btn-primary w-full mt-4"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {uploading ? 'Uploading evidence...' : 'Submitting...'}
                </>
              ) : (
                t('report.submit')
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}