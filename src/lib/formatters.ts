export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function propertyAgeLabel(age: 'under_10' | 'over_10'): string {
  return age === 'under_10' ? 'Bis 10 Jahre alt' : 'Über 10 Jahre alt';
}

export function isoToEuropean(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('T')[0].split('-');
  return `${day}.${month}.${year}`;
}

export function europeanToIso(european: string): string {
  if (!european) return '';
  const parts = european.split('.');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function isValidEuropeanDate(european: string): boolean {
  if (!european) return false;
  const parts = european.split('.');
  if (parts.length !== 3) return false;
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return false;
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
    return false;
  }
  const iso = europeanToIso(european);
  const date = new Date(iso);
  return !isNaN(date.getTime());
}
