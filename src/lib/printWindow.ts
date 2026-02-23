import type { Canton, RenovationCategory, RenovationEntry, UserSession } from './types';
import { formatCHF, formatPercent, propertyAgeLabel } from './formatters';

interface PrintData {
  session: UserSession;
  entries: RenovationEntry[];
  canton: Canton;
  categories: RenovationCategory[];
  flatRate: number;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSection(
  items: RenovationEntry[],
  categories: RenovationCategory[],
  title: string,
  showDeduction: boolean
): string {
  if (items.length === 0) return '';

  const sectionTotal = items.reduce((s, e) => s + e.amount, 0);
  const sectionDeduction = items.reduce((s, e) => s + e.deduction_amount, 0);

  const rows = items.map(entry => {
    const cat = categories.find(c => c.id === entry.category_id);
    return `<tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:8px 16px 8px 0;font-size:14px">${esc(cat?.name ?? '\u2014')}</td>
      <td style="padding:8px 16px 8px 0;font-size:14px;color:#6b7280">${esc(entry.description || '\u2014')}</td>
      <td style="padding:8px 0;font-size:14px;text-align:right;font-weight:500">${formatCHF(entry.amount)}</td>
      ${showDeduction ? `<td style="padding:8px 0 8px 16px;font-size:14px;text-align:right;font-weight:500;color:#15803d">${formatCHF(entry.deduction_amount)}</td>` : ''}
    </tr>`;
  }).join('');

  return `<div style="margin-bottom:32px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:12px;color:#111827">${esc(title)}</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:2px solid #e5e7eb">
          <th style="padding:8px 16px 8px 0;text-align:left;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Kategorie</th>
          <th style="padding:8px 16px 8px 0;text-align:left;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Beschreibung</th>
          <th style="padding:8px 0;text-align:right;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Betrag</th>
          ${showDeduction ? '<th style="padding:8px 0 8px 16px;text-align:right;font-size:12px;font-weight:500;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Abzug</th>' : ''}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #e5e7eb">
          <td colspan="2" style="padding:8px 0;font-size:14px;font-weight:600">Total</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right">${formatCHF(sectionTotal)}</td>
          ${showDeduction ? `<td style="padding:8px 0 8px 16px;font-size:14px;font-weight:600;text-align:right;color:#15803d">${formatCHF(sectionDeduction)}</td>` : ''}
        </tr>
      </tfoot>
    </table>
  </div>`;
}

function buildHtml(data: PrintData): string {
  const { session, entries, canton, categories, flatRate } = data;

  const deductible = entries.filter(e => e.is_deductible && categories.find(c => c.id === e.category_id)?.deduction_type === 'werterhaltend');
  const energy = entries.filter(e => e.is_deductible && categories.find(c => c.id === e.category_id)?.deduction_type === 'energiesparend');
  const nonDeductible = entries.filter(e => !e.is_deductible);

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const deductibleAmount = entries.reduce((s, e) => s + e.deduction_amount, 0);

  const pauschalAmount = session.eigenmietwert > 0
    ? Math.round(session.eigenmietwert * flatRate / 100)
    : null;

  const section1 = buildSection(deductible, categories, 'Abzugsf\u00e4hige Unterhaltskosten (werterhaltend)', true);
  const section2 = buildSection(energy, categories, 'Abzugsf\u00e4hige Energiespar- und Umweltschutzmassnahmen', true);
  const section3 = buildSection(nonDeductible, categories, 'Nicht abzugsf\u00e4hige Investitionen (wertvermehrend)', false);

  const pauschalRow = pauschalAmount !== null ? `
    <div style="display:flex;justify-content:space-between;max-width:450px;margin-top:12px">
      <span style="font-size:14px;color:#6b7280">Pauschalabzug (${formatPercent(flatRate)}${session.eigenmietwert > 0 ? ` von ${formatCHF(session.eigenmietwert)}` : ''}):</span>
      <span style="font-size:14px;font-weight:600">${formatCHF(pauschalAmount)}</span>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Renovationskosten ${session.tax_year} \u2013 Druckansicht</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;line-height:1.5;background:#f9fafb}
.toolbar{background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.toolbar-title{font-size:14px;font-weight:600;color:#374151}
.toolbar-actions{display:flex;gap:8px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:500;border-radius:8px;border:1px solid transparent;cursor:pointer;font-family:inherit;transition:background 0.15s,border-color 0.15s}
.btn-print{background:#dc2626;color:#fff;border-color:#dc2626}
.btn-print:hover{background:#b91c1c}
.btn-close{background:#fff;color:#374151;border-color:#d1d5db}
.btn-close:hover{background:#f3f4f6}
.page{max-width:800px;margin:24px auto;padding:0 24px}
.card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb;padding:40px}
.print-header{display:none}
.print-footer{display:none}
@media print{
  body{background:#fff}
  .toolbar{display:none!important}
  .page{max-width:none;margin:0;padding:0}
  .card{border:none;box-shadow:none;border-radius:0;padding:0}
  .print-header{display:block!important}
  .print-footer{display:block!important}
  table{page-break-inside:auto}
  tr{page-break-inside:avoid}
}
</style>
</head>
<body>
<div class="toolbar">
  <span class="toolbar-title">Druckvorschau</span>
  <div class="toolbar-actions">
    <button class="btn btn-print" onclick="window.print()">Drucken</button>
    <button class="btn btn-close" onclick="window.close()">Schliessen</button>
  </div>
</div>
<div class="page">
  <div class="card">
    <div class="print-header" style="margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #d1d5db">
      <p style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Beilage zur Steuererkl\u00e4rung ${session.tax_year}</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
      <div>
        <h1 style="font-size:24px;font-weight:700;color:#111827">Renovationskosten ${session.tax_year}</h1>
        <p style="font-size:14px;color:#6b7280;margin-top:4px">Kanton ${esc(canton.name)} (${esc(canton.abbreviation)}) &middot; Liegenschaft ${propertyAgeLabel(session.property_age).toLowerCase()}</p>
      </div>
      <div style="text-align:right;font-size:14px;color:#4b5563">
        ${session.owner_name ? `<p style="font-weight:500">${esc(session.owner_name)}</p>` : ''}
        ${session.property_address ? `<p>${esc(session.property_address)}</p>` : ''}
      </div>
    </div>
    ${section1}${section2}${section3}
    <div style="border-top:2px solid #d1d5db;padding-top:24px;margin-top:24px">
      <div style="display:flex;justify-content:space-between;max-width:450px">
        <span style="font-size:14px;color:#6b7280">Total Renovationskosten:</span>
        <span style="font-size:14px;font-weight:600">${formatCHF(totalAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;max-width:450px;margin-top:12px">
        <span style="font-size:14px;color:#6b7280">Davon steuerlich abzugsf\u00e4hig (effektiv):</span>
        <span style="font-size:14px;font-weight:600">${formatCHF(deductibleAmount)}</span>
      </div>
      ${pauschalRow}
    </div>
    <div class="print-footer" style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb">
      <p style="font-size:12px;color:#6b7280">Bitte legen Sie die Belege zu den einzelnen Positionen der Steuererkl\u00e4rung bei.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function openPrintWindow(data: PrintData): void {
  const html = buildHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
