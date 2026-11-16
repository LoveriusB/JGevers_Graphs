const spaces = /[\s\u00a0\u202f]/g;

/** Accept numbers as Excel numerics and common French/English currency strings. */
export function parseRevenue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const raw = value.replace(/[€$£]/g, '').replace(spaces, '').trim();
  if (!raw) return null;
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  let normalized = raw;
  if (lastComma > lastDot) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma >= 0) {
    normalized = raw.replace(/,/g, '');
  } else if (lastComma >= 0) {
    const fraction = raw.length - lastComma - 1;
    normalized = fraction === 3 ? raw.replace(/,/g, '') : raw.replace(',', '.');
  } else if (lastDot >= 0 && raw.length - lastDot - 1 === 3) {
    normalized = raw.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getYear(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const label = String(value).trim();
  const match = label.match(/^(?:CA\s*)?(20\d{2})(?:\s*\(€\))?$/i);
  return match?.[1] ?? null;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount);
}
