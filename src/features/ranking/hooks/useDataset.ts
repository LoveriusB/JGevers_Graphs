import { useCallback } from 'react';
import { createRouteCache } from '../../../cache/routeCache';
import { useRouteCache } from '../../../cache/useRouteCache';
import { makeDemoDataset } from '../revenue/sample';
import type { RevenueDataset } from '../revenue/types';

const rankingCache = createRouteCache<RevenueDataset>('/ranking', {
  encode: JSON.stringify,
  decode: (text) => {
    const data = JSON.parse(text) as RevenueDataset | null;
    if (!data || !Array.isArray(data.years) || !Array.isArray(data.rows) || typeof data.filename !== 'string') return null;
    return data;
  },
});

export function useDataset() {
  const { value: dataset, save: saveDataset, clear: clearDataset } = useRouteCache(rankingCache);
  const showDemo = useCallback(() => saveDataset(makeDemoDataset()), [saveDataset]);
  return { dataset, saveDataset, clearDataset, showDemo };
}
