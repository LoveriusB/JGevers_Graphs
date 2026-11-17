import test from 'node:test';
import assert from 'node:assert/strict';
import { inferTransfers, makeFlow, demoPatentDataset } from '../src/features/case-flow/patentFlow.ts';

test('outbound route aggregates jurisdictions without losing route continuity', () => {
  const { records } = demoPatentDataset();
  const flow = makeFlow(records, inferTransfers(records).transfers, 'outbound', 'gevers', '');
  assert.equal(flow.routes.reduce((sum, route) => sum + route.value, 0), flow.total);
  assert.ok(flow.routes.some(route => route.jurisdictions.US > 0));
  assert.ok(flow.routes.some(route => route.jurisdictions.AU > 0));
  for (const route of flow.routes) assert.equal(Object.values(route.jurisdictions).reduce((a,b)=>a+b,0), route.value);
  for (const link of flow.data.links) assert.equal(Object.values(link.jurisdictions).reduce((a,b)=>a+b,0), link.value);
});

test('inbound tooltip jurisdictions come from observed destination applications', () => {
  const { records } = demoPatentDataset();
  const flow = makeFlow(records, [], 'inbound', 'gevers', 'US');
  assert.ok(flow.total > 0);
  for (const link of flow.data.links) {
    assert.equal(link.jurisdictions.EP, link.value);
  }
});

test('a single route can contain several jurisdictions with correct totals', () => {
  const { records } = demoPatentDataset();
  const augmented = [...records];
  // Another filing for the same applicant and destination firm, but in a new territory.
  augmented.push({ ...records[0], family: 'F_EXTRA', application: 'F_EXTRA-EP' });
  augmented.push({ ...records[1], family: 'F_EXTRA', application: 'F_EXTRA-IL', jurisdiction: 'IL' });
  const flow = makeFlow(augmented, inferTransfers(augmented).transfers, 'outbound', 'gevers', '');
  const multi = flow.routes.find(route => Object.keys(route.jurisdictions).length > 1);
  assert.ok(multi, 'An aggregated path should carry several destination jurisdictions');
  assert.equal(Object.values(multi.jurisdictions).reduce((a, b) => a + b, 0), multi.value);
});
