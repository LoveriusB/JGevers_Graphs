import { cleanCell, normalizeHeader, normalizePatentName } from './normalize.ts';
import { inferInboundCases } from './inboundCases.ts';
import type { InboundCase } from './inboundCases.ts';

export interface Patent { family: string; jurisdiction: string; application: string; applicant: string; applicantCountry: string; representative: string; representativeCountry: string }
export interface PatentDataset { filename: string; records: Patent[]; skipped: number; duplicates: number; incomplete?: number }
export type Mode = 'outbound' | 'inbound' | 'countryInbound';
export interface FlowNode { id: string; label: string }
export interface FlowLink { source: string; target: string; value: number; jurisdictions: Record<string, number> }
export interface FlowRoute { source: string; center: string; target: string; value: number; jurisdictions: Record<string, number> }
export interface Transfer { origin: Patent; destination: Patent }
const required = ['Family ID','Jurisdiction','Application Number','Applicant','Applicant Country','Clean Rep Name','Representative Country'] as const;
const european = new Set('AL AT BE BG CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MC ME MK MT NL NO PL PT RO RS SE SI SK SM TR'.split(' '));
export function country(value: unknown): string {
  const v = cleanCell(value).toUpperCase();
  return ({ USA:'US', 'UNITED STATES':'US', 'UNITED STATES OF AMERICA':'US', AUSTRALIA:'AU', BELGIUM:'BE', UK:'GB', 'UNITED KINGDOM':'GB', 'EUROPEAN PATENT OFFICE':'EP' } as Record<string,string>)[v] ?? v;
}
export function findPatentHeader(grid: unknown[][]): number {
  return grid.findIndex(row => { const headers = new Set(row.map(v => normalizeHeader(cleanCell(v)))); return required.every(h => headers.has(normalizeHeader(h))); });
}
export function parsePatentRows(grid: unknown[][], filename: string): PatentDataset {
  const header = findPatentHeader(grid);
  if (header < 0) throw new Error('Colonnes requises : '+required.join(', ')+'.');
  const headers = grid[header].map(v => normalizeHeader(cleanCell(v)));
  const records: Patent[] = []; let skipped = 0; let duplicates = 0; let incomplete = 0;
  const seen = new Set<string>();
  for (const row of grid.slice(header+1)) {
    if (!row.some(v => cleanCell(v))) continue;
    const get = (key: string) => cleanCell(row[headers.indexOf(normalizeHeader(key))]);
    const p: Patent = {family:get('Family ID'), jurisdiction:country(get('Jurisdiction')), application:get('Application Number').toUpperCase(), applicant:normalizePatentName(get('Applicant')), applicantCountry:country(get('Applicant Country')), representative:normalizePatentName(get('Clean Rep Name')) || normalizePatentName(get('Representative')), representativeCountry:country(get('Representative Country'))};
    if (!Object.values(p).some(Boolean)) { skipped++; continue; }
    if (Object.values(p).some(value => !value)) incomplete++;
    // Collapse repeated publication rows, but keep conflicting associations for ambiguity checks.
    const key = JSON.stringify(p);
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key); records.push(p);
  }
  if (!records.length) throw new Error('Aucune donnée de brevet exploitable.');
  return {filename, records, skipped, duplicates, incomplete};
}
function home(p: Patent): boolean {
  return Boolean(p.jurisdiction && p.applicantCountry) && (p.jurisdiction === p.applicantCountry || (p.jurisdiction === 'EP' && european.has(p.applicantCountry)));
}
// Fill only values supported by unambiguous observations in the workbook.
export function enrichRecords(records: Patent[]): Patent[] {
  records = records.map(p => ({ ...p, applicant: normalizePatentName(p.applicant), representative: normalizePatentName(p.representative) }));
  const familyCountries = new Map<string,Set<string>>();
  const firmCountries = new Map<string,Set<string>>();
  const add = (map:Map<string,Set<string>>, key:string, value:string) => { if (!key || !value) return; const set=map.get(key)??new Set<string>(); set.add(value); map.set(key,set); };
  for (const p of records) { add(familyCountries,p.family,p.applicantCountry); add(firmCountries,p.representative,p.representativeCountry); }
  const only=(set:Set<string>|undefined)=>set?.size===1?[...set][0]:'';
  return records.map(p=>({...p, applicantCountry:p.applicantCountry||only(familyCountries.get(p.family)), representativeCountry:p.representativeCountry||only(firmCountries.get(p.representative))}));
}
export function inferTransfers(records: Patent[]) {
  const families = new Map<string, Patent[]>();
  for (const p of enrichRecords(records)) { if (!p.family) continue; const list = families.get(p.family); if (list) list.push(p); else families.set(p.family,[p]); }
  const candidates = new Map<string, Map<string, Transfer>>();
  const ambiguous = new Set<string>();
  for (const family of families.values()) {
    const origins = family.filter(p=>home(p)&&p.representative);
    const pctOrigins = family.filter(p=>p.jurisdiction==='WO'&&p.applicantCountry&&p.representative&&p.representativeCountry===p.applicantCountry);
    for (const destination of family) {
      const key=JSON.stringify([destination.jurisdiction,destination.application]);
      if (home(destination)||!destination.application||!destination.jurisdiction||destination.jurisdiction==='WO'||!destination.applicantCountry) continue;
      // A different spelling (or translation) of an applicant is not a reason to break a patent family.
      const local=origins.filter(p=>p.applicantCountry===destination.applicantCountry);
      const pool=local.length?local:pctOrigins.filter(p=>p.applicantCountry===destination.applicantCountry);
      const exact=pool.filter(p=>p.applicant&&p.applicant===destination.applicant);
      const matches=new Map((exact.length?exact:pool).map(p=>[JSON.stringify([p.representative,p.representativeCountry]),p]));
      if (matches.size!==1) { ambiguous.add(key); continue; }
      const origin=[...matches.values()][0];
      if (origin.representative===destination.representative) continue;
      const group=candidates.get(key)??new Map<string,Transfer>();
      group.set(JSON.stringify([origin.family,origin.representative,destination.representative]),{origin,destination}); candidates.set(key,group);
    }
  }
  const transfers: Transfer[]=[];
  for(const [key,group] of candidates) { if(group.size===1&&!ambiguous.has(key)) transfers.push([...group.values()][0]); else ambiguous.add(key); }
  return {transfers,unresolved:ambiguous.size};
}
// A national home filing gives a geographic proxy when the origin firm's country is absent.
const originCountry=(p:Patent)=>p.representativeCountry||(p.jurisdiction===p.applicantCountry?p.applicantCountry:'');
export function unique(values: string[]) { return [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }
export function partnerCountries(transfers: Transfer[], firm: string, mode: Mode) {
  firm = normalizePatentName(firm);
  return unique(transfers.filter(t=>mode==='outbound'?t.origin.representative===firm:t.destination.representative===firm).map(t=>mode==='outbound'?t.destination.jurisdiction:originCountry(t.origin)));
}
export function makeFlow(records: Patent[], transfers: Transfer[], mode: Mode, firm: string, target: string, inboundCases?: InboundCase[]) {
  firm = normalizePatentName(firm);
  const nodes = new Map<string,FlowNode>(); const links = new Map<string,FlowLink>();
  const add = (stage: string,label: string) => { const id=JSON.stringify([stage,label]); nodes.set(id,{id,label}); return id; };
  const link = (source:string,target:string,jurisdiction:string) => { const key=JSON.stringify([source,target]); const prior=links.get(key); if(prior) { prior.value++; prior.jurisdictions[jurisdiction]=(prior.jurisdictions[jurisdiction]??0)+1; } else links.set(key,{source,target,value:1,jurisdictions:{[jurisdiction]:1}}); };
  const routes = new Map<string,FlowRoute>();
  const route = (source:string,center:string,target:string,jurisdiction:string) => {
    link(source,center,jurisdiction); link(center,target,jurisdiction);
    const key=JSON.stringify([source,center,target]);
    const prior=routes.get(key);
    if(prior) {prior.value++;prior.jurisdictions[jurisdiction]=(prior.jurisdictions[jurisdiction]??0)+1;} else routes.set(key,{source,center,target,value:1,jurisdictions:{[jurisdiction]:1}});
  };
  let total=0; let excluded=0;
  if (mode==='countryInbound') {
    const applications = new Map<string, Map<string,Patent>>();
    for(const p of enrichRecords(records)) if(p.jurisdiction===target && p.application && p.applicantCountry && p.applicantCountry!==target && p.representative && (!p.representativeCountry||p.representativeCountry===target)) {
      const key=JSON.stringify([p.jurisdiction,p.application]); const group=applications.get(key)??new Map<string,Patent>(); group.set(JSON.stringify([p.applicantCountry,p.representative]),p); applications.set(key,group);
    }
    for(const group of applications.values()) { if(group.size!==1){excluded++;continue;} const p=[...group.values()][0]; link(add('origin',p.applicantCountry),add('country',target),p.jurisdiction||'Non renseignée'); link(add('country',target),add('firm',p.representative),p.jurisdiction||'Non renseignée'); total++; }
  } else if (mode === 'inbound') {
    for (const item of inboundCases ?? inferInboundCases(enrichRecords(records))) {
      if (item.representative !== firm || (target && item.applicantCountry !== target)) continue;
      link(add('origin', item.originFirm), add('firm', firm), item.jurisdiction||'Non renseignée');
      total++;
    }
  } else for(const {origin,destination} of transfers) {
    if(mode==='outbound' && origin.representative===firm && (!target || destination.jurisdiction===target)) {route(add('applicant',origin.applicant||destination.applicant||'Déposant inconnu'),add('originFirm',firm),add('firm',destination.representative||'Cabinet non renseigné'),destination.jurisdiction||'Non renseignée');total++;}
  }
  return {data:{nodes:[...nodes.values()],links:[...links.values()]},total,excluded,routes:[...routes.values()]};
}
export function demoPatentDataset(): PatentDataset {
  const records: Patent[]=[];
  const put=(family:string,applicant:string,applicantCountry:string,jurisdiction:string,representative:string,representativeCountry:string)=>records.push({family,applicant:normalizePatentName(applicant),applicantCountry,jurisdiction,representative:normalizePatentName(representative),representativeCountry,application:`${family}-${jurisdiction}`});
  for(let i=0;i<24;i++){const f=`F${i}`;const a=`CLIENT ${i%6+1}`;put(f,a,'BE','EP','GEVERS','BE');put(f,a,'BE','US',`US FIRM ${i%4+1}`,'US');if(i%2===0)put(f,a,'BE','AU',`AU FIRM ${i%3+1}`,'AU');}
  for(let i=0;i<12;i++){const f=`I${i}`;const a=`US CLIENT ${i%5+1}`;put(f,a,'US','US',`US FIRM ${i%4+1}`,'US');put(f,a,'US','EP','GEVERS','BE');if(i%2===0)put(f,a,'US','AU',`AU FIRM ${i%3+1}`,'AU');}
  return {filename:'Données fictives',records,skipped:0,duplicates:0};
}
