import { useState } from 'react';
import { useTooltip } from '@nivo/tooltip';
import { JurisdictionTooltip } from './JurisdictionTooltip';
import { routeGeometry } from './routeGeometry';
import type { PositionedNode } from './routeGeometry';
import type { FlowRoute } from './patentFlow';

export function RouteRibbons({nodes,routes,layout,labels}:{nodes:readonly PositionedNode[];routes:FlowRoute[];layout:'horizontal'|'vertical';labels:Map<string,string>}) {
  const [active,setActive]=useState<string|null>(null);
  const { showTooltipFromEvent, hideTooltip } = useTooltip();
  const ribbons=routeGeometry(nodes,routes,layout);
  return <g>{ribbons.map(({route,path,color})=>{
    const key=JSON.stringify([route.source,route.center,route.target]);
    const description=`${labels.get(route.source)} → ${labels.get(route.center)} → ${labels.get(route.target)} : ${route.value} demandes`;
    return <path key={key} d={path} fill={color} fillOpacity={active === key ? 0.8 : active ? 0.34 : 0.53} style={{ transition: 'fill-opacity 160ms ease-out' }} onMouseEnter={(event)=>{setActive(key);showTooltipFromEvent(<JurisdictionTooltip title={`${labels.get(route.source)} → ${labels.get(route.center)} → ${labels.get(route.target)}`} value={route.value} jurisdictions={route.jurisdictions}/>,event);}} onMouseMove={(event)=>showTooltipFromEvent(<JurisdictionTooltip title={`${labels.get(route.source)} → ${labels.get(route.center)} → ${labels.get(route.target)}`} value={route.value} jurisdictions={route.jurisdictions}/>,event)} onMouseLeave={()=>{setActive(null);hideTooltip();}} onFocus={()=>setActive(key)} onBlur={()=>{setActive(null);hideTooltip();}} tabIndex={0} aria-label={description} />;
  })}</g>;
}
