import { useEffect, useState } from 'react';
import { MapPin, Tag, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  cantons: number;
  categories: number;
  rules: number;
  sessions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ cantons: 0, categories: 0, rules: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cantonsRes, catsRes, rulesRes, sessionsRes] = await Promise.all([
        supabase.from('cantons').select('id', { count: 'exact', head: true }),
        supabase.from('renovation_categories').select('id', { count: 'exact', head: true }),
        supabase.from('canton_category_rules').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        cantons: cantonsRes.count ?? 0,
        categories: catsRes.count ?? 0,
        rules: rulesRes.count ?? 0,
        sessions: sessionsRes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Kantone', value: stats.cantons, icon: MapPin, color: 'bg-blue-50 text-blue-700' },
    { label: 'Kategorien', value: stats.categories, icon: Tag, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Abzugsregeln', value: stats.rules, icon: FileText, color: 'bg-amber-50 text-amber-700' },
    { label: 'Erfassungen', value: stats.sessions, icon: AlertTriangle, color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
