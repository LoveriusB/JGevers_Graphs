import test from 'node:test';
import assert from 'node:assert/strict';
import { inferInboundCases, inboundCountries, UNKNOWN_ORIGIN } from '../src/features/case-flow/inboundCases.ts';
import { inferTransfers, makeFlow, demoPatentDataset } from '../src/features/case-flow/patentFlow.ts';

const p=(family,jurisdiction,application,applicantCountry,representative,representativeCountry='')=>({family,jurisdiction,application,applicant:'client',applicantCountry,representative,representativeCountry});

test('un dépôt européen d’un déposant US compte comme inbound même sans dépôt US dans le fichier',()=>{
  const rows=[p('F1','EP','EP1','US','GEVERS','BE')];
  assert.equal(inferTransfers(rows).transfers.length,0);
  const flow=makeFlow(rows,[],'inbound','GEVERS','US');
  assert.equal(flow.total,1);
  assert.ok(flow.data.nodes.some(n=>n.label===UNKNOWN_ORIGIN));
  assert.deepEqual(inboundCountries(inferInboundCases(rows),'gevers'),['US']);
});

test('une origine américaine est affichée si la même famille contient une demande US avec son cabinet',()=>{
  const rows=[p('F1','US','US1','US','US FIRM','US'),p('F1','EP','EP1','US','GEVERS','BE')];
  const flow=makeFlow(rows,[], 'inbound','GEVERS','US');
  assert.equal(flow.total,1);
  assert.ok(flow.data.nodes.some(n=>n.label==='us firm'));
});

test('ne compte pas les dépôts nationaux du pays du déposant ni les demandes WO',()=>{
 const rows=[p('F1','US','US1','US','US FIRM','US'),p('F2','EP','EP2','BE','GEVERS','BE'),p('F3','WO','WO1','US','GEVERS','BE')];
 assert.equal(inferInboundCases(rows).length,0);
});

test('l’inbound EP ne compte pas les doublons de publication',()=>{
 const rows=[p('F1','EP','EP1','US','GEVERS','BE'),p('F1','EP','EP1','US','GEVERS','BE')];
 assert.equal(makeFlow(rows,[],'inbound','GEVERS','US').total,1);
});

test('aucun cabinet d’origine inventé lorsqu’il y en a plusieurs',()=>{
 const rows=[p('F1','US','US1','US','US A','US'),p('F1','US','US2','US','US B','US'),p('F1','EP','EP1','US','GEVERS','BE')];
 assert.equal(inferInboundCases(rows).find(c=>c.representative==='gevers').originFirm,UNKNOWN_ORIGIN);
});

test('la démo Gevers conserve ses 12 dossiers inbound depuis les États-Unis',()=>{
 const rows=demoPatentDataset().records;
 assert.equal(makeFlow(rows,[],'inbound','GEVERS','US').total,12);
});
