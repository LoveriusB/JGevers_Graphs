import { useCallback } from 'react';
import { createRouteCache } from '../../cache/routeCache.ts';
import { useRouteCache } from '../../cache/useRouteCache.ts';
import { makeCaseFlowDemo } from './sample.ts';
import type { ImportedWorkbookData } from './types.ts';

const caseFlowCache = createRouteCache<ImportedWorkbookData>('/sankey', {
  encode: JSON.stringify,
  decode: (text) => {
    const data = JSON.parse(text) as ImportedWorkbookData | null;
    if (!data || typeof data.filename !== 'string' || !Array.isArray(data.headers) || !Array.isArray(data.rows) || !data.mapping) return null;
    return data;
  },
});

export function useCaseFlowDataset() {
  const { value: dataset, save, clear } = useRouteCache(caseFlowCache);
  const showDemo = useCallback(() => save(makeCaseFlowDemo()), [save]);
  return { dataset, saveDataset: save, clearDataset: clear, showDemo };
}
