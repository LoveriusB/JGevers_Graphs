import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { countryColor } from '../../revenue/countryColors';

interface Props { countries: string[]; allCountries: string[]; selectedCountries: string[]; onChange: (countries: string[]) => void; }
export function CountryLegend({ countries, allCountries, selectedCountries, onChange }: Props) {
  const allSelected = selectedCountries.length === countries.length;
  return <Stack spacing={1.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
      <Typography variant="body2" fontWeight={750}>Pays affichés <Typography component="span" variant="body2" color="text.secondary">({selectedCountries.length}/{countries.length})</Typography></Typography>
      <Button size="small" variant="text" onClick={() => onChange(allSelected ? [] : countries)}>{allSelected ? 'Tout atténuer' : 'Tout afficher'}</Button>
    </Stack>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {countries.map((country) => <Chip key={country} clickable onClick={() => onChange(selectedCountries.includes(country) ? selectedCountries.filter((current) => current !== country) : [...selectedCountries, country])}
        label={country} variant={selectedCountries.includes(country) ? 'filled' : 'outlined'}
        icon={<Box sx={{ width: '9px !important', height: 9, borderRadius: '50%', bgcolor: countryColor(country, allCountries) }} />}
        sx={{ px: 0.5, bgcolor: selectedCountries.includes(country) ? '#f4f6fc' : 'transparent', border: '1px solid #e8ebf2', opacity: selectedCountries.includes(country) ? 1 : 0.58 }} />)}
    </Box>
  </Stack>;
}
