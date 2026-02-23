import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Info, CheckCircle2, ArrowUpRight, Trash2 } from 'lucide-react';
import { useCantons } from '../hooks/useCantons';
import { useCategories } from '../hooks/useCategories';
import { formatCHF, formatPercent, propertyAgeLabel } from '../lib/formatters';
import { supabase } from '../lib/supabase';
import { openPrintWindow } from '../lib/printWindow';
import type { UserSession, RenovationEntry } from '../lib/types';

export default function ZusammenfassungPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const [session, setSession] = useState<UserSession | null>(null);
  const [entries, setEntries] = useState<RenovationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { cantons } = useCantons();
  const { categories } = useCategories();

  const canton = cantons.find(c => c.id === session?.canton_id);

  const flatRate = canton
    ? session?.property_age === 'under_10'
      ? canton.flat_rate_new
      : canton.flat_rate_old
    : 0;

  const grouped = useMemo(() => {
    const deductible = entries.filter(e => e.is_deductible && categories.find(c => c.id === e.category_id)?.deduction_type === 'werterhaltend');
    const energy = entries.filter(e => e.is_deductible && categories.find(c => c.id === e.category_id)?.deduction_type === 'energiesparend');
    const nonDeductible = entries.filter(e => !e.is_deductible);
    return { deductible, energy, nonDeductible };
  }, [entries, categories]);

  const totals = useMemo(() => {
    const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
    const deductibleAmount = entries.reduce((s, e) => s + e.deduction_amount, 0);
    return { totalAmount, deductibleAmount, nonDeductible: totalAmount - deductibleAmount };
  }, [entries]);

  const fetchData = useCallback(async () => {
    if (!sessionId) return;
    const [sessionResult, entriesResult] = await Promise.all([
      supabase.from('user_sessions').select('*').eq('id', sessionId).maybeSingle(),
      supabase.from('renovation_entries').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
    ]);
    if (sessionResult.data) {
      setSession(sessionResult.data as UserSession);
      setEntries((entriesResult.data ?? []) as RenovationEntry[]);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-600 mb-4">Diese Erfassung wurde nicht gefunden oder bereits gelöscht.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-swiss-red text-white font-medium rounded-lg hover:bg-swiss-red-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zur Startseite
        </Link>
      </div>
    );
  }

  async function handleDelete() {
    if (!sessionId) return;
    if (!confirm('Möchten Sie wirklich alle Daten dieser Erfassung unwiderruflich löschen?')) return;
    setDeleting(true);
    await supabase.from('renovation_entries').delete().eq('session_id', sessionId);
    await supabase.from('user_sessions').delete().eq('id', sessionId);
    navigate('/');
  }

  function renderTable(items: typeof entries, title: string, showDeduction: boolean) {
    if (items.length === 0) return null;
    const sectionTotal = items.reduce((s, e) => s + e.amount, 0);
    const sectionDeduction = items.reduce((s, e) => s + e.deduction_amount, 0);

    return (
      <div className="mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-2 pr-4">Kategorie</th>
              <th className="py-2 pr-4">Beschreibung</th>
              <th className="py-2 text-right">Betrag</th>
              {showDeduction && <th className="py-2 text-right pl-4">Abzug</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(entry => {
              const cat = categories.find(c => c.id === entry.category_id);
              return (
                <tr key={entry.id}>
                  <td className="py-2 pr-4 text-sm text-gray-900">{cat?.name ?? '—'}</td>
                  <td className="py-2 pr-4 text-sm text-gray-600">{entry.description || '—'}</td>
                  <td className="py-2 text-sm text-gray-900 text-right font-medium">{formatCHF(entry.amount)}</td>
                  {showDeduction && (
                    <td className="py-2 text-sm text-right font-medium pl-4 text-green-700">
                      {formatCHF(entry.deduction_amount)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 font-semibold">
              <td colSpan={2} className="py-2 text-sm text-gray-900">Total</td>
              <td className="py-2 text-sm text-gray-900 text-right">{formatCHF(sectionTotal)}</td>
              {showDeduction && (
                <td className="py-2 text-sm text-right text-green-700 pl-4">{formatCHF(sectionDeduction)}</td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <Link
          to={`/erfassung/${sessionId}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Bearbeitung
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!session || !canton) return;
              const fr = session.property_age === 'under_10' ? canton.flat_rate_new : canton.flat_rate_old;
              openPrintWindow({ session, entries, canton, categories, flatRate: fr });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-swiss-red text-white font-medium rounded-lg hover:bg-swiss-red-dark transition-colors"
          >
            <Printer className="w-4 h-4" />
            Drucken
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Daten löschen
          </button>
        </div>
      </div>

      <div id="print-content" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="print-only mb-6 pb-4 border-b-2 border-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Beilage zur Steuererklärung {session.tax_year}
          </p>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Renovationskosten {session.tax_year}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kanton {canton?.name} ({canton?.abbreviation}) &middot; Liegenschaft {propertyAgeLabel(session.property_age).toLowerCase()}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            {session.owner_name && <p className="font-medium">{session.owner_name}</p>}
            {session.property_address && <p>{session.property_address}</p>}
          </div>
        </div>

        {renderTable(grouped.deductible, 'Abzugsfähige Unterhaltskosten (werterhaltend)', true)}
        {renderTable(grouped.energy, 'Abzugsfähige Energiespar- und Umweltschutzmassnahmen', true)}
        {renderTable(grouped.nonDeductible, 'Nicht abzugsfähige Investitionen (wertvermehrend)', false)}

        <div className="border-t-2 border-gray-300 pt-6 mt-6">
          {(() => {
            const pauschalAmount = session.eigenmietwert > 0
              ? Math.round(session.eigenmietwert * flatRate / 100)
              : null;
            const effektivBetter = pauschalAmount !== null && totals.deductibleAmount > pauschalAmount;
            const pauschalBetter = pauschalAmount !== null && pauschalAmount >= totals.deductibleAmount;

            return (
              <>
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  <p className="text-sm text-gray-600">Total Renovationskosten:</p>
                  <p className="text-sm font-semibold text-gray-900 text-right">{formatCHF(totals.totalAmount)}</p>

                  <p className="text-sm text-gray-600">Davon steuerlich abzugsfähig (effektiv):</p>
                  <p className={`text-sm font-semibold text-right ${effektivBetter ? 'text-green-700' : 'text-gray-900'}`}>
                    {formatCHF(totals.deductibleAmount)}
                    {effektivBetter && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1.5 -mt-0.5" />}
                  </p>

                  <p className="no-print text-sm text-gray-600">
                    Pauschalabzug ({formatPercent(flatRate)}
                    {session.eigenmietwert > 0 && ` von ${formatCHF(session.eigenmietwert)}`}):
                  </p>
                  {pauschalAmount !== null ? (
                    <p className={`no-print text-sm font-semibold text-right ${pauschalBetter ? 'text-green-700' : 'text-gray-900'}`}>
                      {formatCHF(pauschalAmount)}
                      {pauschalBetter && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1.5 -mt-0.5" />}
                    </p>
                  ) : (
                    <p className="no-print text-sm text-gray-400 text-right italic">
                      Eigenmietwert nicht angegeben
                    </p>
                  )}

                  {pauschalAmount !== null && (
                    <>
                      <p className="no-print text-sm font-medium text-gray-900 pt-2 border-t border-gray-200">
                        Differenz:
                      </p>
                      <p className={`no-print text-sm font-bold text-right pt-2 border-t border-gray-200 ${
                        effektivBetter ? 'text-green-700' : pauschalBetter ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                        {effektivBetter
                          ? `+${formatCHF(totals.deductibleAmount - pauschalAmount)} zugunsten Effektiv`
                          : pauschalBetter
                          ? `+${formatCHF(pauschalAmount - totals.deductibleAmount)} zugunsten Pauschal`
                          : '—'}
                      </p>
                    </>
                  )}
                </div>

                {pauschalAmount !== null ? (
                  <div className={`no-print mt-6 flex gap-3 p-4 rounded-lg border ${
                    effektivBetter
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <ArrowUpRight className={`w-5 h-5 shrink-0 mt-0.5 ${effektivBetter ? 'text-green-600' : 'text-amber-600'}`} />
                    <div className="text-sm">
                      <p className={`font-semibold ${effektivBetter ? 'text-green-800' : 'text-amber-800'}`}>
                        Empfehlung: {effektivBetter ? 'Effektive Kosten geltend machen' : 'Pauschalabzug wählen'}
                      </p>
                      <p className={`mt-1 ${effektivBetter ? 'text-green-700' : 'text-amber-700'}`}>
                        {effektivBetter
                          ? `Ihre effektiven abzugsfähigen Kosten (${formatCHF(totals.deductibleAmount)}) übersteigen den Pauschalabzug (${formatCHF(pauschalAmount)}) um ${formatCHF(totals.deductibleAmount - pauschalAmount)}. Reichen Sie diese Aufstellung als Beilage zur Steuererklärung ein.`
                          : `Der Pauschalabzug (${formatCHF(pauschalAmount)}) ist günstiger als Ihre effektiven abzugsfähigen Kosten (${formatCHF(totals.deductibleAmount)}). Wählen Sie den Pauschalabzug in Ihrer Steuererklärung.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="no-print mt-6 flex gap-3 p-4 rounded-lg border bg-blue-50 border-blue-100">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Eigenmietwert fehlt</p>
                      <p className="text-gray-700 mt-1">
                        Tragen Sie in der Erfassung Ihren Eigenmietwert ein, um den Pauschalabzug ({formatPercent(flatRate)})
                        mit Ihren effektiven Kosten ({formatCHF(totals.deductibleAmount)}) vergleichen zu können.
                      </p>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="print-only mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>Bitte legen Sie die Belege zu den einzelnen Positionen der Steuererklärung bei.</p>
        </div>
      </div>
    </div>
  );
}
