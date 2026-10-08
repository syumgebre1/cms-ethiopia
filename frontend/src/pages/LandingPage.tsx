import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import PublicAlertsSection from '../components/PublicAlertsSection';

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-base-100">
      <Header />

      {/* Hero */}
      <section className="px-4 lg:px-16 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-base-content">
              {t('landing.hero_title_1')} <br />
              {t('landing.hero_title_2')} <br />
              <span className="text-primary">{t('landing.hero_title_3')}</span>
            </h1>
            <p className="mt-6 text-lg text-base-content/70 max-w-lg">
              {t('landing.hero_subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="btn btn-primary rounded-full px-8"
              >
                {t('landing.get_started')}
              </Link>
              <Link
                to="/login"
                className="btn btn-outline rounded-full px-8"
              >
                {t('landing.access_portal')}
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl h-96 flex items-center justify-center border border-primary/10">
              <span className="text-8xl">⚖️</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-base-200 py-16 px-4 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold">
              {t('landing.empowering_title')}
            </h2>
            <p className="mt-3 text-base-content/70">
              {t('landing.empowering_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                📝
              </div>
              <h3 className="mt-4 text-xl font-bold">
                {t('landing.feature_report_title')}
              </h3>
              <p className="mt-2 text-base-content/70 text-sm">
                {t('landing.feature_report_desc')}
              </p>
            </div>
            <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                📋
              </div>
              <h3 className="mt-4 text-xl font-bold">
                {t('landing.feature_track_title')}
              </h3>
              <p className="mt-2 text-base-content/70 text-sm">
                {t('landing.feature_track_desc')}
              </p>
            </div>
            <div className="card bg-base-100 shadow-md p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="mt-4 text-xl font-bold">
                {t('landing.feature_message_title')}
              </h3>
              <p className="mt-2 text-base-content/70 text-sm">
                {t('landing.feature_message_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Alerts */}
      <PublicAlertsSection />

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 py-8 px-4 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-semibold">{t('app.name')}</span>
          </div>
          <p className="text-xs text-base-content/60">
            © {new Date().getFullYear()} {t('landing.footer_copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}