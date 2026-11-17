import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('le conteneur du Sankey laisse les infobulles Nivo dépasser des bords', () => {
  const source = readFileSync(new URL('../src/features/case-flow/CaseFlowChart.tsx', import.meta.url), 'utf8');
  assert.match(source, /overflow: 'visible', position: 'relative', zIndex: 1/);
  assert.doesNotMatch(source, /overflow: 'auto'/);
});


test("les rubans ne déclenchent pas de tooltip SVG natif en plus de Nivo", () => {
  const ribbons = readFileSync(new URL("../src/features/case-flow/RouteRibbons.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(ribbons, /<title>/);
  assert.match(ribbons, /showTooltipFromEvent/);
  assert.match(ribbons, /aria-label=\{description\}/);
});
