import { Box, Divider, Paper, Stack, Typography } from '@mui/material';

export interface JurisdictionSummary {
  jurisdictions: Record<string, number>;
  value: number;
}

export function jurisdictionEntries(jurisdictions: Record<string, number>): [string, number][] {
  return Object.entries(jurisdictions)
    .filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort(([countryA, countA], [countryB, countB]) => countB - countA || countryA.localeCompare(countryB));
}

export function JurisdictionTooltip({ title, jurisdictions, value }: JurisdictionSummary & { title: string }) {
  const entries = jurisdictionEntries(jurisdictions);
  return (
    <Paper elevation={4} sx={{ px: 1.75, py: 1.5, minWidth: 200, maxWidth: 350, pointerEvents: 'none', borderRadius: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{value.toLocaleString('fr-BE')} demandes</Typography>
        <Divider />
        <Typography variant="caption" color="text.secondary" fontWeight={700}>Juridiction{entries.length > 1 ? 's' : ''}</Typography>
        {entries.length > 0 ? entries.map(([code, count]) => (
          <Stack key={code} direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2">{code}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString('fr-BE')}</Typography>
          </Stack>
        )) : <Box><Typography variant="body2">Non renseignée</Typography></Box>}
      </Stack>
    </Paper>
  );
}
