import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { RankChart } from "./components/chart/RankChart";
import { CountryLegend } from "./components/chart/CountryLegend";
import { ImportZone } from "./components/importer/ImportZone";
import { OverviewCards } from "./components/overview/OverviewCards";
import { useDataset } from "./hooks/useDataset";
import { selectCohort } from "./revenue/topRanks";
import { YEAR_2026_FACTOR } from "./revenue/revenueAdjustment";

export function RankingView() {
  const { dataset, saveDataset, clearDataset, showDemo } = useDataset();
  const [topLimit, setTopLimit] = useState(10);
  const [selection, setSelection] = useState<{
    dataset: typeof dataset;
    topLimit: number;
    year: string;
    countries: string[];
  } | null>(null);
  const [referenceYear, setReferenceYear] = useState<string | null>(null);
  const activeYear = dataset?.years.includes(referenceYear ?? "")
    ? referenceYear!
    : dataset?.years[dataset.years.length - 1] ?? "";
  const topCountries = dataset
    ? selectCohort(dataset, topLimit, activeYear)
    : [];
  const selectedCountries =
    selection &&
    selection.dataset === dataset &&
    selection.topLimit === topLimit &&
    selection.year === activeYear
      ? selection.countries
      : topCountries;
  const setSelectedCountries = (countries: string[]) =>
    setSelection({ dataset, topLimit, year: activeYear, countries });

  return (
    <Box sx={{ minWidth: 0 }}>
      <Container maxWidth="xl" sx={{ pb: 6, px: { xs: 1, sm: 2 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ fontWeight: 800, letterSpacing: 2 }}
            >
              EXPLORATEUR DE DONNÉES
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              Évolution des classements
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 660 }}>
              Visualisez comment chaque pays monte ou descend dans le classement
              des chiffres d’affaires, année après année.
            </Typography>
          </Box>
          {!dataset ? (
            <Paper
              variant="outlined"
              sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}
            >
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6">
                    Commencez par importer vos données
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Un simple tableau : une colonne « Pays », puis une colonne
                    par année.
                  </Typography>
                </Box>
                <ImportZone onImport={saveDataset} />
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  spacing={1}
                  flexWrap="wrap"
                >
                  <Button onClick={showDemo}>
                    Explorer avec des données d’exemple
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Link
                    href={`${
                      import.meta.env.BASE_URL
                    }ranking/exemple-chiffres-affaires.xlsx`}
                    underline="hover"
                    download
                  >
                    {" "}
                    Télécharger un XLSX d’exemple
                  </Link>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <>
              <Alert
                severity="info"
                sx={{ borderRadius: 2.5 }}
                icon={<InsertDriveFileOutlinedIcon />}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<DeleteOutlineRoundedIcon />}
                    onClick={clearDataset}
                  >
                    Effacer
                  </Button>
                }
              >
                <b>{dataset.filename}</b> · {dataset.rows.length} pays ·{" "}
                {dataset.years[0]}–{dataset.years[dataset.years.length - 1]} ·
                conservé temporairement dans cet onglet
              </Alert>
              <OverviewCards dataset={dataset} />
              {dataset.years.includes("2026") && (
                <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                  Les montants de 2026 sont multipliés par{" "}
                  {YEAR_2026_FACTOR.toLocaleString("fr-BE")} pour le classement
                  et les infobulles. Les données originales du fichier Excel
                  restent inchangées.
                </Alert>
              )}
              <Paper
                variant="outlined"
                sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}
              >
                <Stack spacing={3}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Box>
                      <Typography variant="h6">
                        Classement par chiffre d’affaires
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        On sélectionne les X pays aux montants les plus bas de
                        l’année de référence, puis on les reclasse du plus petit
                        au plus grand chaque année
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      gap={1.5}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <TextField
                        type="number"
                        size="small"
                        label="Top X"
                        value={topLimit}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isFinite(value) && value >= 1) {
                            setTopLimit(Math.min(9999, Math.floor(value)));
                            setSelection(null);
                          }
                        }}
                        slotProps={{
                          htmlInput: {
                            min: 1,
                            max: dataset.rows.length,
                            step: 1,
                          },
                        }}
                        sx={{ width: 125 }}
                      />
                      <TextField
                        select
                        size="small"
                        label="Année de référence"
                        value={activeYear}
                        onChange={(event) => {
                          setReferenceYear(event.target.value);
                          setSelection(null);
                        }}
                        sx={{ minWidth: 175 }}
                      >
                        {dataset.years.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Tooltip
                        arrow
                        placement="top"
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              À quoi sert l’année de référence ?
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Elle sert uniquement à choisir les pays comparés :
                              avec « Top {topLimit} » et « {activeYear} », on
                              sélectionne les {topLimit} pays aux montants les
                              plus bas de {activeYear}.
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.75 }}>
                              On ignore ensuite tous les autres pays et on
                              reclasse uniquement ces mêmes
                              {topLimit} pays pour chaque année, de la 1re à la{" "}
                              {topLimit}e place.
                            </Typography>
                          </Box>
                        }
                      >
                        <IconButton
                          size="small"
                          aria-label="Expliquer l’année de référence"
                          sx={{ ml: -0.75 }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  {topCountries.length < topLimit && (
                    <Alert severity="warning">
                      Seulement {topCountries.length} pays disposent de données
                      valides sur toutes les années. Le Top {topLimit} n’est
                      donc pas entièrement disponible.
                    </Alert>
                  )}
                  <RankChart
                    dataset={dataset}
                    topLimit={topLimit}
                    referenceYear={activeYear}
                    selectedCountries={selectedCountries}
                  />
                  <Divider />
                  <CountryLegend
                    countries={topCountries}
                    allCountries={dataset.rows.map((row) => row.country)}
                    selectedCountries={selectedCountries}
                    onChange={setSelectedCountries}
                  />
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ md: "center" }}
                  justifyContent="space-between"
                  gap={3}
                >
                  <Box>
                    <Typography fontWeight={750}>
                      Importer un autre fichier
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votre précédent fichier sera remplacé dans le cache de cet
                      onglet.
                    </Typography>
                  </Box>
                  <Box sx={{ width: { xs: "100%", md: 400 } }}>
                    <ImportZone compact onImport={saveDataset} />
                  </Box>
                </Stack>
              </Paper>
            </>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            100 % frontend · aucun compte · aucun backend · vos fichiers restent
            dans votre navigateur
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
