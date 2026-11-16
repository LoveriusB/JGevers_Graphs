import { Box, Paper, Typography } from '@mui/material';
import InsertChartOutlinedRounded from '@mui/icons-material/InsertChartOutlinedRounded';

type Props = { title: string; description: string };

export default function GraphPlaceholder({ title, description }: Props) {
  return (
    <Box>
      <Typography component="h1" variant="h4" fontWeight={650}>{title}</Typography>
      <Paper variant="outlined" sx={{ mt: 3, minHeight: 280, display: 'grid', placeItems: 'center', p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Box>
          <InsertChartOutlinedRounded sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6">Graphique à venir</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
