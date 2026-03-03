import { Outlet, Link, useLocation } from 'react-router-dom';
import { Building2, Shield } from 'lucide-react';
import { SponsorsBanner } from '../SponsorsBanner';

export default function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="no-print bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-swiss-red rounded-lg flex items-center justify-center group-hover:bg-swiss-red-dark transition-colors">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900 leading-tight block">
                Renovationsabzug
              </span>
              <span className="text-xs text-gray-500 leading-none">Steuerrechner Schweiz</span>
            </div>
          </Link>
          <Link
            to="/admin/login"
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            title="Admin-Bereich"
          >
            <Shield className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {isHome ? (
          <Outlet />
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <Outlet />
          </div>
        )}
      </main>

      {!isHome && <SponsorsBanner />}

      <footer className="no-print bg-white border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-400">
          Renovations-Abzugsrechner &middot; Angaben ohne Gewähr &middot; Offizielle Quelle: Eidg. Steuerverwaltung ESTV
        </div>
      </footer>
    </div>
  );
}
