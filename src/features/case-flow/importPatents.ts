import { read, utils } from 'xlsx';
import { findPatentHeader, parsePatentRows } from './patentFlow.ts';
export async function importPatents(file: File) {
  if(!/\.xlsx$/i.test(file.name)) throw new Error('Choisissez un fichier XLSX.');
  const workbook=read(await file.arrayBuffer(),{type:'array',dense:true,cellDates:false});
  const grids: unknown[][][]=[];
  for(const name of workbook.SheetNames) {
    const grid=utils.sheet_to_json<unknown[]>(workbook.Sheets[name],{header:1,defval:null,blankrows:false,raw:false});
    if(findPatentHeader(grid)>=0) { const header=findPatentHeader(grid); grids.push(grid.slice(header)); }
  }
  if(grids.length) {
    // Reconcile header order across sheets before global deduplication.
    const header=grids[0][0];
    const canonical=header.map(v=>String(v??'').trim().toLowerCase());
    const combined=[header,...grids.flatMap(grid=>{const keys=grid[0].map(v=>String(v??'').trim().toLowerCase());return grid.slice(1).map(row=>canonical.map(key=>row[keys.indexOf(key)]));})];
    return parsePatentRows(combined,file.name);
  }
  throw new Error('Aucune feuille ne contient les colonnes de brevets attendues.');
}
