import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chart = readFileSync(new URL('../src/features/case-flow/CaseFlowChart.tsx', import.meta.url), 'utf8');
const view = readFileSync(new URL('../src/features/case-flow/SankeyView.tsx', import.meta.url), 'utf8');

test('le pays choisi remplace seulement le libellé visuel central pour l’Outbound', () => {
  assert.match(view, /selectedCountry=\{mode === 'outbound' \? target : undefined\}/);
  assert.match(chart, /centerLabel=\{mode === 'outbound' \? selectedCountry : undefined\}/);
  assert.match(chart, /\{centerLabel \|\| displayName\(label\)\}/);
  assert.match(chart, /labels\.get\(node\.id\)/); // tooltip retains underlying firm
  assert.match(chart, /routes=\{routes\}/); // route paths unchanged
});
