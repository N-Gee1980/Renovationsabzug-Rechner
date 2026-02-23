import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus, ArrowRight, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Info, AlertCircle,
} from 'lucide-react';
import EditableEntryRow from '../components/EditableEntryRow';
import { useUserSession } from '../hooks/useSession';
import { useCantons } from '../hooks/useCantons';
import { useCategories } from '../hooks/useCategories';
import { useRules } from '../hooks/useRules';
import { formatCHF, formatPercent, propertyAgeLabel, isoToEuropean, europeanToIso, isValidEuropeanDate } from '../lib/formatters';
import type { RenovationCategory } from '../lib/types';

export default function ErfassungPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, entries, loading, addEntry, updateEntry, deleteEntry, updateSessionDetails } = useUserSession(sessionId);
  const { cantons } = useCantons();
  const { categories } = useCategories();

  const canton = cantons.find(c => c.id === session?.canton_id);
  const { getRuleForCategory } = useRules(session?.canton_id, session?.tax_year);

  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [renovationDate, setRenovationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eigenmietwertInput, setEigenmietwertInput] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const savedData = localStorage.getItem(`draft-${sessionId}`);
    if (savedData) {
      try {
        const draft = JSON.parse(savedData);
        if (draft.categoryId || draft.description || draft.amount || draft.renovationDate) {
          setCategoryId(draft.categoryId || '');
          setDescription(draft.description || '');
          setAmount(draft.amount || '');
          setRenovationDate(draft.renovationDate || '');
          setDraftRestored(true);
          setTimeout(() => setDraftRestored(false), 5000);
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    if (categoryId || description || amount || renovationDate) {
      localStorage.setItem(`draft-${sessionId}`, JSON.stringify({
        categoryId,
        description,
        amount,
        renovationDate,
      }));
    } else {
      localStorage.removeItem(`draft-${sessionId}`);
    }
  }, [sessionId, categoryId, description, amount, renovationDate]);

  useEffect(() => {
    const hasUnsavedData = categoryId || description || amount || renovationDate;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = 'Sie haben ungespeicherte Eingaben im Formular. Diese werden automatisch gespeichert und können später weiterbearbeitet werden.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [categoryId, description, amount, renovationDate]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  const grouped = useMemo(() => {
    const groups: Record<string, RenovationCategory[]> = {
      werterhaltend: [],
      energiesparend: [],
      wertvermehrend: [],
    };
    categories.forEach(c => {
      groups[c.deduction_type]?.push(c);
    });
    return groups;
  }, [categories]);

  const totals = useMemo(() => {
    const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
    const deductibleAmount = entries.reduce((s, e) => s + e.deduction_amount, 0);
    const nonDeductible = totalAmount - deductibleAmount;
    return { totalAmount, deductibleAmount, nonDeductible };
  }, [entries]);

  const flatRate = canton
    ? session?.property_age === 'under_10'
      ? canton.flat_rate_new
      : canton.flat_rate_old
    : 0;

  function getDeductionInfo(cat: RenovationCategory | undefined) {
    if (!cat) return { isDeductible: false, percentage: 0, note: '' };

    if (cat.deduction_type === 'wertvermehrend') {
      return { isDeductible: false, percentage: 0, note: 'Wertvermehrende Investitionen sind nicht abzugsfähig.' };
    }

    const rule = getRuleForCategory(cat.id);
    if (rule) {
      return {
        isDeductible: rule.is_deductible,
        percentage: rule.deduction_percentage,
        note: rule.notes,
      };
    }

    if (cat.deduction_type === 'energiesparend') {
      return {
        isDeductible: canton?.energy_deduction_allowed ?? true,
        percentage: canton?.energy_deduction_allowed ? 100 : 0,
        note: canton?.energy_deduction_notes || 'Energiesparmassnahme',
      };
    }

    return { isDeductible: true, percentage: 100, note: 'Werterhaltend -- vollumfänglich abzugsfähig.' };
  }

  const deductionInfo = getDeductionInfo(selectedCategory);

  function validateYear(europeanDate: string): boolean {
    if (!session) return true;
    if (!isValidEuropeanDate(europeanDate)) return false;
    const iso = europeanToIso(europeanDate);
    const year = new Date(iso).getFullYear();
    return year === session.tax_year;
  }

  function handleDateChange(date: string) {
    setRenovationDate(date);
    if (date === '') {
      setDateError(null);
    } else if (!isValidEuropeanDate(date)) {
      setDateError('Bitte geben Sie ein gültiges Datum im Format TT.MM.JJJJ ein.');
    } else if (session && !validateYear(date)) {
      setDateError(`Das Datum muss im Steuerjahr ${session.tax_year} liegen.`);
    } else {
      setDateError(null);
    }
  }

  async function handleAdd() {
    if (!categoryId || !amount) return;

    if (!isValidEuropeanDate(renovationDate)) {
      setDateError('Bitte geben Sie ein gültiges Datum im Format TT.MM.JJJJ ein.');
      return;
    }

    if (!validateYear(renovationDate)) {
      setDateError(`Das Datum muss im Steuerjahr ${session?.tax_year} liegen.`);
      return;
    }

    setSubmitting(true);
    const amountNum = parseFloat(amount);
    const deductionAmount = deductionInfo.isDeductible
      ? Math.round(amountNum * deductionInfo.percentage / 100)
      : 0;

    const result = await addEntry({
      category_id: categoryId,
      description,
      amount: amountNum,
      renovation_date: europeanToIso(renovationDate),
      is_deductible: deductionInfo.isDeductible,
      deduction_percentage: deductionInfo.percentage,
      deduction_amount: deductionAmount,
    });

    if (result && !result.error) {
      setCategoryId('');
      setDescription('');
      setAmount('');
      setRenovationDate('');
      setDateError(null);
      if (sessionId) {
        localStorage.removeItem(`draft-${sessionId}`);
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await deleteEntry(id);
  }

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const groupLabels: Record<string, string> = {
    werterhaltend: 'Werterhaltend (abzugsfähig)',
    energiesparend: 'Energiesparend (abzugsfähig)',
    wertvermehrend: 'Wertvermehrend (nicht abzugsfähig)',
  };

  return (
    <div className="space-y-6">
      {draftRestored && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-green-800">Willkommen zurück!</p>
            <p className="text-green-700">Ihre Formular-Eingaben wurden automatisch gespeichert und wiederhergestellt. Sie können jetzt weiterarbeiten oder auf "Hinzufügen" klicken, um die Daten zu speichern.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => {
              const hasUnsaved = categoryId || description || amount || renovationDate;
              if (hasUnsaved) {
                if (confirm('Sie haben ungespeicherte Eingaben im Formular. Diese bleiben gespeichert und können später weiterbearbeitet werden. Möchten Sie die Seite verlassen?')) {
                  navigate(`/?session=${sessionId}`);
                }
              } else {
                navigate(`/?session=${sessionId}`);
              }
            }}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Renovationen erfassen</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {canton && (
            <span className="px-2.5 py-1 bg-gray-100 rounded-md font-medium text-gray-700">
              {canton.abbreviation}
            </span>
          )}
          <span className="text-gray-500">{session.tax_year}</span>
          <span className="text-gray-400">&middot;</span>
          <span className="text-gray-500">{propertyAgeLabel(session.property_age)}</span>
        </div>
      </div>

      {canton && (
        <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 flex-1">
            <p>
              <span className="font-medium">Pauschalabzug {canton.name}: {formatPercent(flatRate)}</span> des {canton.flat_rate_basis}.
              Die Einzelerfassung lohnt sich nur, wenn Ihre effektiven Kosten den Pauschalabzug übersteigen.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs font-medium text-blue-700 whitespace-nowrap">Eigenmietwert (CHF):</label>
              <input
                type="number"
                value={eigenmietwertInput ?? String(session.eigenmietwert || '')}
                onChange={e => setEigenmietwertInput(e.target.value)}
                onBlur={() => {
                  const val = eigenmietwertInput ? parseFloat(eigenmietwertInput) : 0;
                  if (val !== session.eigenmietwert) {
                    updateSessionDetails({ eigenmietwert: val });
                  }
                }}
                placeholder="0"
                min="0"
                className="w-32 px-2 py-1 border border-blue-200 rounded text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-400"
              />
              {session.eigenmietwert > 0 && (
                <span className="text-xs text-blue-600">
                  Pauschal: {formatCHF(Math.round(session.eigenmietwert * flatRate / 100))}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-swiss-red" />
          Renovation hinzufügen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorie</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-swiss-red"
            >
              <option value="">Kategorie wählen...</option>
              {Object.entries(grouped).map(([type, cats]) =>
                cats.length > 0 && (
                  <optgroup key={type} label={groupLabels[type]}>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )
              )}
            </select>
          </div>

          {selectedCategory && (
            <div className={`md:col-span-2 flex items-start gap-2 p-3 rounded-lg text-sm ${
              deductionInfo.isDeductible
                ? 'bg-green-50 border border-green-100'
                : selectedCategory.deduction_type === 'wertvermehrend'
                ? 'bg-red-50 border border-red-100'
                : 'bg-amber-50 border border-amber-100'
            }`}>
              {deductionInfo.isDeductible ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : selectedCategory.deduction_type === 'wertvermehrend' ? (
                <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  deductionInfo.isDeductible ? 'text-green-800' : selectedCategory.deduction_type === 'wertvermehrend' ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {deductionInfo.isDeductible
                    ? `Abzugsfähig (${formatPercent(deductionInfo.percentage)})`
                    : 'Nicht abzugsfähig'}
                </p>
                {deductionInfo.note && (
                  <p className={`mt-0.5 ${
                    deductionInfo.isDeductible ? 'text-green-700' : selectedCategory.deduction_type === 'wertvermehrend' ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {deductionInfo.note}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibung</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="z.B. Badezimmer komplett saniert"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-swiss-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Betrag (CHF)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-swiss-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum (TT.MM.JJJJ)</label>
            <input
              type="text"
              value={renovationDate}
              onChange={e => handleDateChange(e.target.value)}
              placeholder="TT.MM.JJJJ"
              className={`w-full px-3 py-2.5 border rounded-lg text-gray-900 focus:outline-none ${
                dateError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-swiss-red'
              }`}
            />
            {dateError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={!categoryId || !amount || submitting || !!dateError}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-swiss-red text-white font-medium rounded-lg hover:bg-swiss-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Hinzufügen
            </button>
            {(categoryId || description || amount || renovationDate) && (
              <button
                onClick={() => {
                  if (confirm('Möchten Sie wirklich alle Formular-Eingaben löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                    setCategoryId('');
                    setDescription('');
                    setAmount('');
                    setRenovationDate('');
                    setDateError(null);
                    if (sessionId) {
                      localStorage.removeItem(`draft-${sessionId}`);
                    }
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Eingaben löschen
              </button>
            )}
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Erfasste Renovationen ({entries.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Kategorie</th>
                  <th className="px-6 py-3">Beschreibung</th>
                  <th className="px-6 py-3 text-right">Betrag</th>
                  <th className="px-6 py-3 text-center">Datum</th>
                  <th className="px-6 py-3 text-center">Abzugsfähig</th>
                  <th className="px-6 py-3 text-right">Abzug</th>
                  <th className="px-6 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(entry => (
                  <EditableEntryRow
                    key={entry.id}
                    entry={entry}
                    category={categories.find(c => c.id === entry.category_id)}
                    categories={categories}
                    groupLabels={groupLabels}
                    grouped={grouped}
                    getDeductionInfo={getDeductionInfo}
                    taxYear={session.tax_year}
                    onSave={async (id, updates) => { await updateEntry(id, updates); }}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Renovationskosten</p>
            <p className="text-2xl font-bold text-gray-900">{formatCHF(totals.totalAmount)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Davon abzugsfähig</p>
            <p className="text-2xl font-bold text-green-700">{formatCHF(totals.deductibleAmount)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Nicht abzugsfähig</p>
            <p className="text-2xl font-bold text-gray-500">{formatCHF(totals.nonDeductible)}</p>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="mt-6 flex justify-end">
            {(categoryId || description || amount || renovationDate) && (
              <div className="flex items-center gap-3 mr-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Formular-Eingaben noch nicht gespeichert. Klicken Sie erst "Hinzufügen" oder Ihre Eingaben bleiben im Formular erhalten.
                </span>
              </div>
            )}
            <button
              onClick={() => {
                const hasUnsaved = categoryId || description || amount || renovationDate;
                if (hasUnsaved) {
                  if (confirm('Sie haben ungespeicherte Eingaben im Formular. Diese bleiben gespeichert und können nach dem Drucken weiterbearbeitet werden. Möchten Sie zur Zusammenfassung wechseln?')) {
                    navigate(`/zusammenfassung/${sessionId}`);
                  }
                } else {
                  navigate(`/zusammenfassung/${sessionId}`);
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-swiss-red text-white font-medium rounded-lg hover:bg-swiss-red-dark transition-colors"
            >
              Zur Zusammenfassung
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
