import { useState } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { createRouteCache } from '../cache/routeCache';
import { useRouteCache } from '../cache/useRouteCache';
import GraphPlaceholder from './GraphPlaceholder';

// The future graph's workbook format is not defined yet. Keep only its File in memory.
const secondGraphCache = createRouteCache<File>('/graph-2');

export default function SecondGraphPage() {
  const { value: file, save, clear } = useRouteCache(secondGraphCache);
  const [error, setError] = useState<string | null>(null);
  return (
    <Stack spacing={3}>
      <GraphPlaceholder title="Graphique 2" description="Cet espace est réservé au prochain graphique." />
      <Box>
        {file && <Alert severity="info" sx={{ mb: 2 }} action={<Button color="inherit" onClick={clear}>Effacer</Button>}>{file.name} · conservé en mémoire pour ce graphique</Alert>}
        <Button component="label" variant="contained">
          {file ? 'Remplacer le fichier .xlsx' : 'Choisir un fichier .xlsx'}
          <input hidden type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => {
            const next = event.target.files?.[0];
            event.target.value = '';
            if (!next) return;
            if (!/\.xlsx$/i.test(next.name)) { setError('Choisis un fichier au format .xlsx.'); return; }
            setError(null);
            save(next);
          }} />
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    </Stack>
  );
}
