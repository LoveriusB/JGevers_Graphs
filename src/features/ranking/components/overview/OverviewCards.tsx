import { Box, Paper, Stack, Typography } from '@mui/material';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { getRankings } from '../../revenue/rankings';
import type { RevenueDataset } from '../../revenue/types';

interface Props { dataset: RevenueDataset; }
export function OverviewCards({ dataset }: Props) {
  const lastYear = dataset.years[dataset.years.length - 1];
  const leader = getRankings(dataset)[lastYear]?.[0]?.country ?? '—';
  const cards = [
    { label: 'PAYS ANALYSÉS', value: dataset.rows.length, icon: <PublicOutlinedIcon /> },
    { label: 'ANNÉES COMPARÉES', value: dataset.years.length, icon: <CalendarMonthOutlinedIcon /> },
    { label: `LEADER EN ${lastYear}`, value: leader, icon: <EmojiEventsOutlinedIcon /> },
  ];
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>{cards.map(({ label, value, icon }) => <Box key={label}><Paper variant="outlined" sx={{ p: 2.6, borderRadius: 3, height: '100%' }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Stack spacing={0.7}><Typography variant="overline" sx={{ letterSpacing: 1.15, fontSize: 10, fontWeight: 800, color: 'text.secondary' }}>{label}</Typography><Typography variant="h5">{value}</Typography></Stack><Stack sx={{ p: 1, borderRadius: 2, bgcolor: '#f0f2ff', color: 'primary.main' }}>{icon}</Stack></Stack></Paper></Box>)}</Box>;
}
