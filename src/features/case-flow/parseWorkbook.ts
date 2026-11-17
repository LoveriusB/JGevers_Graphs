import { read, utils } from 'xlsx';
import { cleanCell, normalizeHeader } from './normalize.ts';
import { detectHeaderRow } from './detectHeader.ts';
import { detectMapping } from './detectMapping.ts';
import type { ImportedWorkbookData, RawWorkbookRow } from './types.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 10000;

export async function parseCaseFlowWorkbook(file: File): Promise<ImportedWorkbookData> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choisis un fichier au format .xlsx.');
  if (file.size > MAX_FILE_SIZE) throw new Error('Le fichier dépasse la limite de 10 Mo.');

  let workbook;
  try {
    workbook = read(await file.arrayBuffer(), { type: 'array', dense: true, cellDates: false });
  } catch {
    throw new Error('Impossible de lire ce fichier Excel. Vérifie qu’il n’est pas corrompu.');
  }

  const candidates = workbook.SheetNames.map((name) => {
    const grid = utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
      header: 1,
      defval: null,
      blankrows: false,
    });
    const headerIndex = detectHeaderRow(grid);
    return { name, grid, headerIndex };
  }).filter((candidate) => candidate.headerIndex !== null);

  const sheet = candidates.sort((a, b) => scoreHeaderRow(b.grid[b.headerIndex ?? 0] ?? []) - scoreHeaderRow(a.grid[a.headerIndex ?? 0] ?? []))[0];
  if (!sheet || sheet.headerIndex === null) {
    throw new Error('En-tête introuvable : il faut au moins une ligne de colonnes (Applicant, Representative, Country, …).');
  }

  const headerRow = sheet.grid[sheet.headerIndex] ?? [];
  const headers = headerRow.map((cell, index) => cleanCell(cell) || `Colonne ${index + 1}`);
  const rows = sheet.grid.slice(sheet.headerIndex + 1)
    .map((row) => rowToRecord(headers, row ?? []))
    .filter((row) => Object.values(row).some((value) => value !== ''));

  if (rows.length === 0) throw new Error('Le fichier ne contient aucune ligne exploitable sous l’en-tête détecté.');
  if (rows.length > MAX_ROWS) throw new Error(`Maximum ${MAX_ROWS} lignes de données par fichier.`);

  return {
    filename: file.name,
    importedAt: Date.now(),
    headers,
    rows,
    mapping: detectMapping(headers),
  };
}

function rowToRecord(headers: string[], row: unknown[]): RawWorkbookRow {
  return headers.reduce<RawWorkbookRow>((record, header, index) => {
    record[header] = cleanCell(row[index]);
    return record;
  }, {});
}

function scoreHeaderRow(row: unknown[]): number {
  return row.reduce((score, cell) => {
    const header = normalizeHeader(cleanCell(cell));
    if (!header) return score;
    if (['applicant', 'client', 'country', 'representative', 'agent'].some((token) => header.includes(token))) {
      return score + 1;
    }
    return score;
  }, 0);
}
