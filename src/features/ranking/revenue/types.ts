export interface RevenueRow {
  country: string;
  values: Record<string, number | null>;
}

export interface RevenueDataset {
  filename: string;
  years: string[];
  rows: RevenueRow[];
  importedAt: number;
}

export interface RankedCountry {
  country: string;
  revenue: number;
  rank: number;
}

export interface CountrySummary {
  country: string;
  firstRank: number | null;
  lastRank: number | null;
  movement: number | null;
  lastRevenue: number | null;
}
