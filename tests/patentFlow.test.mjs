import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePatentRows, inferTransfers, makeFlow, demoPatentDataset, partnerCountries} from '../src/features/case-flow/patentFlow.ts';
const header=['Family ID','Jurisdiction','Publication Number','Application Number','Is Granted','Grant Date','Application Date','Priority Date','Title','Applicant','Applicant Country','Clean Rep Name','Representative','Representative CName','Representative CTranslation','Representative Address','Representative Country','IPC','CPC'];
const row=(f,j,a,n,c,r,rc,p='PUB')=>[f,j,p,a,'','','','','',n,c,r,'','','','',rc,'',''];
const demo=demoPatentDataset();
test('XLSX schema: header detection, duplicates, incomplete rows',()=>{const a=row('F1','EP','A1','CLIENT','BE','GEVERS','BE');const b=row('F1','US','A2','CLIENT','BE','US FIRM','US');const d=parsePatentRows([['title'],header,a,b,row('F1','US','A2','CLIENT','BE','US FIRM','US','OTHER PUB'),row('','US','A3','CLIENT','BE','US FIRM','US')],'test.xlsx');assert.equal(d.records.length,3);assert.equal(d.duplicates,1);assert.equal(d.skipped,0);assert.equal(d.incomplete,1);assert.equal(inferTransfers(d.records).transfers.length,1);});
test('outbound uses selected firm in middle and conserves volume',()=>{const {transfers}=inferTransfers(demo.records);const f=makeFlow(demo.records,transfers,'outbound','GEVERS','US');assert.equal(f.total,24);const mid=f.data.nodes.find(n=>n.label==='gevers').id;assert.ok(!f.data.nodes.some(n=>n.label==='US'));assert.equal(JSON.parse(mid)[0],'originFirm');assert.equal(f.data.links.filter(l=>l.target===mid).reduce((s,l)=>s+l.value,0),24);assert.equal(f.data.links.filter(l=>l.source===mid).reduce((s,l)=>s+l.value,0),24);assert.deepEqual(partnerCountries(transfers,'GEVERS','outbound'),['AU','US']);});
test('inbound is not reversed outbound and ends at Gevers',()=>{const {transfers}=inferTransfers(demo.records);const f=makeFlow(demo.records,transfers,'inbound','GEVERS','US');assert.equal(f.total,12);const end=f.data.nodes.find(n=>n.label==='gevers').id;assert.ok(f.data.links.every(l=>l.target===end));});
test('Australian inbound counts foreign applicants even without origin row, not Australian applicants',()=>{const records=[{family:'x',jurisdiction:'AU',application:'A',applicant:'X',applicantCountry:'US',representative:'AU FIRM',representativeCountry:'AU'},{family:'y',jurisdiction:'AU',application:'B',applicant:'Y',applicantCountry:'AU',representative:'AU FIRM',representativeCountry:'AU'}];assert.equal(makeFlow(records,[],'countryInbound','','AU').total,1);});
test('ambiguous home representatives are not fabricated',()=>{const records=[{family:'x',jurisdiction:'EP',application:'A',applicant:'X',applicantCountry:'BE',representative:'GEVERS',representativeCountry:'BE'},{family:'x',jurisdiction:'BE',application:'B',applicant:'X',applicantCountry:'BE',representative:'OTHER',representativeCountry:'BE'},{family:'x',jurisdiction:'US',application:'C',applicant:'X',applicantCountry:'BE',representative:'US FIRM',representativeCountry:'US'}];const result=inferTransfers(records);assert.equal(result.transfers.length,0);assert.equal(result.unresolved,1);});

test('partial records are retained and used when the view does not need missing fields',()=>{const d=parsePatentRows([header,row('F1','EP','','CLIENT','BE','GEVERS','BE'),row('F1','US','A2','CLIENT','BE','US FIRM',''),row('','AU','A3','','US','AU FIRM','AU'),row('','AU','A4','','','AU FIRM','AU'),row('','AU','','','US','AU FIRM','AU')],'partial.xlsx');assert.equal(d.records.length,5);assert.equal(d.skipped,0);assert.equal(d.incomplete,5);const {transfers}=inferTransfers(d.records);assert.equal(makeFlow(d.records,transfers,'outbound','GEVERS','US').total,1);assert.equal(makeFlow(d.records,transfers,'countryInbound','','AU').total,1);});

test('family matching tolerates translated applicant names and fills an unambiguous missing applicant country',()=>{
 const d=parsePatentRows([header,row('F1','JP','A1','CLIENT JAPONAIS','','CABINET JP',''),row('F1','US','A2','CLIENT EN ANGLAIS','JP','CABINET US','')],'partial.xlsx');
 const {transfers}=inferTransfers(d.records);
 assert.equal(transfers.length,1);
 assert.equal(makeFlow(d.records,transfers,'outbound','CABINET JP','US').total,1);
 assert.equal(makeFlow(d.records,transfers,'inbound','CABINET US','JP').total,1);
});
test('unknown destination is explicit, rather than inventing a cabinet',()=>{
 const d=parsePatentRows([header,row('F1','EP','A1','CLIENT','BE','GEVERS','BE'),row('F1','US','A2','CLIENT','BE','','')],'partial.xlsx');
 const {transfers}=inferTransfers(d.records); const flow=makeFlow(d.records,transfers,'outbound','GEVERS','US');
 assert.equal(flow.total,1);assert.ok(flow.data.nodes.some(n=>n.label==='Cabinet non renseigné'));
});
test('foreign Australian filing can be counted when only the representative country is missing',()=>{
 const d=parsePatentRows([header,row('F1','AU','A1','CLIENT','US','FIRM','')],'partial.xlsx');
 assert.equal(makeFlow(d.records,[],'countryInbound','','AU').total,1);
});


test('name variants merge before duplicate detection and family matching',()=>{
 const d=parsePatentRows([header,
 row('F1','EP','A1','  Société Élan ','BE','GÉVERS, S.A.','BE'),
 row('F1','EP','A1','societe elan','BE','gevers sa','BE','OTHER PUB'),
 row('F1','US','A2','SOCIÉTÉ-ÉLAN','BE','Cabinet O’Connor','US'),
 row('F1','US','A2','societe elan','BE','CABINET OCONNOR','US','OTHER PUB'),
 row('F2','EP','B1','Société Élan','BE','Gevers SA','BE'),
 row('F2','US','B2','societe elan','BE','Cabinet OConnor','US')],'variants.xlsx');
 assert.equal(d.duplicates,2);
 assert.equal(d.records.length,4);
 assert.deepEqual([...new Set(d.records.map(p=>p.representative))],['gevers sa','cabinet oconnor']);
 const {transfers}=inferTransfers(d.records);
 const f=makeFlow(d.records,transfers,'outbound','GÉVERS, S.A.','US');
 assert.equal(f.total,2);
 assert.deepEqual(f.data.nodes.map(n=>n.label),['societe elan','gevers sa','cabinet oconnor']);
 assert.ok(f.data.links.every(l=>l.value===2));
 assert.deepEqual(partnerCountries(transfers,'GEVERS SA','outbound'),['US']);
});
test('normalization preserves non-Latin names and does not discard legal suffixes',async()=>{
 const {normalizePatentName}=await import('../src/features/case-flow/normalize.ts');
 assert.equal(normalizePatentName('株式会社 東京'),'株式会社 東京');
 assert.equal(normalizePatentName('  Élan, GmbH  '),'elan gmbh');
 assert.notEqual(normalizePatentName('Elan GmbH'),normalizePatentName('Elan LLC'));
 assert.equal(normalizePatentName('  '),'');
});

test('outbound inclut toutes les destinations par défaut et les filtre par juridiction',()=>{
 const {transfers}=inferTransfers(demo.records);
 const all=makeFlow(demo.records,transfers,'outbound','GEVERS','');
 const us=makeFlow(demo.records,transfers,'outbound','GEVERS','US');
 const au=makeFlow(demo.records,transfers,'outbound','GEVERS','AU');
 assert.equal(all.total,36);
 assert.equal(us.total,24);
 assert.equal(au.total,12);
 assert.deepEqual(us.routes.flatMap(r=>Object.keys(r.jurisdictions)).filter(v=>v!=='US'),[]);
 assert.deepEqual(au.routes.flatMap(r=>Object.keys(r.jurisdictions)).filter(v=>v!=='AU'),[]);
 assert.ok(all.data.nodes.some(n=>n.label.startsWith('us firm')));
 assert.ok(all.data.nodes.some(n=>n.label.startsWith('au firm')));
 const middle=all.data.nodes.filter(n=>JSON.parse(n.id)[0]==='originFirm');
 assert.equal(middle.length,1);assert.equal(middle[0].label,'gevers');
 assert.ok(all.data.nodes.every(n=>JSON.parse(n.id)[0]!=='country'));
});

test('Gevers & Orès: cinq relations sortantes construites à partir de quatre familles (fixture fictive)', async () => {
 const { inferInboundCases } = await import('../src/features/case-flow/inboundCases.ts');
 const rows = [header];
 for (let i=0;i<4;i++) {
   const f=`F${i+1}`;
   rows.push(row(f,'FR',`FR${i}`,'CLIENT '+i,'FR','Gevers & Orès','FR'));
   rows.push(row(f,'US',`US${i}`,'CLIENT '+i,'FR','CABINET US '+i,'US'));
 }
 rows.push(row('F3','IL','IL3','CLIENT 2','FR','CABINET IL','IL'));
 const dataset=parsePatentRows(rows,'fixture.xlsx');
 const {transfers}=inferTransfers(dataset.records);
 const outbound=makeFlow(dataset.records,transfers,'outbound','Gevers & Orès','');
 const inbound=makeFlow(dataset.records,transfers,'inbound','Gevers & Orès','',inferInboundCases(dataset.records));
 assert.equal(outbound.total,5);
 assert.equal(outbound.routes.length,5);
 assert.equal(inbound.total,0);
 assert.equal(outbound.data.nodes.filter(n=>JSON.parse(n.id)[0]==='originFirm').length,1);
});
