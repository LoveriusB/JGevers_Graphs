import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/features/case-flow/SankeyView.tsx', import.meta.url), 'utf8');
test('affiche Tous comme sélection par défaut sans changer le filtre métier vide', () => {
  assert.match(source, /target \|\| '__all__'/);
  assert.match(source, /MenuItem value="__all__">Tous<\/MenuItem>/);
  assert.match(source, /event.target.value === '__all__' \? '' : event.target.value/);
});
