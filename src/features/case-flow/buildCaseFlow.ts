import { cleanCell, normalizeCountry, uniqueSorted } from './normalize.ts';
import type { BuiltCaseFlow, CaseRecord, ColumnMapping, ImportedWorkbookData, SankeyChartData, SankeyControls, SankeyPreset } from './types.ts';

const LEFT_OTHER = 'Autres appliquants';
const RIGHT_OTHER = 'Autres cabinets';
const SOURCE_COUNTRY_OTHER = 'Autres pays';

export function projectRecords(data: ImportedWorkbookData, mapping: ColumnMapping = data.mapping): CaseRecord[] {
  return data.rows.map((row) => ({
    applicant: readMappedValue(row, mapping.applicant),
    applicantCountry: normalizeCountry(readMappedValue(row, mapping.applicantCountry)),
    domesticRepresentative: readMappedValue(row, mapping.domesticRepresentative),
    domesticCountry: normalizeCountry(readMappedValue(row, mapping.domesticCountry)),
    internationalRepresentative: readMappedValue(row, mapping.internationalRepresentative),
    internationalCountry: normalizeCountry(readMappedValue(row, mapping.internationalCountry)),
  }));
}

function readMappedValue(row: Record<string, string>, header: string | null): string | null {
  if (!header) return null;
  const value = cleanCell(row[header]);
  return value || null;
}

export function getAvailableRepresentatives(records: CaseRecord[]): string[] {
  return uniqueSorted(records.map((record) => record.domesticRepresentative));
}

export function getAvailableCountries(records: CaseRecord[], preset: SankeyPreset): string[] {
  if (preset === 'countryInbound') {
    return uniqueSorted(records.map((record) => record.domesticCountry));
  }
  return uniqueSorted(records.map((record) => record.internationalCountry));
}

export function buildCaseFlow(records: CaseRecord[], controls: SankeyControls): BuiltCaseFlow {
  const filtered = filterRecords(records, controls);
  if (controls.preset === 'outbound') {
    return buildThreeStageFlow(filtered, controls);
  }
  if (controls.preset === 'countryInbound') {
    return buildCountryInboundFlow(filtered, controls);
  }
  return buildInboundFlow(filtered, controls);
}

function filterRecords(records: CaseRecord[], controls: SankeyControls): CaseRecord[] {
  if (controls.preset === 'outbound') {
    return records.filter((record) =>
      record.applicant &&
      record.domesticRepresentative === controls.centralRepresentative &&
      record.internationalRepresentative &&
      record.internationalCountry === controls.targetCountry,
    );
  }
  if (controls.preset === 'inbound') {
    return records.filter((record) =>
      record.internationalRepresentative &&
      record.domesticRepresentative === controls.centralRepresentative &&
      (!controls.targetCountry || record.internationalCountry === controls.targetCountry),
    );
  }
  return records.filter((record) =>
    record.applicantCountry &&
    record.domesticCountry === controls.targetCountry &&
    record.applicantCountry !== controls.targetCountry &&
    record.domesticRepresentative,
  );
}

function buildThreeStageFlow(records: CaseRecord[], controls: SankeyControls): BuiltCaseFlow {
  const applicantSet = limitValues(records.map((record) => record.applicant), controls.topLimit);
  const representativeSet = limitValues(records.map((record) => record.internationalRepresentative), controls.topLimit);
  const links = new Map<string, number>();

  records.forEach((record) => {
    const applicant = projectLimited(record.applicant, applicantSet, LEFT_OTHER);
    const domestic = record.domesticRepresentative!;
    const internationalRep = projectLimited(record.internationalRepresentative, representativeSet, RIGHT_OTHER);
    addLink(links, applicant, domestic, 1);
    addLink(links, domestic, internationalRep, 1);
  });

  const data = mapToSankeyData(links);
  return {
    title: `Outbound cases ${controls.centralRepresentative} - ${controls.targetCountry}`,
    subtitle: 'Appliquants → représentant local → cabinet international',
    data,
    summary: {
      totalCases: records.length,
      leftCount: uniqueCount(records.map((record) => projectLimited(record.applicant, applicantSet, LEFT_OTHER))),
      middleCount: uniqueCount(records.map((record) => record.domesticRepresentative)),
      rightCount: uniqueCount(records.map((record) => projectLimited(record.internationalRepresentative, representativeSet, RIGHT_OTHER))),
    },
  };
}

function buildInboundFlow(records: CaseRecord[], controls: SankeyControls): BuiltCaseFlow {
  const internationalSet = limitValues(records.map((record) => record.internationalRepresentative), controls.topLimit);
  const links = new Map<string, number>();

  records.forEach((record) => {
    const internationalRep = projectLimited(record.internationalRepresentative, internationalSet, RIGHT_OTHER);
    const domestic = record.domesticRepresentative!;
    addLink(links, internationalRep, domestic, 1);
  });

  const data = mapToSankeyData(links);
  return {
    title: `Inbound cases ${controls.centralRepresentative} ← ${controls.targetCountry}`,
    subtitle: 'Cabinets internationaux → représentant local',
    data,
    summary: {
      totalCases: records.length,
      leftCount: uniqueCount(records.map((record) => projectLimited(record.internationalRepresentative, internationalSet, RIGHT_OTHER))),
      middleCount: uniqueCount(records.map((record) => record.domesticRepresentative)),
      rightCount: 0,
    },
  };
}

function buildCountryInboundFlow(records: CaseRecord[], controls: SankeyControls): BuiltCaseFlow {
  const countrySet = limitValues(records.map((record) => record.applicantCountry), controls.topLimit);
  const representativeSet = limitValues(records.map((record) => record.domesticRepresentative), controls.topLimit);
  const links = new Map<string, number>();
  const middleNode = controls.targetCountry;

  records.forEach((record) => {
    const sourceCountry = projectLimited(record.applicantCountry, countrySet, SOURCE_COUNTRY_OTHER);
    const domesticRepresentative = projectLimited(record.domesticRepresentative, representativeSet, RIGHT_OTHER);
    addLink(links, sourceCountry, middleNode, 1);
    addLink(links, middleNode, domesticRepresentative, 1);
  });

  const data = mapToSankeyData(links);
  return {
    title: `Inbound cases to ${controls.targetCountry} firms`,
    subtitle: 'Pays de l’appliquant → pays cible → cabinet local',
    data,
    summary: {
      totalCases: records.length,
      leftCount: uniqueCount(records.map((record) => projectLimited(record.applicantCountry, countrySet, SOURCE_COUNTRY_OTHER))),
      middleCount: 1,
      rightCount: uniqueCount(records.map((record) => projectLimited(record.domesticRepresentative, representativeSet, RIGHT_OTHER))),
    },
  };
}

function limitValues(values: Array<string | null>, topLimit: number): Set<string> {
  const totals = new Map<string, number>();
  values.forEach((value) => {
    if (!value) return;
    totals.set(value, (totals.get(value) ?? 0) + 1);
  });
  return new Set([...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en', { sensitivity: 'base' })).slice(0, Math.max(1, topLimit)).map(([value]) => value));
}

function projectLimited(value: string | null, allowed: Set<string>, otherLabel: string): string {
  if (!value) return otherLabel;
  return allowed.has(value) ? value : otherLabel;
}

function addLink(target: Map<string, number>, source: string, destination: string, value: number) {
  const key = `${source}→${destination}`;
  target.set(key, (target.get(key) ?? 0) + value);
}

function mapToSankeyData(linkMap: Map<string, number>): SankeyChartData {
  const links = [...linkMap.entries()].map(([key, value]) => {
    const [source, target] = key.split('→');
    return { source, target, value };
  }).filter((link) => link.source && link.target && link.value > 0);
  const nodeIds = new Set<string>();
  links.forEach((link) => {
    nodeIds.add(link.source);
    nodeIds.add(link.target);
  });
  return {
    nodes: [...nodeIds].map((id) => ({ id })),
    links,
  };
}

function uniqueCount(values: Array<string | null>): number {
  return new Set(values.filter((value): value is string => Boolean(value))).size;
}
