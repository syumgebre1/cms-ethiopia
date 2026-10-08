import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { alertApi, type PublicAlert, type AlertType } from '../services/api';

const API_BASE = 'http://localhost:5000';

const TYPE_TABS: { value: AlertType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'fugitive', label: 'Fugitives' },
  { value: 'missing', label: 'Missing Persons' },
  { value: 'wanted', label: 'Wanted' },
];

export default function PublicAlertsSection() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [filtered, setFiltered] = useState<PublicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AlertType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PublicAlert | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await alertApi.getPublic();
        setAlerts(res.data.alerts);
        setFiltered(res.data.alerts);
      } catch (err) {
        console.error('Failed to load public alerts', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter by type + search
  useEffect(() => {
    let result = alerts;
    if (activeTab !== 'all') {
      result = result.filter((a) => a.type === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.full_name?.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.last_seen_location?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [activeTab, search, alerts]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'caught':
        return { label: 'CAUGHT', color: 'bg-red-600' };
      case 'found':
        return { label: 'FOUND', color: 'bg-green-600' };
      case 'active':
        return { label: 'WANTED', color: 'bg-yellow-600' };
      default:
        return null;
    }
  };

  return (
    <section className="bg-base-200 py-16 px-4 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-base-content">
            Public Safety Alerts
          </h2>
          <p className="mt-3 text-base-content/70 max-w-2xl mx-auto">
            Help us keep our community safe. If you have information about any
            of these individuals, please contact the police immediately.
          </p>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="tabs tabs-boxed bg-base-100">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`tab ${
                  activeTab === tab.value ? 'tab-active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location..."
              className="input input-bordered w-full"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-box">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-base-content/60">
              No alerts to display at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((alert) => {
              const status = statusBadge(alert.status);
              return (
                <button
                  key={alert.id}
                  onClick={() => setSelected(alert)}
                  className="card bg-base-100 shadow-md hover:shadow-xl transition overflow-hidden text-left"
                >
                  {/* Photo + status badge */}
                  <div className="relative aspect-[4/5] bg-base-300 overflow-hidden">
                    {alert.photo_url ? (
                      <img
                        src={`${API_BASE}${alert.photo_url}`}
                        alt={alert.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        👤
                      </div>
                    )}

                    {status && (
                      <div
                        className={`absolute top-3 left-3 ${status.color} text-white text-xs font-bold px-2 py-1 rounded`}
                      >
                        {status.label}
                      </div>
                    )}

                    {alert.reward && (
                      <div className="absolute bottom-3 left-3 right-3 bg-warning text-warning-content text-xs font-semibold px-2 py-1 rounded text-center">
                        💰 {alert.reward}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-bold text-sm truncate">
                      {alert.full_name || alert.title}
                    </p>
                    {alert.age && (
                      <p className="text-xs text-base-content/60">
                        Age: {alert.age}
                      </p>
                    )}
                    <p className="text-xs text-base-content/70 mt-1 line-clamp-2">
                      {alert.description}
                    </p>
                    {alert.last_seen_location && (
                      <p className="text-xs text-base-content/50 mt-1 truncate">
                        📍 {alert.last_seen_location}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              onClick={() => setSelected(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selected.photo_url && (
                <img
                  src={`${API_BASE}${selected.photo_url}`}
                  alt={selected.title}
                  className="w-full rounded-lg object-cover"
                />
              )}

              <div className={selected.photo_url ? '' : 'md:col-span-2'}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-error capitalize">
                    {selected.type}
                  </span>
                  <span
                    className={`badge ${
                      selected.status === 'active'
                        ? 'badge-warning'
                        : selected.status === 'caught' ||
                          selected.status === 'found'
                        ? 'badge-success'
                        : 'badge-ghost'
                    } capitalize`}
                  >
                    {selected.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold">{selected.title}</h3>
                {selected.full_name && (
                  <p className="text-base-content/70 mt-1">
                    {selected.full_name}
                    {selected.age ? `, ${selected.age}` : ''}
                  </p>
                )}

                {selected.last_seen_location && (
                  <p className="text-sm mt-3">
                    📍 <span className="font-medium">Last seen:</span>{' '}
                    {selected.last_seen_location}
                  </p>
                )}

                {selected.reward && (
                  <p className="text-sm mt-2 text-warning">
                    💰 <span className="font-medium">Reward:</span>{' '}
                    {selected.reward}
                  </p>
                )}

                <p className="text-sm mt-4 whitespace-pre-wrap">
                  {selected.description}
                </p>

                <div className="divider"></div>

                <p className="text-xs text-base-content/60">
                  If you have information, please contact your local police
                  station or call 991.
                </p>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setSelected(null)}
          ></div>
        </div>
      )}
    </section>
  );
}