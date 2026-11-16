import { read, utils } from 'xlsx';
import { detectHeader } from './detectHeader';
import { parseRevenue } from './normalize';
import type { RevenueDataset, RevenueRow } from './types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 5000;

export async function parseWorkbook(file: File): Promise<RevenueDataset> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choisis un fichier au format .xlsx.');
  if (file.size > MAX_FILE_SIZE) throw new Error('Le fichier dépasse la limite de 10 Mo.');

  let workbook;
  try {
    workbook = read(await file.arrayBuffer(), { type: 'array', dense: true, cellDates: false });
  } catch {
    throw new Error('Impossible de lire ce fichier Excel. Vérifie qu’il n’est pas corrompu.');
  }

  // Look for a real table header, rather than assuming it is the first row.
  // This also supports workbooks with a cover sheet before the data sheet.
  const sheet = workbook.SheetNames.map((name) => {
    const grid = utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
      header: 1, defval: null, blankrows: false,
    });
    return { grid, header: detectHeader(grid) };
  }).find((candidate) => candidate.header !== null);

  if (!sheet || !sheet.header) {
    throw new Error('En-tête introuvable : cherche une ligne « Country | 2023 | 2024 | … » (ou « Pays »).');
  }

  const { grid, header } = sheet;
  const { rowIndex, countryIndex, yearCols } = header;
  const years = yearCols.map(({ year }) => year);
  if (new Set(years).size !== years.length) {
    throw new Error('Une année apparaît plusieurs fois dans les colonnes.');
  }
  if (grid.length - rowIndex - 1 > MAX_ROWS) {
    throw new Error(`Maximum ${MAX_ROWS} lignes de données par fichier.`);
  }

  const countries = new Set<string>();
  const rows: RevenueRow[] = [];
  for (const [offset, rawRow] of grid.slice(rowIndex + 1).entries()) {
    const row = rawRow ?? [];
    const country = String(row[countryIndex] ?? '').trim().toUpperCase();
    if (!country) {
      // Empty or decorative rows are ignored. Never interpret them as countries.
      continue;
    }
    if (['TOTAL', 'TOTAL GÉNÉRAL', 'GRAND TOTAL'].includes(country)) continue;
    if (countries.has(country)) {
      throw new Error(`Pays en double : ${country} (ligne de données ${offset + 1}).`);
    }
    const values: RevenueRow['values'] = {};
    for (const { year, index } of yearCols) {
      const cell = row[index];
      const amount = parseRevenue(cell);
      if (cell !== null && cell !== undefined && String(cell).trim() !== '' && amount === null) {
        throw new Error(`Montant invalide pour ${country} en ${year} (ligne de données ${offset + 1}).`);
      }
      values[year] = amount;
    }
    countries.add(country);
    rows.push({ country, values });
  }
  if (rows.length < 2) throw new Error('Il faut au moins deux pays pour comparer leurs classements.');
  if (years.some((year) => !rows.some((row) => row.values[year] !== null))) {
    throw new Error('Une année ne contient aucun chiffre d’affaires.');
  }
  return {
    filename: file.name,
    years: [...years].sort((a, b) => Number(a) - Number(b)),
    rows,
    importedAt: Date.now(),
  };
}
