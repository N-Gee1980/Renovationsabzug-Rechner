import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tag, MapPin, LogOut, Building2, ArrowLeft, Image } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/kantone', icon: MapPin, label: 'Kantone' },
  { to: '/admin/kategorien', icon: Tag, label: 'Kategorien' },
  { to: '/admin/regeln', icon: MapPin, label: 'Abzugsregeln' },
  { to: '/admin/sponsoren', icon: Image, label: 'Sponsoren' },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-swiss-red rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm block leading-tight">Admin</span>
              <span className="text-xs text-gray-400 leading-none">Renovationsabzug</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white border-r-2 border-swiss-red'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zur Webseite
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
