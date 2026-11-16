import type { RevenueDataset } from './types';

const revenue: Array<[string, number, number, number, number]> = [
  ['BE',125000,148000,172000,195000],['FR',850000,920000,1150000,1320000],
  ['EN',420000,385000,460000,510000],['DE',1250000,1480000,1620000,1890000],
  ['ES',75000,92000,110000,135000],['IT',310000,345000,290000,375000],
  ['NL',580000,625000,710000,805000],['CH',2100000,2350000,2180000,2650000],
  ['LU',45000,58000,72000,95000],['PT',190000,215000,245000,280000],
];

export function makeDemoDataset(): RevenueDataset {
  const years = ['2023', '2024', '2025', '2026'];
  return {
    filename: 'Données de démonstration', years, importedAt: Date.now(),
    rows: revenue.map(([country, ...amounts]) => ({
      country, values: Object.fromEntries(years.map((year, index) => [year, amounts[index]])),
    })),
  };
}
