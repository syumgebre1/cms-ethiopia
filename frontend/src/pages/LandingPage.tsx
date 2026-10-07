import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <Header />

      {/* ==================== Hero Section ==================== */}
      <section className="px-4 lg:px-16 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-base-content">
              Securing the <br />
              Future of <br />
              <span className="text-primary">Ethiopia</span>
            </h1>
            <p className="mt-6 text-lg text-base-content/70 max-w-lg">
              A modern, unified platform for citizens and law enforcement to
              report, track, and resolve crimes efficiently. Together, we build
              a safer nation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="btn btn-primary rounded-full px-8"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="btn btn-outline rounded-full px-8"
              >
                Access Portal
              </Link>
            </div>
          </div>

          {/* Right: Hero image placeholder */}
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl h-96 flex items-center justify-center border border-primary/10">
              <span className="text-8xl">⚖️</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Features Section ==================== */}
      <section className="bg-base-200 py-16 px-4 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-base-content">
              Empowering Justice
            </h2>
            <p className="mt-3 text-base-content/70">
              Our platform provides the tools needed for modern law enforcement
              and active citizenship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                📝
              </div>
              <h3 className="mt-4 text-xl font-bold">Instant Reporting</h3>
              <p className="mt-2 text-base-content/70 text-sm">
                Citizens can report incidents instantly with photo and video
                evidence directly from their devices.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                📋
              </div>
              <h3 className="mt-4 text-xl font-bold">Case Tracking</h3>
              <p className="mt-2 text-base-content/70 text-sm">
                Monitor the progress of reported cases in real-time. Stay
                informed through every stage of the investigation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="mt-4 text-xl font-bold">Secure Messaging</h3>
              <p className="mt-2 text-base-content/70 text-sm">
                Direct communication line between citizens and assigned officers
                for updates and additional information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Footer ==================== */}
      <footer className="bg-base-100 border-t border-base-300 py-8 px-4 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-semibold">CMS Ethiopia</span>
          </div>
          <p className="text-xs text-base-content/60">
            © {new Date().getFullYear()} CMS Ethiopia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}