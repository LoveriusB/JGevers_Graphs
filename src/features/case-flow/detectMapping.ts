import type { CaseFlowField, ColumnMapping } from './types.ts';
import { normalizeHeader } from './normalize.ts';

const HEADER_ALIASES: Record<CaseFlowField, string[]> = {
  applicant: [
    'applicant',
    'applicants',
    'client',
    'client name',
    'customer',
    'owner',
  ],
  applicantCountry: [
    'applicant country',
    'country applicant',
    'applicant origin country',
    'applicant nationality',
    'country of applicant',
    'client country',
    'owner country',
  ],
  domesticRepresentative: [
    'domestic representative',
    'domestic rep',
    'local representative',
    'home representative',
    'domestic agent',
    'local agent',
  ],
  domesticCountry: [
    'domestic country',
    'local country',
    'representative country',
    'domestic representative country',
    'country domestic representative',
    'country of domestic representative',
    'country local representative',
  ],
  internationalRepresentative: [
    'international representative',
    'international rep',
    'foreign representative',
    'foreign rep',
    'outside representative',
    'foreign agent',
    'international agent',
    'external representative',
    'agent',
  ],
  internationalCountry: [
    'international country',
    'foreign country',
    'international representative country',
    'country international representative',
    'country of international representative',
    'country foreign representative',
    'foreign representative country',
    'external country',
  ],
};

const EMPTY_MAPPING: ColumnMapping = {
  applicant: null,
  applicantCountry: null,
  domesticRepresentative: null,
  domesticCountry: null,
  internationalRepresentative: null,
  internationalCountry: null,
};

export function createEmptyMapping(): ColumnMapping {
  return { ...EMPTY_MAPPING };
}

export function detectMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map((header) => ({ header, normalized: normalizeHeader(header) }));
  const mapping = createEmptyMapping();

  (Object.keys(HEADER_ALIASES) as CaseFlowField[]).forEach((field) => {
    let best: { score: number; header: string } | null = null;
    for (const candidate of normalized) {
      const score = scoreHeaderMatch(candidate.normalized, HEADER_ALIASES[field]);
      if (score <= 0) continue;
      if (!best || score > best.score) best = { score, header: candidate.header };
    }
    mapping[field] = best?.header ?? null;
  });

  return mapping;
}

function scoreHeaderMatch(header: string, aliases: string[]): number {
  return aliases.reduce((best, alias) => {
    const normalizedAlias = normalizeHeader(alias);
    if (header === normalizedAlias) return Math.max(best, 100);
    if (header.includes(normalizedAlias)) return Math.max(best, 70 + normalizedAlias.length);
    const aliasTokens = normalizedAlias.split(' ');
    const score = aliasTokens.reduce((sum, token) => sum + (header.includes(token) ? 10 : 0), 0);
    return Math.max(best, score);
  }, 0);
}
