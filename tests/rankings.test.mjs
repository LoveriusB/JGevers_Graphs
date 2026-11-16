import assert from 'node:assert/strict';
import test from 'node:test';
import { rankCountries, getCountrySummaries } from '../src/features/ranking/revenue/rankings.ts';
import { parseRevenue, getYear } from '../src/features/ranking/revenue/normalize.ts';
import { makeDemoDataset } from '../src/features/ranking/revenue/sample.ts';

test('LU reste #1 (CA le plus faible) sur toutes les années de la démo', () => {
  const data = makeDemoDataset();
  for (const year of data.years) assert.equal(rankCountries(data, year)[0].country, 'LU');
});

test('ES reste #2; BE est #3; rangs exhaustifs et uniques', () => {
  const data = makeDemoDataset();
  for (const year of data.years) {
    const ranks = rankCountries(data, year);
    assert.equal(ranks[1].country, 'ES');
    assert.equal(ranks[2].country, 'BE');
    assert.deepEqual(ranks.map((r) => r.rank), [1,2,3,4,5,6,7,8,9,10]);
  }
});

test('ex aequo : tri alphabétique stable', () => {
  const data = { years: ['2023', '2024'], filename:'test', importedAt:0,
    rows: [{country:'ZZ',values:{'2023':100,'2024':150}}, {country:'AA',values:{'2023':100,'2024':151}}] };
  assert.deepEqual(rankCountries(data, '2023').map((item) => item.country), ['AA','ZZ']);
});

test('valeurs absentes : non classées et mouvement null si année absente', () => {
  const data = {years:['2023','2024'],filename:'test',importedAt:0,
    rows:[{country:'AA',values:{'2023':10,'2024':null}}, {country:'BB',values:{'2023':20,'2024':30}}]};
  assert.equal(rankCountries(data,'2024').length,1);
  assert.equal(getCountrySummaries(data).find((i) => i.country === 'AA').movement,null);
});

test('normalisation monnaies et entêtes', () => {
  assert.equal(parseRevenue('1 250 000 €'), 1250000);
  assert.equal(parseRevenue('1.250.000,50'), 1250000.5);
  assert.equal(parseRevenue('12,50'), 12.5);
  assert.equal(parseRevenue('foo'), null);
  assert.equal(getYear('CA 2026'), '2026');
  assert.equal(getYear(2024), '2024');
});

import { detectHeader } from '../src/features/ranking/revenue/detectHeader.ts';

test('détecte le véritable en-tête sous les titres et la note « 9 mois 2026 »', () => {
  const grid = [
    [null, null, null, null, null],
    [null, null, null, null, '9 mois 2026'],
    ['Country', 2023, 2024, 2025, 2026],
    ['FR', 100, 200, 300, 400],
  ];
  assert.deepEqual(detectHeader(grid), {
    rowIndex: 2,
    countryIndex: 0,
    yearCols: [
      { year: '2023', index: 1 },
      { year: '2024', index: 2 },
      { year: '2025', index: 3 },
      { year: '2026', index: 4 },
    ],
  });
});

test('ignore les cellules qui mentionnent une année sans être un en-tête', () => {
  assert.equal(detectHeader([[null, null, '9 mois 2026'], ['Autre', 2023, 2024]]), null);
});

import { buildRankingChartSeries, findRankingChartPoint } from '../src/features/ranking/revenue/chartSeries.ts';
import { selectCohort, getCohortRankings } from '../src/features/ranking/revenue/topRanks.ts';

const rankingFixture = { years: ['2023', '2024', '2025', '2026'], filename: 'test', importedAt: 0,
  rows: Array.from({ length: 60 }, (_, i) => ({ country: `C${String(i).padStart(2, '0')}`, values: {
    '2023': i * 25,
    '2024': (59 - i) * 12,
    '2025': (i % 2 ? i : 59 - i) * 18,
    '2026': i * 100,
  }})),
};

test('sélection fixe : seuls les 15 meilleurs de 2026 entrent dans le calcul', () => {
  const selected = selectCohort(rankingFixture, 15, '2026');
  assert.equal(selected.length, 15);
  assert.deepEqual(selected, Array.from({ length: 15 }, (_, i) => `C${String(i).padStart(2, '0')}`));
  const ranks = getCohortRankings(rankingFixture, selected);
  for (const year of rankingFixture.years) {
    assert.equal(ranks[year].length, 15);
    assert.deepEqual(ranks[year].map(({ rank }) => rank), Array.from({ length: 15 }, (_, i) => i + 1));
    assert.deepEqual(new Set(ranks[year].map(({ country }) => country)), new Set(selected));
  }
  assert.equal(ranks['2024'][0].country, 'C14'); // Among the selected 15, C14 has the lowest amount in 2024.
  assert.equal(ranks['2024'][0].rank, 1); // Not its original global rank 15.
});

test('les 15 courbes sont continues et ne sortent jamais de 1..15', () => {
  const series = buildRankingChartSeries(rankingFixture, 15, '2026');
  assert.equal(series.length, 15);
  for (const country of series) {
    assert.equal(country.data.length, 4);
    assert.ok(country.data.every(({ y }) => Number.isInteger(y) && y >= 1 && y <= 15));
  }
  for (const year of rankingFixture.years) {
    assert.deepEqual(series.map(({ data }) => data.find(({ x }) => x === year).y).sort((a, b) => a - b),
      Array.from({ length: 15 }, (_, i) => i + 1));
  }
});

test('un changement d’année de référence change la sélection mais pas le nombre de pays', () => {
  const selected = selectCohort(rankingFixture, 10, '2024');
  assert.equal(selected.length, 10);
  assert.equal(selected[0], 'C59');
  const series = buildRankingChartSeries(rankingFixture, 10, '2024');
  assert.equal(series.length, 10);
  for (const year of rankingFixture.years) {
    assert.deepEqual(series.map(({ data }) => data.find(({ x }) => x === year).y).sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
  }
});

test('les pays avec valeurs manquantes sont exclus du groupe, sans lacunes sur le graphe', () => {
  const data = { years: ['2023','2024'], filename:'test', importedAt:0, rows: [
    { country: 'AA', values: { '2023': 100, '2024': 300 } },
    { country: 'BB', values: { '2023': null, '2024': 500 } },
    { country: 'CC', values: { '2023': 200, '2024': 100 } },
  ] };
  const series = buildRankingChartSeries(data, 2, '2024');
  assert.deepEqual(series.map(({ id }) => id), ['CC', 'AA']);
  assert.deepEqual(series.map(({ data }) => data.map(({ y }) => y)), [[2,1],[1,2]]);
});

test('tooltip : retrouve le pays depuis année + rang sans dépendre de serieId Nivo', () => {
  const series = buildRankingChartSeries(rankingFixture, 15, '2026');
  for (const year of rankingFixture.years) {
    for (let rank = 1; rank <= 15; rank++) {
      const match = findRankingChartPoint(series, year, rank);
      assert.ok(match);
      assert.equal(match.point.x, year);
      assert.equal(match.point.y, rank);
      assert.match(match.country, /^C\d{2}$/);
      assert.equal(typeof match.point.revenue, 'number');
    }
  }
  assert.equal(findRankingChartPoint(series, '2023', 16), null);
});


test('classements négatifs : le montant le plus négatif est premier et chaque rang est occupé', () => {
  const data = {years: ['2023', '2024'], filename: 'negatifs', importedAt: 0, rows: [
    { country: 'FR', values: { '2023': -100, '2024': -500 } },
    { country: 'BE', values: { '2023': -900, '2024': -20 } },
    { country: 'CH', values: { '2023': -200, '2024': -1000 } },
    { country: 'DE', values: { '2023': 100, '2024': 900 } },
  ]};
  assert.deepEqual(rankCountries(data, '2023').map(({country}) => country), ['BE', 'CH', 'FR', 'DE']);
  assert.deepEqual(rankCountries(data, '2024').map(({country}) => country), ['CH', 'FR', 'BE', 'DE']);
  const cohort = selectCohort(data, 3, '2024');
  assert.deepEqual(cohort, ['CH', 'FR', 'BE']);
  const ranked = getCohortRankings(data, cohort);
  for (const year of data.years) assert.deepEqual(ranked[year].map(({rank}) => rank), [1,2,3]);
  assert.deepEqual(ranked['2023'].map(({country}) => country), ['BE','CH','FR']);
});

test('les montants positifs et négatifs sont lus sans modifier leur signe', () => {
  assert.equal(parseRevenue('-192 €'), -192);
  assert.equal(parseRevenue('-1 250,50 €'), -1250.5);
  assert.equal(parseRevenue(0), 0);
});


test('changements successifs 2026 → 2023 → 2026 : chaque rang est unique, sans positions manquantes', () => {
  const selectedYears = ['2026', '2023', '2026', '2024', '2023', '2026'];
  for (const referenceYear of selectedYears) {
    const series = buildRankingChartSeries(rankingFixture, 10, referenceYear);
    assert.equal(series.length, 10);
    for (const year of rankingFixture.years) {
      const ranks = series.map(({ data }) => data.find(({ x }) => x === year)?.y);
      assert.deepEqual([...ranks].sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
      for (let rank = 1; rank <= 10; rank++) {
        const match = findRankingChartPoint(series, year, rank);
        assert.ok(match, `Rang ${rank} absent en ${year} avec référence ${referenceYear}`);
      }
    }
  }
});


test('2026 : coefficient 1,35 appliqué au classement et au tooltip une seule fois', () => {
  const data = { years: ['2025', '2026'], filename: 'fixture', importedAt: 1, rows: [
    { country: 'AA', values: { '2025': -100, '2026': -200 } },
    { country: 'BB', values: { '2025': -150, '2026': -100 } },
    { country: 'CC', values: { '2025': 25, '2026': 0 } },
  ] };
  const originalValue = data.rows[0].values['2026'];
  const ranks = rankCountries(data, '2026');
  assert.deepEqual(ranks.map(({ country, revenue }) => [country, revenue]), [
    ['AA', -270], ['BB', -135], ['CC', 0],
  ]);
  assert.deepEqual(rankCountries(data, '2025').map(({ revenue }) => revenue), [-150, -100, 25]);
  const cohort = selectCohort(data, 2, '2026');
  const points = buildRankingChartSeries(data, 2, '2026');
  assert.deepEqual(cohort, ['AA', 'BB']);
  assert.equal(findRankingChartPoint(points, '2026', 1)?.point.revenue, -270);
  assert.equal(findRankingChartPoint(points, '2025', 1)?.point.revenue, -150);
  assert.equal(data.rows[0].values['2026'], originalValue);
  assert.equal(rankCountries(data, '2026')[0].revenue, -270);
});

test('2026 : valeurs manquantes restent absentes après ajustement', () => {
  const data = { years: ['2026'], filename: 'fixture', importedAt: 2, rows: [
    { country: 'AA', values: { '2026': null } },
    { country: 'BB', values: { '2026': -10 } },
  ] };
  assert.deepEqual(rankCountries(data, '2026').map(({ country, revenue }) => [country, revenue]), [['BB', -13.5]]);
});
