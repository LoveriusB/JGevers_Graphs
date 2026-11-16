const PALETTE = ['#5367de','#27a6a1','#e19b49','#d36b9a','#7e70d6','#5f92ca','#b7a548','#d87364','#5d9d6c','#a17ac0','#4f9fc1','#9c7a58'];
export function countryColor(country: string, allCountries: string[]): string {
  const index = [...allCountries].sort().indexOf(country);
  return PALETTE[index % PALETTE.length];
}

