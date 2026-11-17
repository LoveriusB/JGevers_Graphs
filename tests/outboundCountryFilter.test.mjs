import test from 'node:test';
import assert from 'node:assert/strict';
import { demoPatentDataset, inferTransfers, makeFlow, partnerCountries } from '../src/features/case-flow/patentFlow.ts';

const { records } = demoPatentDataset();
const { transfers } = inferTransfers(records);

test('outbound propose toutes les juridictions de destination du cabinet', () => {
  assert.deepEqual(partnerCountries(transfers, 'gevers', 'outbound'), ['AU', 'US']);
});

test('outbound: tous les pays par défaut, US filtre uniquement les dépôts US', () => {
  const all = makeFlow(records, transfers, 'outbound', 'gevers', '');
  const us = makeFlow(records, transfers, 'outbound', 'gevers', 'US');
  const au = makeFlow(records, transfers, 'outbound', 'gevers', 'AU');
  assert.equal(all.total, us.total + au.total);
  assert.ok(us.total > 0 && au.total > 0);
  assert.ok(us.routes.every(route => Object.keys(route.jurisdictions).every(value => value === 'US')));
  assert.ok(au.routes.every(route => Object.keys(route.jurisdictions).every(value => value === 'AU')));
  assert.equal(us.routes.reduce((sum, route) => sum + route.value, 0), us.total);
});

test('le filtre outbound ne modifie pas les calculs inbound', () => {
  const inbound = makeFlow(records, transfers, 'inbound', 'gevers', 'US');
  assert.equal(inbound.total, 12);
});
