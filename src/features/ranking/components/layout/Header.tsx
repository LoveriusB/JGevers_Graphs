import { AppBar, Box, Container, Stack, Typography } from '@mui/material';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export function Header() {
  return <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
    <Container maxWidth="xl" sx={{ py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" alignItems="center" spacing={1.4}>
        <Box sx={{ width: 39, height: 39, bgcolor: 'primary.main', borderRadius: 2.5, color: 'white', display: 'grid', placeItems: 'center' }}><InsightsRoundedIcon /></Box>
        <Box><Typography fontWeight={850} lineHeight={1.08} letterSpacing="-.035em">Graph Test</Typography><Typography variant="caption" color="text.secondary">ANALYSE DE CLASSEMENT</Typography></Box>
      </Stack>
      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: 'text.secondary' }}><LockOutlinedIcon sx={{ fontSize: 16 }}/><Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>Données traitées localement</Typography><Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' } }}>100 % local</Typography></Stack>
    </Container>
  </AppBar>;
}
