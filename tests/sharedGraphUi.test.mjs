import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const sankey = read('../src/features/case-flow/SankeyView.tsx');
const ranking = read('../src/features/ranking/RankingView.tsx');
const importer = read('../src/components/graphs/ExcelImportZone.tsx');
const rankingImporter = read('../src/features/ranking/components/importer/ImportZone.tsx');
const sankeyPage = read('../src/pages/SankeyPage.tsx');

test('ranking et Sankey réutilisent le même en-tête', () => {
  assert.match(sankey, /<GraphPageHeader/);
  assert.match(ranking, /<GraphPageHeader/);
  assert.match(sankeyPage, /features\/ranking\/theme\/theme/);
});

test('même zone d’import avec parseur indépendant pour chaque graphique', () => {
  assert.match(rankingImporter, /<ExcelImportZone[^>]*parseFile=\{parseWorkbook\}/);
  assert.match(sankey, /<ExcelImportZone[^>]*parseFile=\{importPatents\}/);
  assert.match(importer, /onDrop=/);
  assert.match(importer, /isDragging/);
});

test('Sankey horizontal uniquement : aucune commande de vue verticale', () => {
  assert.doesNotMatch(sankey, /setOrientation|Vue verticale|Vue horizontale/);
  assert.match(sankey, /layout="horizontal"/);
  assert.match(sankey, /<ExcelImportZone compact/);
});
