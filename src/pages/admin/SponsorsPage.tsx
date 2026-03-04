import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard as Edit2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Sponsor } from '../../hooks/useSponsors';

export const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    image_url: '',
    alt_text: '',
    active: true,
    order: 0,
  });

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');

      const payload = {
        name: formData.name,
        url: formData.url,
        image_url: formData.image_url,
        alt_text: formData.alt_text,
        active: formData.active,
        order: formData.order,
      };

      if (editingId && editingId !== 'new') {
        const { error } = await supabase
          .from('sponsors')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sponsors')
          .insert([payload]);

        if (error) throw error;
      }

      setEditingId(null);
      setFormData({
        name: '',
        url: '',
        image_url: '',
        alt_text: '',
        active: true,
        order: 0,
      });
      await fetchSponsors();
    } catch (err) {
      let message = 'Fehler beim Speichern';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as any).message);
      } else if (typeof err === 'object' && err !== null) {
        message = JSON.stringify(err);
      }
      setError(message);
      console.error('Error saving sponsor:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Wirklich löschen?')) {
      try {
        const { error } = await supabase
          .from('sponsors')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchSponsors();
      } catch (error) {
        console.error('Error deleting sponsor:', error);
      }
    }
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingId(sponsor.id);
    setFormData({
      name: sponsor.name,
      url: sponsor.url,
      image_url: sponsor.image_url,
      alt_text: sponsor.alt_text,
      active: sponsor.active,
      order: sponsor.order,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setError('');
    setFormData({
      name: '',
      url: '',
      image_url: '',
      alt_text: '',
      active: true,
      order: 0,
    });
  };

  const toggleActive = async (sponsor: Sponsor) => {
    try {
      const { error } = await supabase
        .from('sponsors')
        .update({ active: !sponsor.active })
        .eq('id', sponsor.id);

      if (error) throw error;
      fetchSponsors();
    } catch (error) {
      console.error('Error updating sponsor:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Sponsoren verwalten</h1>
        {!editingId && (
          <button
            onClick={() => setEditingId('new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Neuer Sponsor
          </button>
        )}
      </div>

      {editingId && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingId === 'new' ? 'Neuer Sponsor' : 'Sponsor bearbeiten'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sponsor Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Logo/Banner URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Alt-Text (Zugänglichkeit)
            </label>
            <input
              type="text"
              value={formData.alt_text}
              onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Beschreibung für Screenreader"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sortierung
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-slate-700">Aktiv</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Speichern
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Sortierung
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {sponsor.name}
                  </td>
                  <td className="px-6 py-4">
                    <img
                      src={sponsor.image_url}
                      alt={sponsor.alt_text || sponsor.name}
                      className="max-h-12 max-w-[120px] object-contain"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {sponsor.order}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleActive(sponsor)}
                      className="flex items-center gap-1 text-slate-700 hover:text-slate-900"
                      title={sponsor.active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {sponsor.active ? (
                        <>
                          <Eye size={16} />
                          <span className="text-xs">Aktiv</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={16} />
                          <span className="text-xs">Inaktiv</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(sponsor)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Bearbeiten"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sponsor.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sponsors.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            Keine Sponsoren vorhanden. Fügen Sie einen neuen Sponsor hinzu.
          </div>
        )}
      </div>
    </div>
  );
};
