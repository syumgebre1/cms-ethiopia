import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { reportApi, messageApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import type { Report } from '../types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageError, setMessageError] = useState('');

  const isStaff =
    user?.role === 'officer' ||
    user?.role === 'detective' ||
    user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const res = isStaff
          ? await reportApi.getAll()
          : await reportApi.getMine();
        setReports(res.data.reports);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStaff]);

  const total = reports.length;
  const pending = reports.filter((r) => r.status === 'pending').length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const escalated = reports.filter((r) => r.status === 'escalated').length;

  const weeklyData = [4, 7, 3, 8, 6, 9, 5];
  const maxVal = Math.max(...weeklyData);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.greeting_morning');
    if (h < 18) return t('dashboard.greeting_afternoon');
    return t('dashboard.greeting_evening');
  };

  // ==================== Message reporter ====================
  const handleMessageReporter = async (report: Report) => {
    if (!report.user_id) {
      setMessageError('This report was submitted anonymously');
      setTimeout(() => setMessageError(''), 3000);
      return;
    }
    try {
      const res = await messageApi.startConversation(report.user_id);
      navigate(`/messages/${res.data.conversation.id}`);
    } catch (err: any) {
      setMessageError(err.response?.data?.message || 'Failed to start chat');
      setTimeout(() => setMessageError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="dashboard" />

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold">{t('dashboard.title')}</h1>
            <p className="text-xs text-base-content/60">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered input-sm hidden md:block w-64"
            />
            <button className="btn btn-ghost btn-sm btn-circle relative">
              🔔
              <span className="badge badge-error badge-xs absolute top-1 right-1"></span>
            </button>
            <div className="text-sm text-base-content/70 hidden lg:block">
              Hi, <span className="font-semibold">{user?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          {/* Message error toast */}
          {messageError && (
            <div className="alert alert-warning text-sm mb-4">
              <span>{messageError}</span>
            </div>
          )}

          {/* Welcome hero */}
          <div className="card bg-gradient-to-r from-primary to-primary/70 text-white shadow-md p-6 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  {t('dashboard.welcome', {
                    name: user?.full_name?.split(' ')[0],
                  })}{' '}
                  👋
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  {getGreeting()} · {t('dashboard.signed_in_as')}{' '}
                  <span className="font-semibold capitalize">
                    {user?.role ? t(`role.${user.role}`) : ''}
                  </span>
                </p>
              </div>
              {!isStaff && (
                <Link
                  to="/report"
                  className="btn btn-sm md:btn-md bg-white text-primary hover:bg-white/90 border-none"
                >
                  🚨 {t('dashboard.report_crime_button')}
                </Link>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-base-100 shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-base-content/60 uppercase">
                    {t('dashboard.total_reports')}
                  </p>
                  <p className="text-3xl font-bold text-primary mt-1">{total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  📊
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-base-content/60 uppercase">
                    {t('dashboard.pending')}
                  </p>
                  <p className="text-3xl font-bold text-warning mt-1">{pending}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                  ⏳
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-base-content/60 uppercase">
                    {t('dashboard.resolved')}
                  </p>
                  <p className="text-3xl font-bold text-success mt-1">
                    {resolved}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                  ✅
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-base-content/60 uppercase">
                    {t('dashboard.escalated')}
                  </p>
                  <p className="text-3xl font-bold text-info mt-1">
                    {escalated}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                  📈
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card bg-base-100 shadow-sm p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {isStaff
                    ? t('dashboard.recent_reports_staff')
                    : t('dashboard.recent_reports')}
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-base-content/60">
                    {t('dashboard.no_reports')}
                  </p>
                  {!isStaff && (
                    <Link
                      to="/report"
                      className="btn btn-primary btn-sm mt-4 rounded-full"
                    >
                      {t('dashboard.create_first_report')}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t('dashboard.table_type')}</th>
                        <th>{t('dashboard.table_location')}</th>
                        {isStaff && <th>Reporter</th>}
                        <th>{t('dashboard.table_urgency')}</th>
                        <th>{t('dashboard.table_status')}</th>
                        {isStaff && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.slice(0, 10).map((r) => (
                        <tr key={r.id} className="hover">
                          <td className="font-medium">{r.crime_type}</td>
                          <td className="text-base-content/70">
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
                                r.urgency === 'critical'
                                  ? 'badge-error'
                                  : r.urgency === 'high'
                                  ? 'badge-warning'
                                  : r.urgency === 'medium'
                                  ? 'badge-info'
                                  : 'badge-ghost'
                              }`}
                            >
                              {t(`report.urgency_${r.urgency}`)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge badge-sm ${
                                r.status === 'pending'
                                  ? 'badge-warning'
                                  : r.status === 'resolved'
                                  ? 'badge-success'
                                  : r.status === 'escalated'
                                  ? 'badge-info'
                                  : 'badge-ghost'
                              }`}
                            >
                              {t(`status.${r.status}`)}
                            </span>
                          </td>
                          {isStaff && (
                            <td>
                              <button
                                onClick={() => handleMessageReporter(r)}
                                disabled={!r.user_id}
                                className="btn btn-ghost btn-xs"
                                title={
                                  r.user_id
                                    ? 'Message reporter'
                                    : 'Anonymous report'
                                }
                              >
                                💬
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card bg-base-100 shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">
                {t('dashboard.weekly_activity')}
              </h2>
              <div className="flex items-end justify-between h-40 gap-2">
                {weeklyData.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-primary rounded-t-md transition-all hover:bg-primary/80"
                      style={{ height: `${(val / maxVal) * 100}%` }}
                      title={`${val} reports`}
                    ></div>
                    <span className="text-xs text-base-content/60">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-bold mb-4">
                {t('dashboard.system_guidelines')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-base-200">
                  <p className="text-2xl">ℹ️</p>
                  <p className="font-medium text-sm mt-2">
                    {t('dashboard.guideline_1_title')}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {t('dashboard.guideline_1_desc')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-base-200">
                  <p className="text-2xl">🛡️</p>
                  <p className="font-medium text-sm mt-2">
                    {t('dashboard.guideline_2_title')}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {t('dashboard.guideline_2_desc')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-base-200">
                  <p className="text-2xl">🔔</p>
                  <p className="font-medium text-sm mt-2">
                    {t('dashboard.guideline_3_title')}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {t('dashboard.guideline_3_desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">
                {t('dashboard.quick_actions')}
              </h2>
              <div className="space-y-2">
                {!isStaff && (
                  <Link
                    to="/report"
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    🚨 {t('dashboard.action_report')}
                  </Link>
                )}
                <Link
                  to="/messages"
                  className="btn btn-outline btn-sm w-full justify-start"
                >
                  💬 {t('dashboard.action_messages')}
                </Link>
                <button className="btn btn-outline btn-sm w-full justify-start">
                  📄 {t('dashboard.action_view_reports')}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    👥 {t('dashboard.action_manage_users')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}