import { normalizePatentName } from './normalize.ts';
import type { Patent } from './patentFlow.ts';

/** An inbound filing is observed in the destination firm's territory for a foreign applicant.
 * A same-family originating firm is helpful, but is NOT required to count the filing.
 */
export interface InboundCase {
  representative: string;
  applicantCountry: string;
  originFirm: string;
  jurisdiction: string;
  application: string;
}

export const UNKNOWN_ORIGIN = 'Cabinet d’origine non identifié';

const european = new Set('AL AT BE BG CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC ME MK MT NL NO PL PT RO RS SE SI SK SM TR'.split(' '));

function isInDestinationTerritory(p: Patent): boolean {
  if (!p.jurisdiction || p.jurisdiction === 'WO' || !p.representative) return false;
  if (!p.representativeCountry) return true; // Missing country: filing jurisdiction is our only proxy.
  return p.jurisdiction === p.representativeCountry || (p.jurisdiction === 'EP' && european.has(p.representativeCountry));
}

function isForeignApplicant(p: Patent): boolean {
  if (!p.applicantCountry || !p.jurisdiction) return false;
  if (p.jurisdiction === 'EP') return !european.has(p.applicantCountry);
  if (p.representativeCountry) return p.applicantCountry !== p.representativeCountry;
  return p.applicantCountry !== p.jurisdiction;
}

export function inferInboundCases(records: Patent[]): InboundCase[] {
  const families = new Map<string, Patent[]>();
  for (const p of records) {
    if (!p.family) continue;
    const group = families.get(p.family) ?? [];
    group.push(p);
    families.set(p.family, group);
  }

  const seen = new Set<string>();
  const result: InboundCase[] = [];
  for (const p of records) {
    if (!p.application || !isInDestinationTerritory(p) || !isForeignApplicant(p)) continue;
    const key = JSON.stringify([p.jurisdiction, p.application, normalizePatentName(p.representative)]);
    if (seen.has(key)) continue;
    seen.add(key);

    // Only identify an originating firm if another filing of the SAME family
    // explicitly supports it in the applicant's country.
    const related = (families.get(p.family) ?? []).filter(source =>
      source !== p && source.representative &&
      normalizePatentName(source.representative) !== normalizePatentName(p.representative) &&
      source.jurisdiction === p.applicantCountry &&
      (!source.representativeCountry || source.representativeCountry === p.applicantCountry),
    );
    const firms = [...new Set(related.map(source => normalizePatentName(source.representative)))];
    result.push({
      representative: normalizePatentName(p.representative),
      applicantCountry: p.applicantCountry,
      originFirm: firms.length === 1 ? firms[0] : UNKNOWN_ORIGIN,
      jurisdiction: p.jurisdiction,
      application: p.application,
    });
  }
  return result;
}

export function inboundCountries(cases: InboundCase[], firm: string): string[] {
  const normalizedFirm = normalizePatentName(firm);
  return [...new Set(cases.filter(item => item.representative === normalizedFirm).map(item => item.applicantCountry))]
    .sort((a, b) => a.localeCompare(b));
}
