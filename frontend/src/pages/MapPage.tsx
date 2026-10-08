import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { reportApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import type { Report } from '../types';

// ==================== ETHIOPIAN LOCATIONS DATABASE ====================
const CITY_COORDS: Record<string, [number, number]> = {
  // ========== REGIONAL CAPITALS ==========
  'Addis Ababa': [9.032, 38.7469],
  Adama: [8.54, 39.2694],
  'Bahir Dar': [11.5936, 37.3908],
  Mekelle: [13.4967, 39.4753],
  Hawassa: [7.0622, 38.4763],
  'Dire Dawa': [9.5931, 41.8661],
  Gondar: [12.603, 37.4521],
  Jimma: [7.6733, 36.8344],
  Dessie: [11.1333, 39.6333],
  Jijiga: [9.35, 42.8],
  Gambella: [8.25, 34.5833],
  'Arba Minch': [6.0333, 37.55],
  Semera: [11.7953, 41.0047],
  Assosa: [10.0667, 34.5333],
  Bishoftu: [8.75, 38.9833],
  'Addis Zemen': [12.1167, 37.7833],

  // ========== MAJOR CITIES ==========
  Shashamane: [7.2, 38.6],
  Nekemte: [9.0833, 36.55],
  Ambo: [8.9833, 37.85],
  'Bale Robe': [7.1167, 40.0],
  'Debre Birhan': [9.6804, 39.5326],
  'Debre Markos': [10.35, 37.7333],
  'Debre Tabor': [11.85, 38.0167],
  Woldia: [11.8333, 39.6],
  Kombolcha: [11.0833, 39.7333],
  'Debre Zeit': [8.75, 38.9833],
  Sebeta: [8.9167, 38.6167],
  Burayu: [9.0833, 38.6667],
  Holeta: [9.05, 38.5],
  Dukem: [8.7833, 38.8833],
  Metu: [8.3, 35.5833],
  Bedele: [8.45, 36.35],
  Gore: [8.15, 35.5333],
  Assela: [7.95, 39.1333],
  Iteya: [8.1833, 39.25],
  Mojo: [8.6, 39.1167],
  Woliso: [8.5333, 37.9833],
  Welkite: [8.2833, 37.7833],
  Hosaena: [7.55, 37.85],
  Butajira: [8.1167, 38.3667],
  Worabe: [7.85, 38.2333],
  Durame: [7.2333, 37.9],
  Sodo: [6.86, 37.7569],
  Dilla: [6.4167, 38.3167],
  'Yirga Alem': [6.75, 38.4167],
  Yirgalem: [6.75, 38.4167],
  'Wondo Genet': [7.0833, 38.6],
  Bonga: [7.2833, 36.2333],
  'Mizan Teferi': [6.9833, 35.5833],
  Tepi: [7.2, 35.4167],
  Agaro: [7.85, 36.65],
  Gimbi: [9.1667, 35.8333],
  Nedjo: [9.5, 35.45],
  'Dembi Dolo': [8.5333, 34.8],
  Metema: [12.95, 36.1833],
  Humera: [14.3, 36.6167],
  Shire: [14.1, 38.2833],
  Axum: [14.1211, 38.7234],
  Adigrat: [14.2772, 39.4622],
  Adwa: [14.1667, 38.9],
  Maychew: [12.7833, 39.5333],
  Kobo: [12.15, 39.6333],
  Lalibela: [12.0317, 39.0473],
  Woldiya: [11.8333, 39.6],
  Sekota: [12.6333, 39.0333],
  Mota: [11.0833, 37.8667],
  'Finote Selam': [10.7, 37.2667],
  Bure: [10.7, 37.0667],
  Dangila: [11.2667, 36.8333],
  Chagni: [10.95, 36.5],
  Pawi: [11.1667, 36.0833],
  Metekel: [11.0, 36.0],
  'Arsi Negele': [7.35, 38.7],
  Shakiso: [5.75, 38.9167],
  Yabelo: [4.8833, 38.0833],
  Moyale: [3.5333, 39.05],
  'Bale Goba': [7.0167, 39.9833],
  Goba: [7.0167, 39.9833],
  Ginir: [7.1333, 40.7],
  'Hagere Mariam': [5.65, 38.2333],
  'Kebri Dehar': [6.7333, 44.2667],
  Gode: [5.95, 43.55],
  Werder: [6.9667, 46.4],
  Kelafo: [5.6, 44.2],
  Asosa: [10.0667, 34.5333],
  Pawe: [11.2, 36.4],
  Bambasi: [9.7667, 34.6],

  // ========== ADDIS ABABA NEIGHBORHOODS ==========
  Bole: [9.01, 38.78],
  'Meskel Square': [9.0107, 38.7614],
  Piassa: [9.035, 38.75],
  Merkato: [9.03, 38.74],
  Kazanchis: [9.018, 38.77],
  CMC: [9.02, 38.83],
  Sarbet: [9.005, 38.73],
  Gerji: [9.01, 38.81],
  Summit: [9.04, 38.85],
  Ayat: [9.02, 38.9],
  Megenagna: [9.02, 38.8],
  Kality: [8.95, 38.77],
  Kaliti: [8.95, 38.77],
  Akaki: [8.8833, 38.7833],
  Yeka: [9.05, 38.85],
  Gulele: [9.0833, 38.7333],
  Kolfe: [9.0333, 38.7],
  Lideta: [9.0167, 38.7333],
  Kirkos: [9.0, 38.75],
  Nifas: [9.0333, 38.75],
  'Nifas Silk': [9.0333, 38.75],
  Arada: [9.0333, 38.75],
  'Addis Ketema': [9.035, 38.7333],
  'Akaki Kaliti': [8.8833, 38.7833],
  Lafto: [8.9833, 38.7333],
  Jemo: [8.9667, 38.7],
  Mekanisa: [9.0, 38.7167],
  Betel: [9.05, 38.7],
  Bulgaria: [9.0167, 38.7667],
  Saris: [8.9833, 38.7333],
  Gotera: [9.0, 38.75],
  'Wollo Sefer': [8.9833, 38.7833],
  Hayat: [9.0333, 38.9],
  Tafo: [9.05, 38.85],
  Shoa: [9.0333, 38.75],
  Ferensay: [9.05, 38.8],
  Entoto: [9.0833, 38.7667],
  'Bole Bulbula': [8.9833, 38.8],
  'Bole Michael': [8.9833, 38.8],
  'Hana Mariam': [9.0167, 38.8167],
  Kotebe: [9.0333, 38.85],
  'Yeka Abado': [9.05, 38.9],
  'Ayer Tena': [9.0333, 38.7],
  Cherkos: [9.0333, 38.75],
  Mercato: [9.03, 38.74],
  Sheromeda: [9.0167, 38.7667],
  'Meskel Flower': [9.0167, 38.7833],
};

// Deterministic pseudo-random offset from report ID
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Match longest key first so "Meskel Square" beats "Meskel"
const findCoords = (location: string): [number, number] | null => {
  if (!location) return null;
  const lower = location.toLowerCase().trim();

  const sortedKeys = Object.keys(CITY_COORDS).sort(
    (a, b) => b.length - a.length
  );

  for (const key of sortedKeys) {
    if (lower.includes(key.toLowerCase())) {
      return CITY_COORDS[key];
    }
  }

  return null;
};

// Prefer real GPS, fall back to text match
const getReportCoords = (report: Report): [number, number] | null => {
  // 1. If report has real GPS coordinates, use them
  if (report.latitude && report.longitude) {
    return [Number(report.latitude), Number(report.longitude)];
  }

  // 2. Otherwise, use text matching with jitter
  const matched = findCoords(report.location);
  if (!matched) return null;

  const hash = hashCode(report.id);
  const jitterLat = ((hash % 200) - 100) / 5000;
  const jitterLng = (((hash >> 8) % 200) - 100) / 5000;

  return [matched[0] + jitterLat, matched[1] + jitterLng];
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export default function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isStaff =
    user?.role === 'officer' ||
    user?.role === 'detective' ||
    user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const res = isStaff
          ? await reportApi.getAll()
          : await reportApi.getMine();
        setReports(res.data.reports);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStaff]);

  const filteredReports = reports.filter((r) => {
    if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'escalated':
        return 'badge-error';
      case 'under_review':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  // Stats for header
  const totalWithCoords = reports.filter((r) => getReportCoords(r) !== null)
    .length;
  const gpsCount = reports.filter((r) => r.latitude && r.longitude).length;

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="map" />

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <header className="bg-base-100 border-b border-base-300 px-6 py-3 flex flex-wrap justify-between items-center gap-3 z-10">
          <div>
            <h1 className="text-lg font-bold">Crime Map</h1>
            <p className="text-xs text-base-content/60">
              {filteredReports.length} of {reports.length} incidents shown ·{' '}
              {totalWithCoords} located ·{' '}
              <span className="text-success font-semibold">
                {gpsCount} with GPS
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="select select-bordered select-sm"
            >
              <option value="all">All Urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered select-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </header>

        {error && (
          <div className="alert alert-error text-sm m-4">
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-base-200 z-20">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <MapContainer
              center={[9.032, 38.7469]}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredReports.map((report) => {
                const coords = getReportCoords(report);
                if (!coords) return null;

                const color = URGENCY_COLORS[report.urgency] || '#6b7280';
                const hasRealGPS = Boolean(report.latitude && report.longitude);

                return (
                  <CircleMarker
                    key={report.id}
                    center={coords}
                    radius={hasRealGPS ? 12 : 10}
                    pathOptions={{
                      color: hasRealGPS ? '#ffffff' : color,
                      fillColor: color,
                      fillOpacity: 0.9,
                      weight: hasRealGPS ? 3 : 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[220px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: color }}
                          ></span>
                          <strong className="text-base">
                            {report.crime_type}
                          </strong>
                          {hasRealGPS && (
                            <span className="badge badge-success badge-xs">
                              GPS
                            </span>
                          )}
                        </div>

                        <p className="text-xs mb-1">
                          📍 {report.location}
                        </p>
                        <p className="text-xs mb-2">
                          {report.description.slice(0, 80)}
                          {report.description.length > 80 ? '...' : ''}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-2">
                          <span
                            className={`badge badge-xs ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                          <span className="badge badge-xs badge-ghost">
                            {report.urgency}
                          </span>
                        </div>

                        <Link
                          to={`/reports/${report.id}`}
                          className="btn btn-primary btn-xs w-full mt-1"
                        >
                          View Details →
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}

          <div className="absolute bottom-6 right-6 bg-base-100 rounded-lg shadow-lg p-3 z-[1000] text-xs">
            <p className="font-bold mb-2">Urgency Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: URGENCY_COLORS.low }}
                ></span>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: URGENCY_COLORS.medium }}
                ></span>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: URGENCY_COLORS.high }}
                ></span>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: URGENCY_COLORS.critical }}
                ></span>
                <span>Critical</span>
              </div>
            </div>

            <div className="divider my-2"></div>

            <p className="font-bold mb-2">Location</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block border-2 border-white"
                  style={{ backgroundColor: '#6b7280' }}
                ></span>
                <span>Exact GPS</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: '#6b7280' }}
                ></span>
                <span>Approximate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}