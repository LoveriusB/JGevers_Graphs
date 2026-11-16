import { useMemo, useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveLine } from '@nivo/line';
import type { RevenueDataset } from '../../revenue/types';
import { buildRankingChartSeries, findRankingChartPoint } from '../../revenue/chartSeries';
import { formatCurrency } from '../../revenue/normalize';

import { countryColor } from '../../revenue/countryColors';

interface Props { dataset: RevenueDataset; selectedCountries: string[]; topLimit: number; referenceYear: string; }

function rankTicks(count: number): number[] {
  const step = Math.max(1, Math.ceil(count / 12));
  const ticks = Array.from({ length: Math.floor((count - 1) / step) + 1 }, (_, index) => 1 + index * step);
  if (ticks[ticks.length - 1] !== count) ticks.push(count);
  return ticks;
}

export function RankChart({ dataset, selectedCountries, topLimit, referenceYear }: Props) {
  const muiTheme = useTheme();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const allCountries = useMemo(() => dataset.rows.map((row) => row.country), [dataset]);
  const chartData = useMemo(() => buildRankingChartSeries(dataset, topLimit, referenceYear), [dataset, topLimit, referenceYear]);
  const maxRank = Math.max(1, chartData.length);

  return <Box onMouseLeave={() => setHoveredCountry(null)} role="img" aria-label="Graphique d'évolution des positions des pays par année, première place en haut" sx={{ height: { xs: 440, sm: 530 }, width: '100%', minWidth: 0 }}>
    <ResponsiveLine
      // Remount when the fixed cohort changes: Nivo must not interpolate old ranks
      // into a completely different set of countries.
      key={`${dataset.importedAt}-${referenceYear}-${topLimit}`}
      data={chartData}
      margin={{ top: 60, right: 35, bottom: 60, left: 70 }}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 1, max: maxRank, stacked: false, reverse: true }}
      // Hover a point or its mesh region: spotlight its country and dim all others.
      // The unfiltered palette remains unchanged when the pointer leaves the chart.
      colors={({ id }) => {
        const country = String(id);
        if (hoveredCountry !== null && country !== hoveredCountry) return '#e7eaf0';
        return selectedCountries.includes(country) || country === hoveredCountry
          ? countryColor(country, allCountries)
          : '#e7eaf0';
      }}
      onMouseMove={(point) => {
        const match = findRankingChartPoint(chartData, String(point.data.x), Number(point.data.y));
        const country = match?.country ?? null;
        setHoveredCountry((previous) => previous === country ? previous : country);
      }}
      lineWidth={3}
      pointSize={11}
      pointColor={{ from: 'color' }}
      pointBorderWidth={2}
      pointBorderColor="#ffffff"
      // Show every rank directly above its point, including the first year.
      // Keep country codes beside the first column for identifying trajectories.
      layers={[
        'grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'points',
        ({ points }) => {
          const firstX = Math.min(...points.map((point) => point.x));
          return (
            <g aria-label="Positions des pays par année">
              {points.map((point) => {
                const match = findRankingChartPoint(
                  chartData,
                  String(point.data.x),
                  Number(point.data.y),
                );
                if (!match) return null;

                const country = match.country;
                const isDimmed = hoveredCountry !== null
                  ? hoveredCountry !== country
                  : !selectedCountries.includes(country);
                const color = isDimmed
                  ? '#b7bfcc'
                  : countryColor(country, allCountries);
                const isFirstYear = Number.isFinite(firstX) && Math.abs(point.x - firstX) < 0.5;

                return (
                  <g key={`${country}-${match.point.x}`} pointerEvents="none">
                    {!isFirstYear && (
                      <text
                        x={point.x}
                        y={point.y - 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fontWeight={800}
                        fill="#63718A"
                        stroke="#ffffff"
                        strokeWidth={4}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                      >
                        {match.point.y}
                      </text>
                    )}
                    {isFirstYear && (
                      <text
                        x={point.x + 14}
                        y={point.y}
                        dominantBaseline="middle"
                        fontSize={12}
                        fontWeight={700}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={4}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                      >
                        {country}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        },
        'mesh', 'legends',
      ]}
      axisTop={{ tickSize: 0, tickPadding: 39 }}
      axisRight={null}
      axisBottom={{ tickSize: 0, tickPadding: 16, legend: 'ANNÉE', legendPosition: 'middle', legendOffset: 44 }}
      axisLeft={{ tickValues: rankTicks(maxRank), tickSize: 0, tickPadding: 14, legend: 'POSITION', legendPosition: 'middle', legendOffset: -48 }}
      enableGridX={false}
      enableGridY
      curve="monotoneX"
      useMesh
      enableSlices={false}
      // Animated transitions between *different cohorts* can temporarily show
      // duplicate ranks or missing positions. Keep the ranking exact at all times.
      animate={false}
      tooltip={({ point }) => {
        const match = findRankingChartPoint(chartData, String(point.data.x), Number(point.data.y));
        return <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', width: 'max-content', maxWidth: 'calc(100vw - 24px)', bgcolor: '#fff', px: 1.5, py: 1.25, borderRadius: 2, boxShadow: 4, border: '1px solid #edf0f4' }}>
          <Typography variant="body2" fontWeight={800} sx={{ whiteSpace: 'nowrap' }}>{match?.country ?? 'Pays inconnu'} · {String(point.data.x)}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Position : <b>#{String(point.data.y)}</b></Typography>
          {match && <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>CA : {formatCurrency(match.point.revenue)}</Typography>}
        </Box>;
      }}
      theme={{
        background: '#ffffff',
        text: { fontSize: 12, fill: muiTheme.palette.text.secondary },
        axis: { domain: { line: { stroke: '#e7eaf1', strokeWidth: 1 } }, ticks: { text: { fontSize: 12, fill: '#64718a', fontWeight: 600 } }, legend: { text: { fontSize: 11, fill: '#9aa4b7', fontWeight: 700 } } },
        grid: { line: { stroke: '#eef0f5', strokeWidth: 1, strokeDasharray: '4 6' } },
      }}
    />
  </Box>;
}
