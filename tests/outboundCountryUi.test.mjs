import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/features/case-flow/SankeyView.tsx', import.meta.url), 'utf8');

test('sélecteur outbound Tous / Pays de destination', () => {
  assert.match(source, /label=\{mode === 'outbound' \? 'Pays de destination' : 'Pays'\}/);
  assert.match(source, /<MenuItem value="__all__">Tous<\/MenuItem>/);
  assert.match(source, /partnerCountries\(inferred\.transfers, firm, mode\)/);
  assert.match(source, /mode === 'outbound'\s*\? \(countries\.includes\(selectedCountry\) \? selectedCountry : ''\)/);
});
