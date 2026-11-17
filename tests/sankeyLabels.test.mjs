import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNodeId, shouldRotateNodeLabel } from '../src/features/case-flow/sankeyLabels.ts';

test('le noeud central outbound est détecté pour rotation verticale', () => {
  assert.deepEqual(parseNodeId(JSON.stringify(['originFirm', 'gevers'])), { stage: 'originFirm', label: 'gevers' });
  assert.equal(shouldRotateNodeLabel(JSON.stringify(['originFirm', 'gevers']), 'horizontal'), true);
  assert.equal(shouldRotateNodeLabel(JSON.stringify(['country', 'US']), 'horizontal'), true);
  assert.equal(shouldRotateNodeLabel(JSON.stringify(['firm', 'cabinet a']), 'horizontal'), false);
  assert.equal(shouldRotateNodeLabel(JSON.stringify(['originFirm', 'gevers']), 'vertical'), false);
});
