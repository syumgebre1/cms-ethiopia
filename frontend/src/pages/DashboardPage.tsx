import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { reportApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import type { Report } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);

  const isStaff =
    user?.role === 'officer' ||
    user?.role === 'detective' ||
    user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light'
    );
  }, [dark]);

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

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="dashboard" />

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold">Dashboard</h1>
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
            <button
              onClick={() => setDark(!dark)}
              className="btn btn-ghost btn-sm btn-circle"
              title="Toggle theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>
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
          {/* Welcome hero */}
          <div className="card bg-gradient-to-r from-primary to-primary/70 text-white shadow-md p-6 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Welcome back, {user?.full_name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  You are signed in as{' '}
                  <span className="font-semibold capitalize">
                    {user?.role}
                  </span>
                </p>
              </div>
              {!isStaff && (
                <Link
                  to="/report"
                  className="btn btn-sm md:btn-md bg-white text-primary hover:bg-white/90 border-none"
                >
                  🚨 Report Crime
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
                    Total Reports
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
                    Pending
                  </p>
                  <p className="text-3xl font-bold text-warning mt-1">
                    {pending}
                  </p>
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
                    Resolved
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
                    Escalated
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
                  {isStaff ? 'Recent Reports' : 'My Recent Reports'}
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-base-content/60">No reports yet.</p>
                  {!isStaff && (
                    <Link
                      to="/report"
                      className="btn btn-primary btn-sm mt-4 rounded-full"
                    >
                      Create Your First Report
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Urgency</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.slice(0, 5).map((r) => (
                        <tr key={r.id} className="hover">
                          <td className="font-medium">{r.crime_type}</td>
                          <td className="text-base-content/70">
                            {r.location}
                          </td>
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
                              {r.urgency}
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
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card bg-base-100 shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Weekly Activity</h2>
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
              <p className="text-xs text-base-content/50 mt-3 text-center">
                Sample data
              </p>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-bold mb-4">System Guidelines</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-base-200">
                  <p className="text-2xl">ℹ️</p>
                  <p className="font-medium text-sm mt-2">Be Detailed</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    Provide as much information as possible.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-base-200">
                  <p className="text-2xl">🛡️</p>
                  <p className="font-medium text-sm mt-2">Stay Safe</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    Never put yourself in danger for evidence.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-base-200">
                  <p className="text-2xl">🔔</p>
                  <p className="font-medium text-sm mt-2">Monitor Updates</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    Check notifications from officers regularly.
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {!isStaff && (
                  <Link
                    to="/report"
                    className="btn btn-outline btn-sm w-full justify-start"
                  >
                    🚨 Report a Crime
                  </Link>
                )}
                <button className="btn btn-outline btn-sm w-full justify-start">
                  📄 View My Reports
                </button>
                <button className="btn btn-outline btn-sm w-full justify-start">
                  💬 Messages
                </button>
                {isAdmin && (
                  <button className="btn btn-outline btn-sm w-full justify-start">
                    👥 Manage Users
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