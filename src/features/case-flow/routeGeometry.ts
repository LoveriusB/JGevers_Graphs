import type { FlowRoute } from './patentFlow.ts';

export interface PositionedNode { id: string; x: number; y: number; width: number; height: number; color: string }
export interface Ribbon { route: FlowRoute; path: string; color: string }

const BAND_FILL_RATIO = 0.78;

/** Allocate each true route a separate band at both ends and through the hub. */
export function routeGeometry(nodes: readonly PositionedNode[], routes: FlowRoute[], layout: 'horizontal'|'vertical'): Ribbon[] {
  const vertical=layout==='vertical';
  const frames=new Map(nodes.map(n=>[n.id,{...n,start:vertical?n.y:n.x,end:vertical?n.y+n.height:n.x+n.width,across:vertical?n.x:n.y,span:vertical?n.width:n.height}]));
  const valid=routes.filter(r=>r.value>0&&frames.has(r.source)&&frames.has(r.center)&&frames.has(r.target));
  const totals=new Map<string,number>();
  for(const r of valid) for(const id of [r.source,r.center,r.target]) totals.set(id,(totals.get(id)??0)+r.value);
  const position=(id:string)=>frames.get(id)!.across;
  const ordered=[...valid].sort((a,b)=>position(a.source)-position(b.source)||position(a.target)-position(b.target)||a.source.localeCompare(b.source)||a.target.localeCompare(b.target));
  const incoming=new Map<FlowRoute,number>(), outgoing=new Map<FlowRoute,number>();
  const offsets=new Map<string,number>();
  const allocate=(id:string,value:number)=>{const f=frames.get(id)!;const total=totals.get(id)!;const effectiveSpan=f.span*BAND_FILL_RATIO;const inset=(f.span-effectiveSpan)/2;const offset=offsets.get(id)??0;offsets.set(id,offset+value);return f.across+inset+offset*effectiveSpan/total;};
  for(const r of ordered) incoming.set(r,allocate(r.center,r.value));
  offsets.clear();
  // Keep identical band ordering on both faces of the hub: a route must
  // not switch vertical slot inside the central cabinet.
  for(const r of ordered) outgoing.set(r,allocate(r.center,r.value));
  offsets.clear();
  const sources=new Map(ordered.map(r=>[r,allocate(r.source,r.value)]));
  offsets.clear();
  const targets=new Map([...ordered].sort((a,b)=>position(a.target)-position(b.target)||position(a.source)-position(b.source)).map(r=>[r,allocate(r.target,r.value)]));
  const xy=(along:number,across:number)=>vertical?`${across},${along}`:`${along},${across}`;
  const curve=(a:number,b:number,c:number,d:number)=>`C${xy((a+c)/2,b)} ${xy((a+c)/2,d)} ${xy(c,d)}`;
  return ordered.map(r=>{
    const s=frames.get(r.source)!,m=frames.get(r.center)!,t=frames.get(r.target)!;
    const a=sources.get(r)!,b=incoming.get(r)!,c=outgoing.get(r)!,d=targets.get(r)!;
    const sw=r.value*(s.span*BAND_FILL_RATIO)/totals.get(r.source)!,mw=r.value*(m.span*BAND_FILL_RATIO)/totals.get(r.center)!,tw=r.value*(t.span*BAND_FILL_RATIO)/totals.get(r.target)!;
    const path=`M${xy(s.end,a)} ${curve(s.end,a,m.start,b)} ${curve(m.start,b,m.end,c)} ${curve(m.end,c,t.start,d)} L${xy(t.start,d+tw)} ${curve(t.start,d+tw,m.end,c+mw)} ${curve(m.end,c+mw,m.start,b+mw)} ${curve(m.start,b+mw,s.end,a+sw)} Z`;
    return {route:r,path,color:s.color};
  });
}
