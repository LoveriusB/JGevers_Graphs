export type SankeyStage = 'applicant' | 'originFirm' | 'firm' | 'origin' | 'country' | string;

export interface ParsedNodeId {
  stage: SankeyStage;
  label: string;
}

export function parseNodeId(id: string): ParsedNodeId {
  try {
    const [stage, label] = JSON.parse(id) as [string, string];
    return { stage, label };
  } catch {
    return { stage: '', label: id };
  }
}

export function shouldRotateNodeLabel(id: string, layout: 'horizontal' | 'vertical') {
  if (layout !== 'horizontal') return false;
  const { stage } = parseNodeId(id);
  return stage === 'originFirm' || stage === 'country';
}
