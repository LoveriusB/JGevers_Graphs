import type { CountrySummary, RankedCountry, RevenueDataset } from './types';
import { adjustedRevenue } from './revenueAdjustment.ts';

/** Lower revenue (including more negative values) ranks first; missing values are unranked; ties are broken alphabetically for stable, unique ranks. */
export function rankCountries(dataset: RevenueDataset, year: string): RankedCountry[] {
  return dataset.rows
    .flatMap(({ country, values }) => {
      const revenue = adjustedRevenue(year, values[year]);
      return revenue === null || revenue === undefined ? [] : [{ country, revenue }];
    })
    .sort((a, b) => a.revenue - b.revenue || a.country.localeCompare(b.country))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function getRankings(dataset: RevenueDataset): Record<string, RankedCountry[]> {
  return Object.fromEntries(dataset.years.map((year) => [year, rankCountries(dataset, year)]));
}

export function getCountrySummaries(dataset: RevenueDataset): CountrySummary[] {
  const rankings = getRankings(dataset);
  const first = dataset.years[0];
  const last = dataset.years[dataset.years.length - 1];
  return dataset.rows.map(({ country }) => {
    const firstRank = rankings[first]?.find((item) => item.country === country)?.rank ?? null;
    const finalEntry = rankings[last]?.find((item) => item.country === country);
    const lastRank = finalEntry?.rank ?? null;
    return { country, firstRank, lastRank,
      movement: firstRank !== null && lastRank !== null ? firstRank - lastRank : null,
      lastRevenue: finalEntry?.revenue ?? null,
    };
  }).sort((a, b) => (a.lastRank ?? Infinity) - (b.lastRank ?? Infinity));
}
