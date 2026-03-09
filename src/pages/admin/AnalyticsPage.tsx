import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

interface PageViewData {
  page_url: string;
  count: number;
}

interface SessionData {
  total_sessions: number;
  avg_pages_per_session: number;
}

interface InteractionData {
  interaction_type: string;
  count: number;
}

export default function AnalyticsPage() {
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const cutoffDate = new Date();
      if (dateRange === '24h') cutoffDate.setDate(cutoffDate.getDate() - 1);
      else if (dateRange === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else cutoffDate.setDate(cutoffDate.getDate() - 30);

      const [pageViewRes, sessionRes, interactionRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('page_url')
          .gte('created_at', cutoffDate.toISOString()),
        supabase
          .from('analytics_sessions')
          .select('page_view_count')
          .gte('created_at', cutoffDate.toISOString()),
        supabase
          .from('user_interactions')
          .select('interaction_type')
          .gte('created_at', cutoffDate.toISOString()),
      ]);

      if (pageViewRes.data) {
        const grouped = pageViewRes.data.reduce(
          (acc, item) => {
            const url = item.page_url;
            const existing = acc.find((p) => p.page_url === url);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ page_url: url, count: 1 });
            }
            return acc;
          },
          [] as PageViewData[]
        );
        setPageViews(grouped.sort((a, b) => b.count - a.count));
      }

      if (sessionRes.data && sessionRes.data.length > 0) {
        const avgPages =
          sessionRes.data.reduce((sum, s) => sum + (s.page_view_count || 1), 0) /
          sessionRes.data.length;
        setSessionData({
          total_sessions: sessionRes.data.length,
          avg_pages_per_session: Math.round(avgPages * 10) / 10,
        });
      }

      if (interactionRes.data) {
        const grouped = interactionRes.data.reduce(
          (acc, item) => {
            const type = item.interaction_type;
            const existing = acc.find((i) => i.interaction_type === type);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ interaction_type: type, count: 1 });
            }
            return acc;
          },
          [] as InteractionData[]
        );
        setInteractions(grouped.sort((a, b) => b.count - a.count));
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalPageViews = pageViews.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">
          Übersicht über Seitenaufrufe und Nutzerverhalten
        </p>
      </div>

      <div className="flex gap-2">
        {(['24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              dateRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range === '24h' ? 'Heute' : range === '7d' ? 'Diese Woche' : 'Diesen Monat'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Seitenaufrufe</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totalPageViews}
                  </p>
                </div>
                <Eye className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Besuchssitzungen</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {sessionData?.total_sessions || 0}
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Seiten pro Sitzung</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {sessionData?.avg_pages_per_session || 0}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Meistbesuchte Seiten
              </h2>
              <div className="space-y-3">
                {pageViews.length > 0 ? (
                  pageViews.slice(0, 10).map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
                      <span className="text-gray-700 truncate">{page.page_url || '/'}</span>
                      <span className="text-gray-900 font-bold">{page.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Keine Daten verfügbar</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Nutzerinteraktionen
              </h2>
              <div className="space-y-3">
                {interactions.length > 0 ? (
                  interactions.map((interaction, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
                      <span className="text-gray-700">{interaction.interaction_type}</span>
                      <span className="text-gray-900 font-bold">{interaction.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Keine Daten verfügbar</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
