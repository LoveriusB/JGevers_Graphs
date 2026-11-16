import test from 'node:test';
import assert from 'node:assert/strict';
import { countryColor } from '../src/features/ranking/revenue/countryColors.ts';

test('la légende et les courbes utilisent le même référentiel de pays', () => {
  const allCountries = ['BE', 'CH', 'DE', 'ES', 'FR', 'IT', 'NL', 'UK', 'US'];
  const top2026 = ['FR', 'DE', 'UK'];
  const top2023 = ['CH', 'BE', 'ES'];
  for (const cohort of [top2026, top2023]) {
    for (const country of cohort) {
      const chartColor = countryColor(country, allCountries);
      const legendColor = countryColor(country, allCountries);
      assert.equal(legendColor, chartColor);
    }
  }
  assert.notEqual(countryColor('FR', allCountries), countryColor('FR', top2026), 'le sous-ensemble ne doit pas servir de référentiel');
});
