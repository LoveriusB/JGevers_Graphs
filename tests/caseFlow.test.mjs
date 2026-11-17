import assert from 'node:assert/strict';
import test from 'node:test';
import { detectMapping } from '../src/features/case-flow/detectMapping.ts';
import { buildCaseFlow, projectRecords, getAvailableCountries, getAvailableRepresentatives } from '../src/features/case-flow/buildCaseFlow.ts';
import { makeCaseFlowDemo } from '../src/features/case-flow/sample.ts';
import { detectHeaderRow } from '../src/features/case-flow/detectHeader.ts';

const demo = makeCaseFlowDemo();
const records = projectRecords(demo, demo.mapping);

test('détecte automatiquement les colonnes de case flow les plus courantes', () => {
  const mapping = detectMapping([
    'Applicant',
    'Applicant Country',
    'Domestic Representative',
    'Domestic Country',
    'International Representative',
    'International Country',
  ]);
  assert.equal(mapping.applicant, 'Applicant');
  assert.equal(mapping.domesticRepresentative, 'Domestic Representative');
  assert.equal(mapping.internationalCountry, 'International Country');
});

test('détecte une vraie ligne d’en-tête malgré un titre au-dessus', () => {
  const grid = [
    ['Outbound case flow – GEVERS', null, null],
    ['Applicant', 'Domestic Representative', 'International Representative'],
    ['Client A', 'GEVERS', 'Cabinet 1'],
  ];
  assert.equal(detectHeaderRow(grid), 1);
});

test('outbound : filtre Gevers + US et construit deux étages de liens', () => {
  const built = buildCaseFlow(records, {
    preset: 'outbound',
    orientation: 'horizontal',
    centralRepresentative: 'GEVERS',
    targetCountry: 'US',
    topLimit: 12,
  });
  assert.equal(built.title, 'Outbound cases GEVERS - US');
  assert.ok(built.summary.totalCases > 0);
  assert.ok(built.data.links.some((link) => link.source === 'GEVERS'));
  assert.ok(built.data.links.some((link) => link.target === 'GEVERS'));
  assert.ok(built.data.nodes.some((node) => node.id === 'LAVERY, DE BILLY, LLP'));
});

test('inbound : ne redistribue pas après Gevers', () => {
  const built = buildCaseFlow(records, {
    preset: 'inbound',
    orientation: 'horizontal',
    centralRepresentative: 'GEVERS',
    targetCountry: 'US',
    topLimit: 12,
  });
  assert.equal(built.summary.rightCount, 0);
  assert.ok(built.data.links.every((link) => link.target === 'GEVERS'));
});

test('expérience pays : l’Australie isole les cas inbound venant de pays étrangers', () => {
  const built = buildCaseFlow(records, {
    preset: 'countryInbound',
    orientation: 'vertical',
    centralRepresentative: 'GEVERS',
    targetCountry: 'AU',
    topLimit: 12,
  });
  assert.equal(built.title, 'Inbound cases to AU firms');
  assert.ok(built.summary.totalCases >= 3);
  assert.ok(built.data.nodes.some((node) => node.id === 'AU'));
  assert.ok(built.data.links.some((link) => link.target === 'AU'));
});

test('les listes de représentants et de pays sont déduites du fichier', () => {
  assert.ok(getAvailableRepresentatives(records).includes('GEVERS'));
  assert.ok(getAvailableCountries(records, 'outbound').includes('US'));
  assert.ok(getAvailableCountries(records, 'countryInbound').includes('AU'));
});
