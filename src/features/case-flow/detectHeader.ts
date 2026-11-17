import { cleanCell, normalizeHeader } from './normalize.ts';

export function detectHeaderRow(grid: unknown[][]): number | null {
  const scored = grid
    .map((row, index) => ({ index, score: scoreHeaderRow(row ?? []), nonEmpty: (row ?? []).filter((cell) => cleanCell(cell) !== '').length }))
    .filter((candidate) => candidate.nonEmpty >= 3);

  const best = scored.find((candidate) => candidate.score >= 2);
  if (best) return best.index;

  return scored[0]?.index ?? null;
}

function scoreHeaderRow(row: unknown[]): number {
  return row.reduce((score, cell) => {
    const header = normalizeHeader(cleanCell(cell));
    if (!header) return score;
    if (['applicant', 'client', 'country', 'representative', 'agent'].some((token) => header.includes(token))) {
      return score + 1;
    }
    return score;
  }, 0);
}
