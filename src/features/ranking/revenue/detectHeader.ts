import { getYear } from './normalize.ts';

export interface WorkbookHeader {
  rowIndex: number;
  countryIndex: number;
  yearCols: { year: string; index: number }[];
}

const COUNTRY_HEADER = /^(?:pays|country|code|code pays|country code|code country)$/i;

/**
 * Locate the real tabular header even if the workbook has titles,
 * merged cells, notes (e.g. "9 mois 2026"), or blank lines above it.
 * Only exact year labels count as columns.
 */
export function detectHeader(grid: unknown[][]): WorkbookHeader | null {
  for (const [rowIndex, row] of grid.entries()) {
    const countryIndex = row.findIndex((cell) => COUNTRY_HEADER.test(String(cell ?? '').trim()));
    if (countryIndex === -1) continue;

    const yearCols = row.flatMap((cell, index) => {
      if (index === countryIndex) return [];
      const year = getYear(cell);
      return year ? [{ year, index }] : [];
    });
    if (yearCols.length >= 2) return { rowIndex, countryIndex, yearCols };
  }
  return null;
}
