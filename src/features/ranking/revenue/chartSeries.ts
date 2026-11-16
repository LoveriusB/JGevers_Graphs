import { getCohortRankings, selectCohort } from './topRanks.ts';
import type { RevenueDataset } from './types';

export interface RankingChartPoint {
  x: string;
  y: number;
  revenue: number;
}

export interface RankingChartSeries {
  id: string;
  data: RankingChartPoint[];
}

/** Chart trajectories for a FIXED cohort, with rank recalculated within that cohort each year. */
export function buildRankingChartSeries(
  dataset: RevenueDataset,
  limit = dataset.rows.length,
  referenceYear = dataset.years[dataset.years.length - 1],
): RankingChartSeries[] {
  const cohort = selectCohort(dataset, limit, referenceYear);
  const rankings = getCohortRankings(dataset, cohort);
  const lookups = Object.fromEntries(dataset.years.map((year) => [
    year, new Map(rankings[year].map(({ country, rank, revenue }) => [country, { rank, revenue }])),
  ]));
  return cohort.map((country) => ({
    id: country,
    data: dataset.years.map((year) => {
      const { rank, revenue } = lookups[year].get(country)!;
      return { x: year, y: rank, revenue };
    }),
  }));
}

/**
 * Nivo's point metadata differs across versions (`serieId` vs `seriesId`).
 * A cohort has exactly one country per (year, rank), so these coordinates
 * identify the country reliably without depending on Nivo internals.
 */
export function findRankingChartPoint(
  series: RankingChartSeries[],
  year: string | number,
  rank: string | number,
): { country: string; point: RankingChartPoint } | null {
  const numericRank = Number(rank);
  if (!Number.isFinite(numericRank)) return null;
  for (const countrySeries of series) {
    const point = countrySeries.data.find((entry) => entry.x === String(year) && entry.y === numericRank);
    if (point) return { country: countrySeries.id, point };
  }
  return null;
}
