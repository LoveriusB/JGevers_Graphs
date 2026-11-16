import { rankCountries } from './rankings.ts';
import type { RankedCountry, RevenueDataset } from './types';

/** A single cohort: select the N leaders in the reference year, then discard every other country. */
export function selectCohort(dataset: RevenueDataset, limit: number, referenceYear: string): string[] {
  if (!dataset.years.includes(referenceYear)) return [];
  const size = Math.max(1, Math.floor(limit));
  // Only retain countries with data in every displayed year, to avoid broken trajectories.
  const eligible = new Set(dataset.rows.filter(({ values }) =>
    dataset.years.every((year) => values[year] !== null && values[year] !== undefined && Number.isFinite(values[year])),
  ).map(({ country }) => country));
  return rankCountries(dataset, referenceYear).filter(({ country }) => eligible.has(country))
    .slice(0, size).map(({ country }) => country);
}

/** Rank exclusively within the SAME cohort for every year; positions are always 1..cohort.length. */
export function getCohortRankings(dataset: RevenueDataset, countries: string[]): Record<string, RankedCountry[]> {
  const allowed = new Set(countries);
  return Object.fromEntries(dataset.years.map((year) => [year,
    rankCountries(dataset, year).filter(({ country }) => allowed.has(country))
      .map((entry, index) => ({ ...entry, rank: index + 1 })),
  ]));
}
