import { useState, useEffect, useMemo } from 'react';
import { Copy, Save, Check, Filter } from 'lucide-react';
import { useCantons } from '../../hooks/useCantons';
import { useCategories } from '../../hooks/useCategories';
import { supabase } from '../../lib/supabase';
import { formatPercent } from '../../lib/formatters';
import type { CantonCategoryRule } from '../../lib/types';

const currentYear = new Date().getFullYear();
const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

export default function RegelnPage() {
  const { cantons } = useCantons();
  const { categories } = useCategories();
  const [rules, setRules] = useState<CantonCategoryRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterCanton, setFilterCanton] = useState('');
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ is_deductible: true, deduction_percentage: 100, notes: '' });
  const [saving, setSaving] = useState(false);
  const [copySource, setCopySource] = useState(currentYear);
  const [copyTarget, setCopyTarget] = useState(currentYear + 1);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRules();
  }, [filterYear]);

  async function loadRules() {
    setLoading(true);
    const { data } = await supabase
      .from('canton_category_rules')
      .select('*')
      .eq('tax_year', filterYear);
    setRules(data ?? []);
    setLoading(false);
  }

  const filteredCantons = filterCanton
    ? cantons.filter(c => c.id === filterCanton)
    : cantons;

  const rulesMap = useMemo(() => {
    const map = new Map<string, CantonCategoryRule>();
    rules.forEach(r => map.set(`${r.canton_id}:${r.category_id}`, r));
    return map;
  }, [rules]);

  function getRule(cantonId: string, categoryId: string) {
    return rulesMap.get(`${cantonId}:${categoryId}`);
  }

  function startEdit(rule: CantonCategoryRule) {
    setEditingRule(rule.id);
    setEditForm({
      is_deductible: rule.is_deductible,
      deduction_percentage: rule.deduction_percentage,
      notes: rule.notes,
    });
  }

  async function saveEdit() {
    if (!editingRule) return;
    setSaving(true);
    await supabase
      .from('canton_category_rules')
      .update({
        is_deductible: editForm.is_deductible,
        deduction_percentage: editForm.is_deductible ? editForm.deduction_percentage : 0,
        notes: editForm.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingRule);
    setSaving(false);
    setEditingRule(null);
    loadRules();
  }

  async function copyRulesForYear() {
    setSaving(true);
    const { data: sourceRules } = await supabase
      .from('canton_category_rules')
      .select('*')
      .eq('tax_year', copySource);

    if (sourceRules && sourceRules.length > 0) {
      const { data: existing } = await supabase
        .from('canton_category_rules')
        .select('canton_id, category_id')
        .eq('tax_year', copyTarget);

      const existingKeys = new Set(
        (existing ?? []).map(e => `${e.canton_id}:${e.category_id}`)
      );

      const newRules = sourceRules
        .filter(r => !existingKeys.has(`${r.canton_id}:${r.category_id}`))
        .map(r => ({
          canton_id: r.canton_id,
          category_id: r.category_id,
          tax_year: copyTarget,
          is_deductible: r.is_deductible,
          deduction_percentage: r.deduction_percentage,
          max_amount: r.max_amount,
          notes: r.notes,
        }));

      if (newRules.length > 0) {
        await supabase.from('canton_category_rules').insert(newRules);
      }
    }

    setSaving(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowCopyDialog(false);
    setFilterYear(copyTarget);
    loadRules();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abzugsregeln</h1>
        <button
          onClick={() => setShowCopyDialog(!showCopyDialog)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Regeln kopieren
        </button>
      </div>

      {showCopyDialog && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Regeln für neues Steuerjahr kopieren</h3>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Von Jahr</label>
              <select
                value={copySource}
                onChange={e => setCopySource(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nach Jahr</label>
              <select
                value={copyTarget}
                onChange={e => setCopyTarget(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              onClick={copyRulesForYear}
              disabled={saving || copySource === copyTarget}
              className="inline-flex items-center gap-2 px-4 py-2 bg-swiss-red text-white text-sm font-medium rounded-lg hover:bg-swiss-red-dark transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Kopiert' : 'Kopieren'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Kopiert alle Regeln eines Jahres als Vorlage. Bestehende Regeln im Zieljahr werden nicht überschrieben.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <select
          value={filterCanton}
          onChange={e => setFilterCanton(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Alle Kantone</option>
          {cantons.map(c => (
            <option key={c.id} value={c.id}>{c.abbreviation} -- {c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 sticky left-0 bg-gray-50 z-10">Kanton</th>
                  {categories.map(cat => (
                    <th key={cat.id} className="px-3 py-3 text-center min-w-[100px]">
                      <span className="block truncate max-w-[100px]" title={cat.name}>
                        {cat.name.split(' ')[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCantons.map(canton => (
                  <tr key={canton.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                      {canton.abbreviation}
                    </td>
                    {categories.map(cat => {
                      const rule = getRule(canton.id, cat.id);
                      if (!rule) {
                        return (
                          <td key={cat.id} className="px-3 py-2 text-center text-gray-300">
                            --
                          </td>
                        );
                      }

                      if (editingRule === rule.id) {
                        return (
                          <td key={cat.id} className="px-2 py-2">
                            <div className="space-y-1">
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={editForm.is_deductible}
                                  onChange={e => setEditForm(f => ({ ...f, is_deductible: e.target.checked }))}
                                  className="w-3 h-3 accent-swiss-red"
                                />
                                Abzug
                              </label>
                              {editForm.is_deductible && (
                                <input
                                  type="number"
                                  value={editForm.deduction_percentage}
                                  onChange={e => setEditForm(f => ({ ...f, deduction_percentage: Number(e.target.value) }))}
                                  className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                                  min="0"
                                  max="100"
                                />
                              )}
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <Save className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingRule(null)}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                >
                                  <span className="text-xs">X</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={cat.id}
                          className={`px-3 py-2 text-center cursor-pointer transition-colors ${
                            rule.is_deductible
                              ? 'text-green-700 hover:bg-green-50'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          onClick={() => startEdit(rule)}
                          title={rule.notes || (rule.is_deductible ? 'Abzugsfähig' : 'Nicht abzugsfähig')}
                        >
                          {rule.is_deductible ? formatPercent(rule.deduction_percentage) : '--'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200" />
          Prozent = abzugsfähig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
          -- = nicht abzugsfähig
        </span>
        <span>Klicken zum Bearbeiten</span>
      </div>
    </div>
  );
}
