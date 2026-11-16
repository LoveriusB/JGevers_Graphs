import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4b5dd8' },
    background: { default: '#f5f7fb', paper: '#ffffff' },
    text: { primary: '#172239', secondary: '#768096' },
    divider: '#e9ecf3',
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.045em' },
    h5: { fontWeight: 750, letterSpacing: '-0.035em' },
    h6: { fontWeight: 750, letterSpacing: '-0.025em' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 11 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 650 } } },
  },
});
