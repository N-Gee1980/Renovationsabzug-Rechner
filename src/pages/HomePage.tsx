import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ClipboardList, Printer, ChevronDown, Info, ArrowRight } from 'lucide-react';
import { useCantons } from '../hooks/useCantons';
import { supabase } from '../lib/supabase';
import { formatPercent } from '../lib/formatters';
import { Sponsors } from '../components/Sponsors';
import type { PropertyAge, Canton } from '../lib/types';

const currentYear = new Date().getFullYear();
const taxYears = [currentYear, currentYear - 1, currentYear - 2];

const steps = [
  { icon: Building2, title: 'Kanton wählen', desc: 'Wählen Sie Ihren Kanton und das Steuerjahr' },
  { icon: ClipboardList, title: 'Erfassen', desc: 'Tragen Sie Ihre Renovationskosten ein' },
  { icon: Printer, title: 'Drucken', desc: 'Drucken Sie die Zusammenfassung für die Steuererklärung' },
];

export default function HomePage() {
  const { cantons, loading: cantonsLoading } = useCantons();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingSessionId = searchParams.get('session');

  const [cantonId, setCantonId] = useState('');
  const [taxYear, setTaxYear] = useState(currentYear - 1);
  const [propertyAge, setPropertyAge] = useState<PropertyAge>('over_10');
  const [ownerName, setOwnerName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [eigenmietwert, setEigenmietwert] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [entryCount, setEntryCount] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(!existingSessionId);

  useEffect(() => {
    if (!existingSessionId) return;

    (async () => {
      const { data: sess } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', existingSessionId)
        .maybeSingle();

      if (sess) {
        setCantonId(sess.canton_id);
        setTaxYear(sess.tax_year);
        setPropertyAge(sess.property_age);
        setOwnerName(sess.owner_name || '');
        setPropertyAddress(sess.property_address || '');
        setEigenmietwert(sess.eigenmietwert ? String(sess.eigenmietwert) : '');

        const { count } = await supabase
          .from('renovation_entries')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', existingSessionId);
        setEntryCount(count ?? 0);
      }
      setSessionLoaded(true);
    })();
  }, [existingSessionId]);

  const selectedCanton = cantons.find(c => c.id === cantonId);

  const filteredCantons = cantons.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.abbreviation.toLowerCase().includes(search.toLowerCase())
  );

  function getFlatRate(canton: Canton): number {
    return propertyAge === 'under_10' ? canton.flat_rate_new : canton.flat_rate_old;
  }

  async function handleStart() {
    if (!cantonId) return;
    setSubmitting(true);

    if (existingSessionId) {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          canton_id: cantonId,
          tax_year: taxYear,
          property_age: propertyAge,
          owner_name: ownerName,
          property_address: propertyAddress,
          eigenmietwert: eigenmietwert ? parseFloat(eigenmietwert) : 0,
        })
        .eq('id', existingSessionId);

      if (!error) {
        navigate(`/erfassung/${existingSessionId}`);
      }
    } else {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          canton_id: cantonId,
          tax_year: taxYear,
          property_age: propertyAge,
          owner_name: ownerName,
          property_address: propertyAddress,
          eigenmietwert: eigenmietwert ? parseFloat(eigenmietwert) : 0,
        })
        .select('id')
        .maybeSingle();

      if (!error && data) {
        navigate(`/erfassung/${data.id}`);
      }
    }
    setSubmitting(false);
  }

  if (!sessionLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-swiss-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Renovationskosten
              <span className="block text-swiss-red">steuerlich abziehen</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Erfassen Sie Ihre Liegenschafts-Renovationen und erhalten Sie eine druckbare
              Übersicht für die Steuererklärung -- mit den aktuellen Abzugsregeln Ihres Kantons.
            </p>
            <div className="mt-6 flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-1">Datenschutz</p>
                <p>
                  Ihre Daten werden temporär gespeichert, um die Erfassung über mehrere Seiten zu ermöglichen.
                  Diese Webseite dient ausschliesslich als Hilfestellung für das einmalige Erfassen der abzugsfähigen
                  Renovationskosten für das gewählte Steuerjahr. Nach dem Drucken der Zusammenfassung können Sie
                  Ihre Daten vollständig löschen. Die Daten werden nicht analysiert, nicht weitergegeben und aus
                  Datenschutzgründen auch nicht zwischengespeichert oder archiviert.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-gray-500">{i + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <step.icon className="w-4 h-4 text-swiss-red" />
                    <span className="font-medium text-gray-900">{step.title}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-xl mx-auto">
          {existingSessionId && entryCount > 0 && (
            <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Bestehende Erfassung</p>
                <p>
                  Sie haben bereits {entryCount} Renovation{entryCount !== 1 ? 'en' : ''} erfasst.
                  Sie können hier Ihre Angaben anpassen und dann zur Erfassung zurückkehren --
                  Ihre bisherigen Einträge bleiben erhalten.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {existingSessionId ? 'Erfassung anpassen' : 'Neue Erfassung starten'}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kanton</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSearch(!showSearch)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg text-left hover:border-gray-400 transition-colors bg-white"
                  >
                    <span className={selectedCanton ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedCanton
                        ? `${selectedCanton.abbreviation} -- ${selectedCanton.name}`
                        : 'Kanton auswählen...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {showSearch && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                      <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Suchen..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-swiss-red"
                          autoFocus
                        />
                      </div>
                      {cantonsLoading ? (
                        <div className="p-4 text-sm text-gray-400 text-center">Laden...</div>
                      ) : filteredCantons.length === 0 ? (
                        <div className="p-4 text-sm text-gray-400 text-center">Kein Kanton gefunden</div>
                      ) : (
                        filteredCantons.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCantonId(c.id);
                              setShowSearch(false);
                              setSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                              c.id === cantonId ? 'bg-red-50 text-swiss-red' : 'text-gray-700'
                            }`}
                          >
                            <span className="w-8 text-xs font-medium text-gray-400">{c.abbreviation}</span>
                            <span>{c.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Steuerjahr</label>
                  <select
                    value={taxYear}
                    onChange={e => setTaxYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-swiss-red"
                  >
                    {taxYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Liegenschaftsalter</label>
                  <select
                    value={propertyAge}
                    onChange={e => setPropertyAge(e.target.value as PropertyAge)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-swiss-red"
                  >
                    <option value="under_10">Bis 10 Jahre</option>
                    <option value="over_10">Über 10 Jahre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name (optional)</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Eigentümer/in"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-swiss-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse der Liegenschaft (optional)</label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={e => setPropertyAddress(e.target.value)}
                  placeholder="Strasse, PLZ Ort"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-swiss-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Eigenmietwert / Brutto-Mietertrag pro Jahr (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">CHF</span>
                  <input
                    type="number"
                    value={eigenmietwert}
                    onChange={e => setEigenmietwert(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1"
                    className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-swiss-red"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Ermöglicht den Vergleich von Pauschalabzug und effektiven Kosten in der Zusammenfassung.
                </p>
              </div>

              {selectedCanton && (
                <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Pauschalabzug im Kanton {selectedCanton.name}</p>
                    <p className="mt-1">
                      {formatPercent(getFlatRate(selectedCanton))} des {selectedCanton.flat_rate_basis}
                    </p>
                    {selectedCanton.flat_rate_notes && (
                      <p className="mt-1 text-blue-600">{selectedCanton.flat_rate_notes}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={!cantonId || submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-swiss-red text-white font-medium rounded-lg hover:bg-swiss-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {existingSessionId ? 'Übernehmen und weiter erfassen' : 'Erfassung starten'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Sponsors />
    </div>
  );
}
