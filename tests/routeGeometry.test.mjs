import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFlow, demoPatentDataset, inferTransfers } from '../src/features/case-flow/patentFlow.ts';
import { routeGeometry } from '../src/features/case-flow/routeGeometry.ts';

test('outbound preserves exact source/center/destination tuples and both aggregate volumes',()=>{
  const {records}=demoPatentDataset();
  const {transfers}=inferTransfers(records);
  const flow=makeFlow(records,transfers,'outbound','gevers','');
  assert.equal(flow.routes.reduce((sum,r)=>sum+r.value,0),flow.total);
  for(const link of flow.data.links) assert.equal(flow.routes.filter(r=>(r.source===link.source&&r.center===link.target)||(r.center===link.source&&r.target===link.target)).reduce((sum,r)=>sum+r.value,0),link.value);
  const expected=new Map();
  for(const {origin,destination} of transfers.filter(t=>t.origin.representative==='gevers')) {const key=JSON.stringify([origin.applicant||destination.applicant||'Déposant inconnu',destination.representative||'Cabinet non renseigné']);expected.set(key,(expected.get(key)??0)+1);}
  for(const r of flow.routes) assert.equal(r.value,expected.get(JSON.stringify([JSON.parse(r.source)[1],JSON.parse(r.target)[1]])));
});
const nodes=[{id:'brown',x:0,y:0,width:10,height:20,color:'brown'},{id:'yellow',x:0,y:30,width:10,height:10,color:'yellow'},{id:'hub',x:100,y:0,width:30,height:30,color:'orange'},{id:'pink',x:200,y:0,width:10,height:10,color:'pink'},{id:'gray',x:200,y:20,width:10,height:20,color:'gray'}];
const routes=[{source:'brown',center:'hub',target:'pink',value:1},{source:'brown',center:'hub',target:'gray',value:1},{source:'yellow',center:'hub',target:'gray',value:1}];
test('three real ribbons, no yellow-to-pink path, exactly allocated endpoints',()=>{
 const ribbons=routeGeometry(nodes,routes,'horizontal');
 assert.equal(ribbons.length,3);
 assert.deepEqual(ribbons.map(r=>[r.route.source,r.route.target]),[['brown','pink'],['brown','gray'],['yellow','gray']]);
 assert.match(ribbons[0].path,/^M10,2\.[0-9]+ /);
 assert.match(ribbons[0].path,/ L200,8\.9 /);
 assert.match(ribbons[1].path,/^M10,10 /);
 assert.match(ribbons[1].path,/ 200,22\.2 L200,30 /);
 assert.match(ribbons[2].path,/^M10,31\.[0-9]+ /);
 assert.match(ribbons[2].path,/ 200,30 L200,37.8 /);
});
test('vertical geometry preserves the same three paths with transposed coordinates',()=>{
 const vertical=nodes.map(n=>({...n,x:n.y,y:n.x,width:n.height,height:n.width}));
 const ribbons=routeGeometry(vertical,routes,'vertical');
 assert.equal(ribbons.length,3);
 assert.match(ribbons[2].path,/^M31\.1,10 .* L37\.8,200 /);
});

test('les rubans conservent la même position sur les deux faces du cabinet central', () => {
 const ribbons=routeGeometry(nodes,routes,'horizontal');
 for(const {path} of ribbons){
   const match=path.match(/ C115,([\d.]+) 115,([\d.]+) 130,([\d.]+) C/);
   assert.ok(match, 'segment central du ruban');
   assert.equal(match[1],match[2]);
   assert.equal(match[2],match[3]);
 }
});
