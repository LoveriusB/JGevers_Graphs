import { useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FilePresentOutlinedIcon from '@mui/icons-material/FilePresentOutlined';

interface Props<T> {
  onImport: (dataset: T) => void;
  parseFile: (file: File) => Promise<T>;
  compact?: boolean;
  maxFileSizeMb?: number;
}


export function ExcelImportZone<T>({ onImport, parseFile, compact = false, maxFileSizeMb = 10 }: Props<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setIsLoading(true); setError(null);
    try {
      if (!/\.xlsx$/i.test(file.name)) throw new Error('Choisis un fichier au format .xlsx.');
      if (file.size > maxFileSizeMb * 1024 * 1024) throw new Error(`Le fichier dépasse la limite de ${maxFileSizeMb} Mo.`);
      onImport(await parseFile(file));
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Import impossible.'); }
    finally { setIsLoading(false); if (inputRef.current) inputRef.current.value = ''; }
  }
  return <Stack spacing={1.5}>
    <Paper variant="outlined" onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setIsDragging(false); void handleFile(event.dataTransfer.files[0]); }}
      sx={{ px: 3, py: compact ? 2.3 : 5, border: '1.5px dashed', borderColor: isDragging ? 'primary.main' : '#b8c2d9', bgcolor: isDragging ? '#f0f2ff' : '#fbfcff', transition: 'all 150ms', borderRadius: 3 }}>
      <Stack alignItems="center" spacing={compact ? 1 : 1.6} textAlign="center">
        <Box sx={{ bgcolor: '#eef0ff', borderRadius: 3, width: 58, height: 58, display: 'grid', placeItems: 'center', color: 'primary.main' }}><CloudUploadOutlinedIcon fontSize="large" /></Box>
        <Box><Typography variant={compact ? 'body1' : 'h6'} fontWeight={750}>Glissez votre fichier Excel ici</Typography><Typography variant="body2" color="text.secondary">ou sélectionnez-le depuis votre ordinateur</Typography></Box>
        <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden aria-label="Choisir un fichier Excel" onChange={(event) => { void handleFile(event.target.files?.[0]); }} />
        <Button variant="contained" onClick={() => inputRef.current?.click()} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={16} color="inherit"/> : <FilePresentOutlinedIcon/>}> {isLoading ? 'Lecture du fichier…' : 'Choisir un fichier .xlsx'}</Button>
        <Typography variant="caption" color="text.secondary">XLSX · {maxFileSizeMb} Mo max. · aucune donnée envoyée</Typography>
      </Stack>
    </Paper>
    {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
  </Stack>;
}
