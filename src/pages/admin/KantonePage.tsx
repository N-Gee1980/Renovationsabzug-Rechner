import { useState } from 'react';
import { Save, X, Edit2 } from 'lucide-react';
import { useCantons } from '../../hooks/useCantons';
import { supabase } from '../../lib/supabase';
import { formatPercent } from '../../lib/formatters';
import type { Canton } from '../../lib/types';

export default function KantonePage() {
  const { cantons, loading, reload } = useCantons();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Canton>>({});
  const [saving, setSaving] = useState(false);

  function startEdit(canton: Canton) {
    setEditingId(canton.id);
    setForm({
      flat_rate_new: canton.flat_rate_new,
      flat_rate_old: canton.flat_rate_old,
      flat_rate_basis: canton.flat_rate_basis,
      flat_rate_notes: canton.flat_rate_notes,
      energy_deduction_allowed: canton.energy_deduction_allowed,
      energy_waiting_years: canton.energy_waiting_years,
      energy_deduction_notes: canton.energy_deduction_notes,
    });
  }

  async function handleSave() {
    if (!editingId) return;
    setSaving(true);
    await supabase
      .from('cantons')
      .update({
        flat_rate_new: form.flat_rate_new,
        flat_rate_old: form.flat_rate_old,
        flat_rate_basis: form.flat_rate_basis,
        flat_rate_notes: form.flat_rate_notes,
        energy_deduction_allowed: form.energy_deduction_allowed,
        energy_waiting_years: form.energy_waiting_years,
        energy_deduction_notes: form.energy_deduction_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);
    setSaving(false);
    setEditingId(null);
    reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kantone verwalten</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kanton</th>
                <th className="px-4 py-3 text-center">Bis 10 J.</th>
                <th className="px-4 py-3 text-center">Über 10 J.</th>
                <th className="px-4 py-3">Bemessung</th>
                <th className="px-4 py-3 text-center">Energie</th>
                <th className="px-4 py-3 text-center">Karenz</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cantons.map(canton => (
                editingId === canton.id ? (
                  <tr key={canton.id} className="bg-blue-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {canton.abbreviation} -- {canton.name}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={form.flat_rate_new ?? ''}
                        onChange={e => setForm(f => ({ ...f, flat_rate_new: Number(e.target.value) }))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={form.flat_rate_old ?? ''}
                        onChange={e => setForm(f => ({ ...f, flat_rate_old: Number(e.target.value) }))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={form.flat_rate_basis ?? ''}
                        onChange={e => setForm(f => ({ ...f, flat_rate_basis: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={form.energy_deduction_allowed ?? false}
                        onChange={e => setForm(f => ({ ...f, energy_deduction_allowed: e.target.checked }))}
                        className="w-4 h-4 accent-swiss-red"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={form.energy_waiting_years ?? ''}
                        onChange={e => setForm(f => ({ ...f, energy_waiting_years: Number(e.target.value) }))}
                        className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={canton.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900">{canton.abbreviation}</span>
                      <span className="text-gray-500 ml-2">{canton.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{formatPercent(canton.flat_rate_new)}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{formatPercent(canton.flat_rate_old)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{canton.flat_rate_basis}</td>
                    <td className="px-4 py-3 text-center">
                      {canton.energy_deduction_allowed ? (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Ja</span>
                      ) : (
                        <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Nein</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">{canton.energy_waiting_years} J.</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => startEdit(canton)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
