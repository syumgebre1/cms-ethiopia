import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { reportApi } from '../services/api';
import { useAuth } from '../context/useAuth';
import type { Report } from '../types';

type StatusFilter =
  | 'all'
  | 'pending'
  | 'under_review'
  | 'escalated'
  | 'resolved'
  | 'rejected';

type UrgencyFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

type SortOption = 'newest' | 'oldest' | 'urgency';

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  under_review: 'badge-info',
  escalated: 'badge-error',
  resolved: 'badge-success',
  rejected: 'badge-ghost',
};

const URGENCY_BADGE: Record<string, string> = {
  low: 'badge-ghost',
  medium: 'badge-info',
  high: 'badge-warning',
  critical: 'badge-error',
};

const URGENCY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [sort, setSort] = useState<SortOption>('newest');

  const isStaff =
    user?.role === 'officer' ||
    user?.role === 'detective' ||
    user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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

  const filtered = useMemo(() => {
    let result = [...reports];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.crime_type.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.reporter?.full_name?.toLowerCase().includes(q)
      );
    }

    // Status
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Urgency
    if (urgencyFilter !== 'all') {
      result = result.filter((r) => r.urgency === urgencyFilter);
    }

    // Sort
    if (sort === 'newest') {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sort === 'urgency') {
      result.sort(
        (a, b) =>
          (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0)
      );
    }

    return result;
  }, [reports, search, statusFilter, urgencyFilter, sort]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setSort('newest');
  };

  const hasActiveFilters =
    search || statusFilter !== 'all' || urgencyFilter !== 'all';

  const title = isStaff
    ? t('sidebar.all_reports')
    : t('sidebar.my_submissions');

  return (
    <DashboardLayout activeItem="submissions" title={title}>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">{title}</h1>
          <p className="text-sm text-base-content/60 mt-1">
            {filtered.length} of {reports.length} report
            {reports.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="alert alert-error text-sm mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Filters card */}
        <div className="card bg-base-100 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="lg:col-span-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search type, location, reporter..."
                className="input input-bordered input-sm w-full"
              />
            </div>

            {/* Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="select select-bordered select-sm w-full"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <select
                value={urgencyFilter}
                onChange={(e) =>
                  setUrgencyFilter(e.target.value as UrgencyFilter)
                }
                className="select select-bordered select-sm w-full"
              >
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="select select-bordered select-sm w-full"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="urgency">By urgency</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-xs"
              >
                ✕ Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : reports.length === 0 ? (
          <div className="card bg-base-100 shadow-sm p-12 text-center">
            <p className="text-5xl mb-3">📭</p>
            <h2 className="text-lg font-bold mb-1">No reports yet</h2>
            <p className="text-sm text-base-content/60 mb-4">
              {isStaff
                ? 'No reports have been submitted in the system.'
                : 'You have not submitted any crime reports yet.'}
            </p>
            {!isStaff && (
              <button
                onClick={() => navigate('/report')}
                className="btn btn-primary btn-sm rounded-full"
              >
                🚨 Report a Crime
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card bg-base-100 shadow-sm p-12 text-center">
            <p className="text-5xl mb-3">🔍</p>
            <h2 className="text-lg font-bold mb-1">No matching reports</h2>
            <p className="text-sm text-base-content/60 mb-4">
              Try adjusting your search or filters.
            </p>
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card bg-base-100 shadow-sm hidden md:block">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Location</th>
                      {isStaff && <th>Reporter</th>}
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/reports/${r.id}`)}
                        className="hover cursor-pointer"
                      >
                        <td className="font-medium">{r.crime_type}</td>
                        <td className="text-base-content/70 max-w-xs truncate">
                          {r.location}
                        </td>
                        {isStaff && (
                          <td className="text-xs">
                            {r.reporter ? (
                              <div>
                                <p className="font-medium">
                                  {r.reporter.full_name}
                                </p>
                                <p className="text-base-content/60">
                                  {r.reporter.email}
                                </p>
                              </div>
                            ) : (
                              <span className="badge badge-ghost badge-sm">
                                Anonymous
                              </span>
                            )}
                          </td>
                        )}
                        <td>
                          <span
                            className={`badge badge-sm ${
                              URGENCY_BADGE[r.urgency] || 'badge-ghost'
                            }`}
                          >
                            {r.urgency}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              STATUS_BADGE[r.status] || 'badge-ghost'
                            }`}
                          >
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-xs text-base-content/60">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span className="text-base-content/40">→</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/reports/${r.id}`)}
                  className="card bg-base-100 shadow-sm p-4 w-full text-left hover:bg-base-200 transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold">{r.crime_type}</h3>
                    <span
                      className={`badge badge-sm ${
                        STATUS_BADGE[r.status] || 'badge-ghost'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/70 mt-1">
                    📍 {r.location}
                  </p>
                  {isStaff && r.reporter && (
                    <p className="text-xs text-base-content/60 mt-1">
                      By {r.reporter.full_name}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span
                      className={`badge badge-xs ${
                        URGENCY_BADGE[r.urgency] || 'badge-ghost'
                      }`}
                    >
                      {r.urgency}
                    </span>
                    <span className="text-xs text-base-content/50">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}