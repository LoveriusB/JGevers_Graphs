import { useMemo, useState } from 'react';
import { Alert, Box, Button, Container, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { GraphPageHeader } from '../../components/graphs/GraphPageHeader';
import { ExcelImportZone } from '../../components/graphs/ExcelImportZone';
import { createRouteCache } from '../../cache/routeCache';
import { useRouteCache } from '../../cache/useRouteCache';
import { CaseFlowChart } from './CaseFlowChart';
import { demoPatentDataset, enrichRecords, inferTransfers, makeFlow, partnerCountries, unique } from './patentFlow';
import { inboundCountries, inferInboundCases } from './inboundCases';
import type { Mode, PatentDataset } from './patentFlow';
import { importPatents } from './importPatents';

// Les données de chaque graphique restent indépendantes et locales à l'onglet.
const cache = createRouteCache<PatentDataset>('/sankey');

function displayFirm(firm: string): string {
  return firm === 'gevers ores' ? 'Gevers & Orès' : firm;
}

export function SankeyView() {
  const { value: dataset, save: saveDataset, clear: clearDataset } = useRouteCache(cache);
  const [mode, setMode] = useState<Mode>('outbound');
  const [selectedFirm, setFirm] = useState('');
  const [selectedCountry, setCountry] = useState('');

  const inferred = useMemo(() => inferTransfers(dataset?.records ?? []), [dataset]);
  const inbound = useMemo(() => inferInboundCases(enrichRecords(dataset?.records ?? [])), [dataset]);
  const firms = useMemo(() => unique((dataset?.records ?? []).map((patent) => patent.representative)), [dataset]);
  const firm = firms.includes(selectedFirm)
    ? selectedFirm
    : firms.find((value) => value === 'gevers ores')
      ?? firms.find((value) => value === 'gevers')
      ?? firms.find((value) => value.includes('gevers'))
      ?? firms[0]
      ?? '';

  const countries = useMemo(() => {
    if (mode === 'outbound') return partnerCountries(inferred.transfers, firm, mode);
    if (mode === 'countryInbound') {
      return unique((dataset?.records ?? [])
        .filter((patent) => patent.representative && patent.jurisdiction
          && (!patent.representativeCountry || patent.jurisdiction === patent.representativeCountry)
          && !['EP', 'WO'].includes(patent.jurisdiction))
        .map((patent) => patent.jurisdiction));
    }
    return inboundCountries(inbound, firm);
  }, [dataset, inbound, inferred, firm, mode]);

  const preferredCountry = mode === 'countryInbound' ? 'AU' : 'US';
  const target = mode === 'outbound'
    ? (countries.includes(selectedCountry) ? selectedCountry : '')
    : countries.includes(selectedCountry)
      ? selectedCountry
      : countries.includes(preferredCountry) ? preferredCountry : countries[0] ?? '';

  const flow = useMemo(
    () => makeFlow(dataset?.records ?? [], inferred.transfers, mode, firm, target, inbound),
    [dataset, inferred, inbound, mode, firm, target],
  );

  const title = mode === 'countryInbound'
    ? `Inbound cases – ${target}`
    : mode === 'outbound'
      ? `Outbound cases ${displayFirm(firm)}${target ? ` - ${target}` : ''}`
      : `Inbound cases ${displayFirm(firm)}${target ? ` - ${target}` : ''}`;

  const reset = () => {
    setFirm('');
    setCountry('');
    setMode('outbound');
  };

  const importDataset = (next: PatentDataset) => {
    saveDataset(next);
    reset();
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Container maxWidth="xl" sx={{ pb: 6, px: { xs: 1, sm: 2 } }}>
        <Stack spacing={3}>
          <GraphPageHeader
            title="Case Flow"
            description="Visualisez les flux de dossiers entre les cabinets de brevets."
          />

          {!dataset ? (
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6">Commencez par importer vos données</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Importez votre fichier de brevets au format XLSX.
                  </Typography>
                </Box>
                <ExcelImportZone onImport={importDataset} parseFile={importPatents} />
                <Button onClick={() => importDataset(demoPatentDataset())} sx={{ alignSelf: 'center' }}>
                  Explorer avec des données d’exemple
                </Button>
              </Stack>
            </Paper>
          ) : (
            <>
              <Alert
                severity="info"
                sx={{ borderRadius: 2.5 }}
                icon={<InsertDriveFileOutlinedIcon />}
                action={
                  <Button color="inherit" size="small" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => { clearDataset(); reset(); }}>
                    Effacer
                  </Button>
                }
              >
                <b>{dataset.filename}</b> · {dataset.records.length.toLocaleString('fr-BE')} lignes importées · conservé temporairement dans cet onglet
              </Alert>

              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
                    {mode !== 'countryInbound' && (
                      <TextField select label="Cabinet" size="small" value={firm} onChange={(event) => { setFirm(event.target.value); setCountry(''); }} sx={{ minWidth: 210, flex: 1 }}>
                        {firms.map((value) => <MenuItem key={value} value={value}>{displayFirm(value)}</MenuItem>)}
                      </TextField>
                    )}
                    <TextField select label="Type de flux" size="small" value={mode} onChange={(event) => { setMode(event.target.value as Mode); setCountry(''); }} sx={{ minWidth: 190 }}>
                      <MenuItem value="outbound">Outbound</MenuItem>
                      <MenuItem value="inbound">Inbound</MenuItem>
                      <MenuItem value="countryInbound">Inbound par pays</MenuItem>
                    </TextField>
                    <TextField select label={mode === 'outbound' ? 'Pays de destination' : 'Pays'} size="small" value={mode === 'outbound' ? (target || '__all__') : target} disabled={!countries.length} onChange={(event) => setCountry(event.target.value === '__all__' ? '' : event.target.value)} sx={{ minWidth: 170 }}>
                      {mode === 'outbound' && <MenuItem value="__all__">Tous</MenuItem>}
                      {countries.length ? countries.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>) : mode !== 'outbound' ? <MenuItem value="">Aucun</MenuItem> : null}
                    </TextField>
                  </Stack>
                  <Box>
                    <Typography variant="h6">{title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flow.total.toLocaleString('fr-BE')} demandes de brevet · {mode === 'countryInbound' ? 'déposants étrangers' : 'relations estimées à partir des familles'}
                    </Typography>
                  </Box>

                  {flow.total ? (
                    <CaseFlowChart data={flow.data} routes={flow.routes} mode={mode} layout="horizontal" selectedCountry={mode === 'outbound' ? target : undefined} />
                  ) : (
                    <Alert severity="info">
                      {mode === 'inbound'
                        ? `Aucun dossier inbound identifiable pour ${displayFirm(firm)} dans ce fichier. Cela ne signifie pas que ce cabinet ne reçoit pas de dossiers en réalité.`
                        : 'Aucun flux identifiable pour cette sélection.'}
                    </Alert>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {mode === 'countryInbound'
                      ? `${flow.excluded} demandes ambiguës exclues de cette vue. Les cabinets sans pays renseigné sont inclus si le dépôt est dans le pays cible.`
                      : mode === 'inbound'
                        ? 'Inbound estimé à partir des dépôts de déposants étrangers. Quand la famille ne permet pas de reconnaître un cabinet d’origine unique, le dossier est regroupé sous « Cabinet d’origine non identifié ».'
                        : `${inferred.unresolved.toLocaleString('fr-BE')} demandes étrangères sans origine unique identifiable dans le fichier (tous cabinets). Les relations ne prouvent pas un transfert commercial. Pays du cabinet parfois estimé par le dépôt national ; les cabinets de destination non renseignés sont affichés séparément.`}
                    {' '}{dataset.skipped > 0 ? `${dataset.skipped} lignes sans aucune donnée utile ignorées. ` : ''}
                    {(dataset.incomplete ?? 0) > 0 ? `${dataset.incomplete?.toLocaleString('fr-BE')} lignes partielles conservées avant dédoublonnage. ` : ''}
                    {dataset.duplicates > 0 ? `${dataset.duplicates} doublons de publication retirés.` : ''}
                  </Typography>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" gap={3}>
                  <Box>
                    <Typography fontWeight={750}>Importer un autre fichier</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votre précédent fichier sera remplacé dans le cache de cet onglet.
                    </Typography>
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: 400 } }}>
                    <ExcelImportZone compact onImport={importDataset} parseFile={importPatents} />
                  </Box>
                </Stack>
              </Paper>
            </>
          )}

          <Typography variant="caption" color="text.secondary" textAlign="center">
            100 % frontend · aucun compte · aucun backend · vos fichiers restent dans votre navigateur
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
