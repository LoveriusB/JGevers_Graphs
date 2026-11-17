import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ResponsiveSankey } from '@nivo/sankey';
import type { CustomSankeyLayerProps } from '@nivo/sankey';
import { RouteRibbons } from './RouteRibbons';
import { parseNodeId, shouldRotateNodeLabel } from './sankeyLabels';
import { JurisdictionTooltip } from './JurisdictionTooltip';
import type { FlowLink, FlowNode, FlowRoute } from './patentFlow';

export type CaseFlowLayout = 'horizontal' | 'vertical';
interface CaseFlowChartProps {
  data: { nodes: FlowNode[]; links: FlowLink[] };
  routes: FlowRoute[];
  mode: 'outbound' | 'inbound' | 'countryInbound';
  layout: CaseFlowLayout;
  selectedCountry?: string;
}

const sourceColors = ['#4D87B9', '#55A18A', '#A27CB6', '#D39B57', '#BA7478', '#7498AE', '#6B9D71'];
const formatCount = (value: number) => `${value.toLocaleString('fr-BE')} demande${value === 1 ? '' : 's'}`;

const MAX_LABEL_LINE_LENGTH = 32;

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function splitLabelLines(value: string, maxLength = MAX_LABEL_LINE_LENGTH): [string, string?] {
  const normalized = displayName(value).replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return [normalized];

  const words = normalized.split(' ');
  let firstLine = '';
  let secondLine = '';

  for (const word of words) {
    const candidate = firstLine ? `${firstLine} ${word}` : word;
    if (candidate.length <= maxLength) {
      firstLine = candidate;
      continue;
    }
    secondLine = words.slice(words.indexOf(word)).join(' ');
    break;
  }

  if (!firstLine) {
    return [truncateText(normalized, maxLength), undefined];
  }

  return [firstLine, truncateText(secondLine || words.slice(1).join(' '), maxLength)];
}

function getNodeColor(id: string): string {
  const { stage, label } = parseNodeId(id);
  if (stage === 'originFirm' || stage === 'country') return '#dfe9f0';
  if (stage === 'firm') return '#52647C';
  let hash = 0;
  for (let index = 0; index < label.length; index++) hash = (hash * 31 + label.charCodeAt(index)) >>> 0;
  return sourceColors[hash % sourceColors.length];
}

function displayName(name: string): string {
  if (name === 'gevers ores') return 'Gevers & Orès';
  return name.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('fr'));
}

type SankeyNodes = CustomSankeyLayerProps<FlowNode, FlowLink>['nodes'];

function StyledNodes({ nodes, layout }: { nodes: SankeyNodes; layout: CaseFlowLayout }) {
  return <g>{nodes.map((node) => {
    const central = shouldRotateNodeLabel(node.id, 'horizontal');
    const isHorizontalCenter = central && layout === 'horizontal';
    const extraWidth = isHorizontalCenter ? Math.max(0, 93 - node.width) : 0;
    return <rect
      key={node.id}
      x={node.x - extraWidth / 2}
      y={node.y}
      width={node.width + extraWidth}
      height={node.height}
      rx={isHorizontalCenter ? 7 : 3}
      fill={isHorizontalCenter ? '#dfe9f0' : node.color}
      stroke={isHorizontalCenter ? '#afc2d1' : 'none'}
      strokeWidth={isHorizontalCenter ? 1.5 : 0}
    />;
  })}</g>;
}

function StyledLabels({ nodes, layout, centerLabel }: { nodes: SankeyNodes; layout: CaseFlowLayout; centerLabel?: string }) {
  return <g pointerEvents="none">{nodes.map((node) => {
    const { stage, label } = parseNodeId(node.id);
    const central = shouldRotateNodeLabel(node.id, layout);
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;
    if (central) {
      return <text key={node.id} x={centerX} y={centerY} transform={`rotate(-90 ${centerX} ${centerY})`}
        fill="#25384e" fontSize={15} fontWeight={800} textAnchor="middle" dominantBaseline="middle"
        stroke="#fff" strokeWidth={3} paintOrder="stroke">{centerLabel || displayName(label)}</text>;
    }
    if (layout === 'vertical') {
      return <text key={node.id} x={centerX} y={node.y + node.height + 18} textAnchor="middle" fill="#26384d" fontSize={12} fontWeight={650}>
        {displayName(label)}
      </text>;
    }
    const rightSide = stage === 'firm';
    const x = rightSide ? node.x + node.width + 14 : node.x - 14;
    const anchor = rightSide ? 'start' : 'end';
    const [firstLine, secondLine] = splitLabelLines(label);
    const nameOffset = secondLine ? -10 : -4;
    return <g key={node.id}>
      <text x={x} y={centerY + nameOffset} textAnchor={anchor} fill="#26384d" fontSize={12} fontWeight={650}>{firstLine}</text>
      {secondLine ? <text x={x} y={centerY + 6} textAnchor={anchor} fill="#26384d" fontSize={12} fontWeight={650}>{secondLine}</text> : null}
      <text x={x} y={centerY + (secondLine ? 24 : 14)} textAnchor={anchor} fill="#718296" fontSize={11}>{formatCount(node.value)}</text>
    </g>;
  })}</g>;
}

function ColumnHeadings({ mode, selectedCountry }: { mode: CaseFlowChartProps['mode']; selectedCountry?: string }) {
  const headings = mode === 'outbound'
    ? ['APPLIQUANTS', selectedCountry ? 'PAYS DE DESTINATION' : 'CABINET CENTRAL', 'CABINETS DESTINATAIRES']
    : mode === 'inbound'
      ? ['CABINETS D’ORIGINE', '', 'CABINET DESTINATAIRE']
      : ['PAYS D’ORIGINE', 'PAYS CIBLE', 'CABINETS LOCAUX'];
  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', px: { xs: 1, md: 2 }, pb: 1 }}>
    {headings.map((heading, index) => <Typography key={index} variant="overline"
      sx={{ color: '#7890a8', fontSize: 11, letterSpacing: '0.12em', fontWeight: 800, textAlign: index === 0 ? 'left' : index === 1 ? 'center' : 'right' }}>
      {heading}
    </Typography>)}
  </Box>;
}

export function CaseFlowChart({ data, routes, mode, layout, selectedCountry }: CaseFlowChartProps) {
  const labels = useMemo(() => new Map(data.nodes.map((node) => [node.id, node.label])), [data.nodes]);
  const stageSize = Math.max(1, ...Object.values(data.nodes.reduce<Record<string, number>>((counts, node) => {
    const { stage } = parseNodeId(node.id);
    counts[stage] = (counts[stage] ?? 0) + 1;
    return counts;
  }, {})));

  return <Box sx={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
    {layout === 'horizontal' && <ColumnHeadings mode={mode} selectedCountry={selectedCountry} />}
    <Box sx={{ minWidth: layout === 'horizontal' ? 1050 : Math.max(720, stageSize * 65), height: layout === 'horizontal' ? Math.max(540, stageSize * 110 + 90) : 750 }}>
      <ResponsiveSankey<FlowNode, FlowLink>
        data={data}
        layout={layout}
        align="justify"
        margin={layout === 'horizontal' ? { top: 35, right: 330, bottom: 45, left: 330 } : { top: 120, right: 45, bottom: 120, left: 45 }}
        colors={(node) => getNodeColor(String(node.id))}
        nodeThickness={18}
        nodeSpacing={34}
        nodeBorderWidth={0}
        linkOpacity={0.38}
        linkHoverOthersOpacity={0.08}
        enableLinkGradient={false}
        label={() => ''}
        nodeTooltip={({ node }) => <Paper sx={{ px: 1.75, py: 1.5, borderRadius: 2 }} elevation={4}>
          <Typography variant="subtitle2">{displayName(labels.get(node.id) ?? node.id)}</Typography>
          <Typography variant="caption" color="text.secondary">{formatCount(node.value)}</Typography>
        </Paper>}
        linkTooltip={({ link }) => <JurisdictionTooltip title={`${displayName(labels.get(link.source.id) ?? link.source.id)} → ${displayName(labels.get(link.target.id) ?? link.target.id)}`} value={link.value} jurisdictions={link.jurisdictions ?? {}} />}
        animate={false}
        layers={[
          ...(mode === 'outbound' ? [] : ['links' as const]),
          (props: CustomSankeyLayerProps<FlowNode, FlowLink>) => <StyledNodes nodes={props.nodes} layout={layout} />,
          ...(mode === 'outbound'
            ? [(props: CustomSankeyLayerProps<FlowNode, FlowLink>) => <RouteRibbons nodes={props.nodes} routes={routes} layout={layout} labels={labels} />]
            : []),
          (props: CustomSankeyLayerProps<FlowNode, FlowLink>) => <StyledLabels nodes={props.nodes} layout={layout} centerLabel={mode === 'outbound' ? selectedCountry : undefined} />,
        ]}
      />
    </Box>
  </Box>;
}
