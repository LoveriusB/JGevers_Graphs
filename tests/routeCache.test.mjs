import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouteCache } from '../src/cache/routeCache.ts';

const codec = { encode: JSON.stringify, decode: JSON.parse };
function mockStorage() {
  const data = new Map();
  globalThis.sessionStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
  return data;
}

test('les routes isolent leurs fichiers, remplacement et suppression inclus', () => {
  mockStorage();
  const ranking = createRouteCache('/ranking', codec);
  const second = createRouteCache('/sankey', codec);
  assert.equal(ranking.read(), null);
  ranking.save({ filename: 'ranking.xlsx' });
  assert.equal(second.read(), null);
  second.save({ filename: 'sankey.xlsx' });
  assert.equal(ranking.read().filename, 'ranking.xlsx');
  ranking.save({ filename: 'ranking2.xlsx' });
  assert.equal(second.read().filename, 'sankey.xlsx');
  ranking.clear();
  assert.equal(ranking.read(), null);
  assert.equal(second.read().filename, 'sankey.xlsx');
  assert.equal(createRouteCache('/ranking', codec).read(), null);
});

test('le classement est restauré depuis le stockage de session après actualisation', () => {
  mockStorage();
  const ranking = createRouteCache('/ranking', codec);
  ranking.save({ filename: 'ranking.xlsx' });
  assert.deepEqual(createRouteCache('/ranking', codec).read(), ranking.read());
  assert.equal(createRouteCache('/sankey', codec).read(), null);
});

test('la mémoire fonctionne même sans sessionStorage ou quand il est plein', () => {
  globalThis.sessionStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  const ranking = createRouteCache('/ranking', codec);
  assert.equal(ranking.read(), null);
  ranking.save({ filename: 'ranking.xlsx' });
  assert.equal(ranking.read().filename, 'ranking.xlsx');
  ranking.clear();
  assert.equal(ranking.read(), null);
});

test('un fichier brut reste en mémoire et notifie les consommateurs de sa route uniquement', () => {
  const storage = mockStorage();
  const ranking = createRouteCache('/ranking', codec);
  const second = createRouteCache('/sankey');
  const file = new File(['test'], 'sankey.xlsx');
  let notifications = 0;
  const unsubscribe = second.subscribe(() => { notifications += 1; });
  ranking.save({ filename: 'ranking.xlsx' });
  assert.equal(notifications, 0);
  second.save(file);
  assert.equal(second.read(), file);
  assert.equal(notifications, 1);
  assert.equal(storage.size, 1);
  unsubscribe();
  second.clear();
  assert.equal(notifications, 1);
  assert.equal(second.read(), null);
});
