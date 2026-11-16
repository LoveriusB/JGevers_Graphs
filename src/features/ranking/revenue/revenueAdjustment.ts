/** Annualization factor for the partial 2026 figures (applied to calculations, not stored data). */
export const YEAR_2026_FACTOR = 1.35;

export function adjustedRevenue(year: string, revenue: number | null | undefined): number | null {
  if (revenue === null || revenue === undefined) return null;
  return year === '2026' ? revenue * YEAR_2026_FACTOR : revenue;
}
