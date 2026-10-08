import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import Sidebar from '../components/Sidebar';
import type { Urgency } from '../types';

export default function ReportCrimePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [crimeType, setCrimeType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // GPS state
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!crimeType || !description || !location) {
      setError(t('report.error_required'));
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
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('report.error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="report" />

      <div className="flex-1 min-w-0">
        <main className="max-w-3xl mx-auto p-4 lg:p-8">
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

              {/* ==================== GPS LOCATION ==================== */}
              <div className="p-4 bg-base-200 rounded-lg border border-base-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📍</span>
                      <span className="font-medium text-sm">
                        Precise GPS Location (Optional)
                      </span>
                    </div>
                    <p className="text-xs text-base-content/60">
                      Attach your device's exact coordinates to help officers
                      find the location on the map.
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

              <div>
                <label className="label py-1">
                  <span className="label-text font-medium">
                    {t('report.evidence')}
                  </span>
                </label>
                <input
                  type="file"
                  className="file-input file-input-bordered w-full"
                  disabled
                />
                <p className="text-xs text-base-content/50 mt-1">
                  {t('report.evidence_note')}
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">{t('report.anonymous')}</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full mt-4"
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  t('report.submit')
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}