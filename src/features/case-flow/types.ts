export type RawWorkbookRow = Record<string, string>;

export type CaseFlowField =
  | 'applicant'
  | 'applicantCountry'
  | 'domesticRepresentative'
  | 'domesticCountry'
  | 'internationalRepresentative'
  | 'internationalCountry';

export interface ColumnMapping {
  applicant: string | null;
  applicantCountry: string | null;
  domesticRepresentative: string | null;
  domesticCountry: string | null;
  internationalRepresentative: string | null;
  internationalCountry: string | null;
}

export interface ImportedWorkbookData {
  filename: string;
  importedAt: number;
  headers: string[];
  rows: RawWorkbookRow[];
  mapping: ColumnMapping;
}

export interface CaseRecord {
  applicant: string | null;
  applicantCountry: string | null;
  domesticRepresentative: string | null;
  domesticCountry: string | null;
  internationalRepresentative: string | null;
  internationalCountry: string | null;
}

export type SankeyPreset = 'outbound' | 'inbound' | 'countryInbound';
export type SankeyOrientation = 'horizontal' | 'vertical';

export interface SankeyControls {
  preset: SankeyPreset;
  orientation: SankeyOrientation;
  centralRepresentative: string;
  targetCountry: string;
  topLimit: number;
}

export interface SankeyNode {
  id: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface FlowSummary {
  totalCases: number;
  leftCount: number;
  middleCount: number;
  rightCount: number;
}

export interface BuiltCaseFlow {
  title: string;
  subtitle: string;
  data: SankeyChartData;
  summary: FlowSummary;
}
