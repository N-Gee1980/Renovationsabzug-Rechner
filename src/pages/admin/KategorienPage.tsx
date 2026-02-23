import { useState } from 'react';
import { Plus, Edit2, X, Save } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { supabase } from '../../lib/supabase';
import type { RenovationCategory } from '../../lib/types';

const typeLabels: Record<string, { label: string; color: string }> = {
  werterhaltend: { label: 'Werterhaltend', color: 'bg-green-50 text-green-700' },
  energiesparend: { label: 'Energiesparend', color: 'bg-blue-50 text-blue-700' },
  wertvermehrend: { label: 'Wertvermehrend', color: 'bg-red-50 text-red-700' },
};

type DeductionType = 'werterhaltend' | 'wertvermehrend' | 'energiesparend';

interface CategoryForm {
  name: string;
  description: string;
  icon_name: string;
  deduction_type: DeductionType;
  sort_order: number;
}

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  icon_name: 'Wrench',
  deduction_type: 'werterhaltend',
  sort_order: 0,
};

export default function KategorienPage() {
  const { categories, loading, reload } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  function startEdit(cat: RenovationCategory) {
    setEditingId(cat.id);
    setShowNew(false);
    setForm({
      name: cat.name,
      description: cat.description,
      icon_name: cat.icon_name,
      deduction_type: cat.deduction_type,
      sort_order: cat.sort_order,
    });
  }

  function startNew() {
    setEditingId(null);
    setShowNew(true);
    setForm({ ...emptyForm, sort_order: categories.length + 1 });
  }

  async function handleSave() {
    setSaving(true);
    if (editingId) {
      await supabase
        .from('renovation_categories')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editingId);
    } else {
      await supabase.from('renovation_categories').insert(form);
    }
    setSaving(false);
    setEditingId(null);
    setShowNew(false);
    reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function renderForm() {
    return (
      <tr className="bg-blue-50/50">
        <td className="px-4 py-3">
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Beschreibung"
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={form.deduction_type}
            onChange={e => setForm(f => ({ ...f, deduction_type: e.target.value as typeof form.deduction_type }))}
            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
          >
            <option value="werterhaltend">Werterhaltend</option>
            <option value="energiesparend">Energiesparend</option>
            <option value="wertvermehrend">Wertvermehrend</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditingId(null); setShowNew(false); }}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kategorien verwalten</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-swiss-red text-white text-sm font-medium rounded-lg hover:bg-swiss-red-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neue Kategorie
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Beschreibung</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3 text-center">Reihenfolge</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {showNew && renderForm()}
              {categories.map(cat =>
                editingId === cat.id ? renderForm() : (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[250px] truncate">{cat.description}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeLabels[cat.deduction_type].color}`}>
                        {typeLabels[cat.deduction_type].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">{cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
