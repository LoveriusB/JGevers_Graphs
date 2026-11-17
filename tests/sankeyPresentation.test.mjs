import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/features/case-flow/CaseFlowChart.tsx', import.meta.url), 'utf8');
test('présentation de type rapport avec trois en-têtes et bloc central de 93px', () => {
  assert.match(source, /CABINET CENTRAL/);
  assert.match(source, /CABINETS DESTINATAIRES/);
  assert.match(source, /93 - node.width/);
});
test('conserve les rubans continus et infobulles juridiction de la v0.17', () => {
  assert.match(source, /RouteRibbons/);
  assert.match(source, /JurisdictionTooltip/);
});

test('les libellés longs sont coupés sur deux lignes', () => {
  assert.match(source, /splitLabelLines/);
  assert.match(source, /MAX_LABEL_LINE_LENGTH = 32/);
  assert.match(source, /secondLine \? <text/);
});

test('survol doux et espace accru sans masquage des trajets', () => {
 const ribbonsSource=readFileSync(new URL('../src/features/case-flow/RouteRibbons.tsx', import.meta.url),'utf8');
 assert.match(ribbonsSource,/active \? 0\.34/);
 assert.doesNotMatch(ribbonsSource,/active===key\?color:'none'/);
 assert.match(source,/nodeSpacing=\{34\}/);
});
